import { Router } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma.js'
import { signAttendeeToken, attendeeRequired } from '../middleware/attendeeAuth.js'

const router = Router()

function validatePassword(pw) {
  if (pw.length < 6) return 'Password must be at least 6 characters'
  return null
}

// POST /api/portal/auth/register
router.post('/register', async (req, res) => {
  const { firstName, lastName, email, phone, password, avatar } = req.body
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: 'First name, last name, email, and password are required' })
  }
  const pwError = validatePassword(password)
  if (pwError) return res.status(400).json({ error: pwError })

  const normalizedEmail = email.toLowerCase().trim()
  const existing = await prisma.attendee.findUnique({ where: { email: normalizedEmail } })
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' })
  }

  const hash = await bcrypt.hash(password, 10)
  const attendee = await prisma.attendee.create({
    data: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      phone: phone || '',
      avatar: avatar || '',
      passwordHash: hash,
    },
  })

  const token = signAttendeeToken(attendee.id)
  const { passwordHash, ...safe } = attendee
  res.json({ attendee: safe, token })
})

// POST /api/portal/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const normalizedEmail = email.toLowerCase().trim()
  const attendee = await prisma.attendee.findUnique({ where: { email: normalizedEmail } })
  if (!attendee) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }
  if (attendee.status === 'suspended') {
    return res.status(403).json({ error: 'Account suspended. Contact support.' })
  }

  const valid = await bcrypt.compare(password, attendee.passwordHash)
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const token = signAttendeeToken(attendee.id)
  const { passwordHash, ...safe } = attendee
  res.json({ attendee: safe, token })
})

// GET /api/portal/auth/me
router.get('/me', attendeeRequired, async (req, res) => {
  const attendee = await prisma.attendee.findUnique({ where: { id: req.attendeeId } })
  if (!attendee) return res.status(404).json({ error: 'Account not found' })
  const { passwordHash, ...safe } = attendee
  res.json({ attendee: safe })
})

// PUT /api/portal/auth/profile
router.put('/profile', attendeeRequired, async (req, res) => {
  const { firstName, lastName, phone, avatar } = req.body
  const data = {}
  if (firstName !== undefined) data.firstName = firstName
  if (lastName !== undefined) data.lastName = lastName
  if (phone !== undefined) data.phone = phone
  if (avatar !== undefined) data.avatar = avatar

  const updated = await prisma.attendee.update({
    where: { id: req.attendeeId },
    data,
  })
  const { passwordHash, ...safe } = updated
  res.json({ attendee: safe })
})

// PUT /api/portal/auth/password
router.put('/password', attendeeRequired, async (req, res) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required' })
  }
  const pwError = validatePassword(newPassword)
  if (pwError) return res.status(400).json({ error: pwError })

  const attendee = await prisma.attendee.findUnique({ where: { id: req.attendeeId } })
  const valid = await bcrypt.compare(currentPassword, attendee.passwordHash)
  if (!valid) return res.status(401).json({ error: 'Current password is incorrect' })

  const hash = await bcrypt.hash(newPassword, 10)
  await prisma.attendee.update({
    where: { id: req.attendeeId },
    data: { passwordHash: hash },
  })
  res.json({ success: true })
})

// PUT /api/portal/auth/notifications
router.put('/notifications', attendeeRequired, async (req, res) => {
  const { notifications } = req.body
  if (!Array.isArray(notifications)) {
    return res.status(400).json({ error: 'Notifications must be an array' })
  }
  const updated = await prisma.attendee.update({
    where: { id: req.attendeeId },
    data: { notifications },
  })
  res.json({ notifications: updated.notifications })
})

// DELETE /api/portal/auth/account
router.delete('/account', attendeeRequired, async (req, res) => {
  await prisma.attendee.delete({ where: { id: req.attendeeId } })
  res.json({ success: true })
})

export default router
