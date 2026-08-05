import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authRequired } from '../middleware/auth.js'
import { requirePermission } from '../middleware/rbac.js'

const router = Router()

// Users (staff)
router.get('/', authRequired, requirePermission('staff', 'view'), async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, initials: true, color: true, phone: true, dept: true, jobTitle: true, type: true, status: true, twoStepEnabled: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ users })
})

router.post('/', authRequired, requirePermission('staff', 'create'), async (req, res) => {
  const { name, email, password, dept, jobTitle, phone, type, roleId } = req.body
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' })
  }
  const normalizedEmail = email.toLowerCase().trim()
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (existing) {
    return res.status(409).json({ error: 'A user with this email already exists' })
  }
  const bcrypt = await import('bcryptjs')
  const hash = await bcrypt.default.hash(password || 'demo@amen', 10)
  const initials = name.split(' ').map(p => p[0]).slice(0, 2).join('')
  const user = await prisma.user.create({
    data: { name, email: normalizedEmail, passwordHash: hash, initials, dept, jobTitle, phone, type },
  })
  if (roleId) {
    await prisma.userRole.create({ data: { userId: user.id, roleId } })
  }
  await prisma.activityLog.create({
    data: { userId: req.user.id, text: `Team member added: ${name}`, type: 'staff', at: 'Just now' },
  })
  res.json({ user })
})

router.put('/:id', authRequired, requirePermission('staff', 'edit'), async (req, res) => {
  const { name, email, dept, jobTitle, phone, type, status } = req.body
  const data = {}
  if (name !== undefined) { data.name = name; data.initials = name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() }
  if (email !== undefined) {
    const normalizedEmail = email.toLowerCase().trim()
    const existing = await prisma.user.findFirst({ where: { email: normalizedEmail, NOT: { id: req.params.id } } })
    if (existing) return res.status(409).json({ error: 'Email already in use by another user' })
    data.email = normalizedEmail
  }
  if (dept !== undefined) data.dept = dept
  if (jobTitle !== undefined) data.jobTitle = jobTitle
  if (phone !== undefined) data.phone = phone
  if (type !== undefined) data.type = type
  if (status !== undefined) data.status = status
  const user = await prisma.user.update({ where: { id: req.params.id }, data })
  res.json({ user })
})

router.delete('/:id', authRequired, requirePermission('staff', 'delete'), async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

// Roles
router.get('/roles', authRequired, async (req, res) => {
  const roles = await prisma.role.findMany({
    include: { rolePerms: { include: { permission: true } } },
  })
  res.json({ roles })
})

router.post('/roles', authRequired, requirePermission('admin', 'manage'), async (req, res) => {
  const { key, label, description } = req.body
  const role = await prisma.role.create({ data: { key, label, description } })
  res.json({ role })
})

// Permissions
router.get('/permissions', authRequired, async (req, res) => {
  const permissions = await prisma.permission.findMany()
  res.json({ permissions })
})

export default router
