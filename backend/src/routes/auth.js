import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import prisma from '../lib/prisma.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt.js'
import { authRequired } from '../middleware/auth.js'
import { sendOtpEmail } from '../lib/email.js'

const router = Router()

// In-memory OTP storage: email -> { code, expiresAt, verified }
const otpStore = new Map()

const MAX_FAILED_ATTEMPTS = 5
const LOCK_DURATION_MINUTES = 15

// Password complexity validation
function validatePasswordComplexity(password) {
  if (password.length < 8) return 'Password must be at least 8 characters'
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter'
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter'
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number'
  return null
}

// Helper: get client IP
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || ''
}

// Helper: record login history
async function recordLogin(userId, email, success, req, reason = '') {
  await prisma.loginHistory.create({
    data: {
      userId,
      email,
      success,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
      reason,
    },
  })
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const normalizedEmail = email.toLowerCase().trim()
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: {
      userRoles: {
        include: {
          role: {
            include: { rolePerms: { include: { permission: true } } },
          },
        },
      },
    },
  })

  // User not found
  if (!user) {
    await recordLogin(null, normalizedEmail, false, req, 'user_not_found')
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  // Check account lock
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const remaining = Math.ceil((user.lockedUntil - new Date()) / 60000)
    await recordLogin(user.id, normalizedEmail, false, req, 'account_locked')
    return res.status(423).json({
      error: `Account locked due to repeated failed attempts. Try again in ${remaining} minute${remaining > 1 ? 's' : ''}.`,
    })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    const newAttempts = user.failedAttempts + 1
    const shouldLock = newAttempts >= MAX_FAILED_ATTEMPTS

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedAttempts: shouldLock ? 0 : newAttempts,
        lockedUntil: shouldLock ? new Date(Date.now() + LOCK_DURATION_MINUTES * 60000) : user.lockedUntil,
      },
    })

    await recordLogin(user.id, normalizedEmail, false, req, shouldLock ? 'account_locked' : 'wrong_password')

    if (shouldLock) {
      return res.status(423).json({
        error: `Account locked for ${LOCK_DURATION_MINUTES} minutes due to ${MAX_FAILED_ATTEMPTS} failed attempts.`,
      })
    }

    const remaining = MAX_FAILED_ATTEMPTS - newAttempts
    return res.status(401).json({
      error: `Invalid credentials. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining before account lock.`,
    })
  }

  // Success - reset failed attempts
  await prisma.user.update({
    where: { id: user.id },
    data: { failedAttempts: 0, lockedUntil: null },
  })

  const accessToken = signAccessToken(user.id)
  const refreshToken = signRefreshToken(user.id)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)
  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt },
  })

  await prisma.activityLog.create({
    data: { userId: user.id, text: 'Signed in to the workspace', type: 'general', at: 'Just now' },
  })

  await recordLogin(user.id, normalizedEmail, true, req, 'success')

  const { passwordHash, ...userWithoutHash } = user
  res.json({ user: userWithoutHash, accessToken, refreshToken })
})

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' })

  try {
    const payload = verifyRefreshToken(refreshToken)
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } })
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' })
    }
    const accessToken = signAccessToken(payload.userId)
    res.json({ accessToken })
  } catch (err) {
    return res.status(401).json({ error: 'Invalid refresh token' })
  }
})

// POST /api/auth/logout
router.post('/logout', authRequired, async (req, res) => {
  const { refreshToken } = req.body
  if (refreshToken) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken, userId: req.user.id },
      data: { revoked: true },
    })
  }
  await prisma.activityLog.create({
    data: { userId: req.user.id, text: 'Signed out', type: 'general', at: 'Just now' },
  })
  res.json({ success: true })
})

// GET /api/auth/me
router.get('/me', authRequired, async (req, res) => {
  const { passwordHash, ...userWithoutHash } = req.user
  res.json({ user: userWithoutHash })
})

