import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authRequired } from '../middleware/auth.js'
import { requirePermission } from '../middleware/rbac.js'
import { autoAdvance } from './workflow.js'

const router = Router()

// Registrations
router.get('/', authRequired, requirePermission('ticketing', 'view'), async (req, res) => {
  const registrations = await prisma.registration.findMany({ include: { event: true }, orderBy: { createdAt: 'desc' } })
  res.json({ registrations })
})

router.post('/', authRequired, requirePermission('ticketing', 'create'), async (req, res) => {
  const { eventId, name, email, phone, type, amount, paid, paymentMethod } = req.body
  if (!name) {
    return res.status(400).json({ error: 'Attendee name is required' })
  }
  let validEventId = null
  if (eventId && typeof eventId === 'string' && eventId.trim()) {
    const existingEvent = await prisma.event.findUnique({ where: { id: eventId } }).catch(() => null)
    if (existingEvent) validEventId = existingEvent.id
  }
  const qr = 'AE-REG-' + Math.random().toString(36).slice(2, 6).toUpperCase()
  const reg = await prisma.registration.create({
    data: { eventId: validEventId, name, email: email || '', phone: phone || '', type: type || 'Standard', amount: Number(amount) || 0, paid: !!paid, paymentMethod: paymentMethod || 'Cash', qr },
    include: { event: true },
  })
  await prisma.activityLog.create({
    data: { userId: req.user.id, text: `Registration added: ${name} (${type || 'Standard'})`, type: 'registration', at: 'Just now' },
  })
  if (validEventId) await autoAdvance(validEventId, req.user.id)
  res.json({ registration: reg })
})

// Check-in
router.post('/checkin', authRequired, requirePermission('checkin', 'create'), async (req, res) => {
  const { qr } = req.body
  const reg = await prisma.registration.findUnique({ where: { qr } })
  if (!reg) return res.status(404).json({ error: 'not-found' })
  if (reg.checkedIn) return res.status(409).json({ error: 'duplicate', registration: reg })
  const updated = await prisma.registration.update({
    where: { id: reg.id },
    data: { checkedIn: true, checkedInAt: new Date().toLocaleString() },
  })
  await prisma.activityLog.create({
    data: { userId: req.user.id, text: `QR check-in recorded for ${reg.name}`, type: 'checkin', at: 'Just now' },
  })
  if (reg.eventId) await autoAdvance(reg.eventId, req.user.id)
  res.json({ registration: updated })
})

export default router
