import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authRequired } from '../middleware/auth.js'
import { requirePermission } from '../middleware/rbac.js'
import { autoAdvance } from './workflow.js'

const router = Router()

// Registrations
router.get('/', authRequired, requirePermission('ticketing', 'view'), async (req, res) => {
  const isAdmin = req.user.userRoles?.some((ur) => ur.role.key === 'admin')
  const where = isAdmin ? {} : {
    event: { OR: [{ pmId: req.user.id }, { team: { has: req.user.id } }] },
  }
  const registrations = await prisma.registration.findMany({ where, orderBy: { createdAt: 'desc' } })
  res.json({ registrations })
})

router.post('/', authRequired, requirePermission('ticketing', 'create'), async (req, res) => {
  const { eventId, name, email, type, amount, paid } = req.body
  if (!eventId || !name) {
    return res.status(400).json({ error: 'Event ID and attendee name are required' })
  }
  const qr = 'AE-REG-' + Math.random().toString(36).slice(2, 6).toUpperCase()
  const reg = await prisma.registration.create({
    data: { eventId, name, email, type, amount: Number(amount) || 0, paid: !!paid, qr },
  })
  await prisma.activityLog.create({
    data: { userId: req.user.id, text: `Registration added: ${name} (${type})`, type: 'registration', at: 'Just now' },
  })
  if (eventId) await autoAdvance(eventId, req.user.id)
  res.json({ registration: reg })
})

// Check-in
router.post('/checkin', authRequired, requirePermission('checkin', 'create'), async (req, res) => {
  const { qr } = req.body
  const reg = await prisma.registration.findUnique({ where: { qr } })
  if (!reg) return res.status(404).json({ error: 'not-found' })
  if (reg.checkedIn) return res.status(409).json({ error: 'duplicate', registration: reg })
  const updated = await prisma.registration.update({ where: { id: reg.id }, data: { checkedIn: true } })
  await prisma.activityLog.create({
    data: { userId: req.user.id, text: `QR check-in recorded for ${reg.name}`, type: 'checkin', at: 'Just now' },
  })
  if (reg.eventId) await autoAdvance(reg.eventId, req.user.id)
  res.json({ registration: updated })
})

export default router