// PUT /api/auth/profile - update own profile
router.put('/profile', authRequired, async (req, res) => {
  const { name, phone, dept, jobTitle, bio, avatar } = req.body
  const data = {}
  if (name !== undefined) data.name = name
  if (phone !== undefined) data.phone = phone
  if (dept !== undefined) data.dept = dept
  if (jobTitle !== undefined) data.jobTitle = jobTitle
  if (bio !== undefined) data.bio = bio
  if (avatar !== undefined) data.avatar = avatar
  if (name !== undefined) {
    data.initials = name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
  }

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data,
    select: { id: true, email: true, name: true, initials: true, color: true, phone: true, dept: true, jobTitle: true, type: true, status: true, bio: true, avatar: true, twoStepEnabled: true },
  })
  res.json({ user: updated })
})

// PUT /api/auth/password - change password
router.put('/password', authRequired, async (req, res) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required' })
  }
  const pwError = validatePasswordComplexity(newPassword)
  if (pwError) return res.status(400).json({ error: pwError })
  const valid = await bcrypt.compare(currentPassword, req.user.passwordHash)
  if (!valid) return res.status(401).json({ error: 'Current password is incorrect' })

  const hash = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({
    where: { id: req.user.id },
    data: { passwordHash: hash },
  })

  // Revoke all refresh tokens (force re-login on other devices)
  await prisma.refreshToken.updateMany({
    where: { userId: req.user.id, revoked: false },
    data: { revoked: true },
  })

  await prisma.activityLog.create({
    data: { userId: req.user.id, text: 'Password changed', type: 'security', at: 'Just now' },
  })

  res.json({ success: true })
})

// PUT /api/auth/two-step - toggle 2-step verification
router.put('/two-step', authRequired, async (req, res) => {
  const { enabled } = req.body
  await prisma.user.update({
    where: { id: req.user.id },
    data: { twoStepEnabled: !!enabled },
  })
  await prisma.activityLog.create({
    data: { userId: req.user.id, text: `2-step verification ${enabled ? 'enabled' : 'disabled'}`, type: 'security', at: 'Just now' },
  })
  res.json({ success: true, twoStepEnabled: !!enabled })
})

// GET /api/auth/login-history - get own login history
router.get('/login-history', authRequired, async (req, res) => {
  const history = await prisma.loginHistory.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  res.json({ history })
})

// POST /api/auth/forgot-password - request password reset
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email is required' })

  const normalizedEmail = email.toLowerCase().trim()
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })

  // Always return success (don't leak whether email exists)
  if (!user) return res.json({ success: true })

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 1)

  await prisma.passwordReset.create({
    data: { token, userId: user.id, expiresAt },
  })

  // In production: send email with reset link
  // For demo: return the token so frontend can use it
  await prisma.activityLog.create({
    data: { userId: user.id, text: 'Password reset requested', type: 'security', at: 'Just now' },
  })

  res.json({ success: true, resetToken: token })
})

// POST /api/auth/reset-password - reset password with token
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' })
  }
  const pwError = validatePasswordComplexity(newPassword)
  if (pwError) return res.status(400).json({ error: pwError })

  const reset = await prisma.passwordReset.findUnique({ where: { token } })
  if (!reset || reset.used || reset.expiresAt < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired reset token' })
  }

  const hash = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({
    where: { id: reset.userId },
    data: { passwordHash: hash, failedAttempts: 0, lockedUntil: null },
  })

  await prisma.passwordReset.update({
    where: { id: reset.id },
    data: { used: true },
  })

  // Revoke all refresh tokens
  await prisma.refreshToken.updateMany({
    where: { userId: reset.userId, revoked: false },
    data: { revoked: true },
  })

  await prisma.activityLog.create({
    data: { userId: reset.userId, text: 'Password reset via email', type: 'security', at: 'Just now' },
  })

  res.json({ success: true })
})

// POST /api/auth/send-otp - generate and send 6-digit OTP via Gmail SMTP
router.post('/send-otp', async (req, res) => {
  try {
    const { email, purpose = 'Client Registration' } = req.body
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ error: 'Valid email address is required' })
    }
    const normalizedEmail = email.toLowerCase().trim()
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes

    otpStore.set(normalizedEmail, { code, expiresAt, verified: false })

    try {
      await sendOtpEmail(normalizedEmail, code, purpose)
    } catch (mailErr) {
      console.error('Failed to send OTP email via SMTP:', mailErr)
      return res.json({
        success: true,
        message: 'Verification code generated',
        previewCode: process.env.NODE_ENV !== 'production' ? code : undefined,
      })
    }

    res.json({ success: true, message: 'Verification code sent to your email' })
  } catch (err) {
    console.error('send-otp error:', err)
    res.status(500).json({ error: 'Failed to send verification code' })
  }
})

// POST /api/auth/verify-otp - verify submitted 6-digit OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP code are required' })
    }
    const normalizedEmail = email.toLowerCase().trim()
    const entry = otpStore.get(normalizedEmail)

    if (!entry) {
      return res.status(400).json({ error: 'No verification code requested for this email' })
    }
    if (Date.now() > entry.expiresAt) {
      otpStore.delete(normalizedEmail)
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' })
    }
    if (entry.code !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid verification code' })
    }

    entry.verified = true
    otpStore.set(normalizedEmail, entry)

    res.json({ success: true, message: 'Email verified successfully' })
  } catch (err) {
    console.error('verify-otp error:', err)
    res.status(500).json({ error: 'Failed to verify code' })
  }
})

// POST /api/auth/client-register - complete client registration with optional advance payment
router.post('/client-register', async (req, res) => {
  try {
    const {
      company,
      contactPerson,
      email,
      phone,
      password,
      industry = 'Corporate',
      city = 'Addis Ababa',
      paymentMethod,
      transactionId,
      amount = 0,
      receiptUrl,
    } = req.body

    if (!company || !email || !password) {
      return res.status(400).json({ error: 'Company name, email, and password are required' })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const pwError = validatePasswordComplexity(password)
    if (pwError) return res.status(400).json({ error: pwError })

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)
    const initials = (contactPerson || company).split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()

    // Create client record
    const client = await prisma.client.create({
      data: {
        company,
        contactPerson: contactPerson || company,
        email: normalizedEmail,
        phone: phone || '',
        industry,
        city,
        stage: paymentMethod && transactionId ? 'qualified' : 'lead',
        status: 'active',
        totalValue: Number(amount) || 0,
      },
    })

    // Create user record linked to client
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: contactPerson || company,
        initials,
        passwordHash,
        phone: phone || '',
        type: 'Client',
        status: 'active',
        clientId: client.id,
      },
    })

    // Assign Client role if exists
    const clientRole = await prisma.role.findUnique({ where: { key: 'client' } })
    if (clientRole) {
      await prisma.userRole.create({
        data: { userId: user.id, roleId: clientRole.id },
      }).catch(() => {})
    }

    // If advance payment was provided, create invoice & record
    if (paymentMethod && transactionId && Number(amount) > 0) {
      await prisma.invoice.create({
        data: {
          clientId: client.id,
          amount: Number(amount),
          paid: Number(amount),
          status: 'paid',
          ref: transactionId,
          dueDate: new Date().toISOString().split('T')[0],
        },
      }).catch(() => {})
    }

    // Create admin notification
    await prisma.notification.create({
      data: {
        text: `New Client Registered: ${company} (${contactPerson || 'Contact'})${paymentMethod ? ` with ${paymentMethod.toUpperCase()} advance payment of ${amount} ETB (TxID: ${transactionId})` : ''}`,
        type: 'client',
        at: 'Just now',
        link: '/crm',
      },
    }).catch(() => {})

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        text: `Client registered: ${company}`,
        type: 'crm',
        at: 'Just now',
      },
    }).catch(() => {})

    // Clear OTP entry
    otpStore.delete(normalizedEmail)

    // Issue tokens for immediate login
    const accessToken = signAccessToken(user.id)
    const refreshToken = signRefreshToken(user.id)

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt },
    }).catch(() => {})

    const { passwordHash: _, ...userWithoutHash } = user
    res.status(201).json({
      success: true,
      user: { ...userWithoutHash, client },
      accessToken,
      refreshToken,
      client,
    })
  } catch (err) {
    console.error('client-register error:', err)
    res.status(500).json({ error: 'Failed to register client: ' + (err.message || err) })
  }
})

export default router
