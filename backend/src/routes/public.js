import { Router } from 'express'
import prisma from '../lib/prisma.js'

const router = Router()

// Public: list upcoming events
router.get('/events', async (req, res) => {
  const events = await prisma.event.findMany({
    where: { status: { in: ['upcoming', 'ongoing'] } },
    include: {
      client: { select: { company: true } },
      venue: { select: { name: true, city: true } },
      _count: { select: { registrations: true } },
    },
    orderBy: { date: 'asc' },
  })
  res.json({ events })
})

// Public: single event details
router.get('/events/:id', async (req, res) => {
  const event = await prisma.event.findUnique({
    where: { id: req.params.id },
    include: {
      client: { select: { company: true } },
      venue: { select: { name: true, city: true, capacity: true } },
      speakers: true,
      registrations: { select: { id: true } },
    },
  })
  if (!event) return res.status(404).json({ error: 'Event not found' })
  res.json({ event })
})

// Public: register for an event (purchase ticket)
router.post('/register', async (req, res) => {
  const { eventId, name, email, phone, type, amount } = req.body
  if (!eventId || !name || !email) {
    return res.status(400).json({ error: 'Event ID, name, and email are required' })
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } })
  if (!event) return res.status(404).json({ error: 'Event not found' })
  if (event.status === 'completed' || event.status === 'cancelled') {
    return res.status(400).json({ error: 'Registration is closed for this event' })
  }

  // Check for duplicate registration (same email + event)
  const existing = await prisma.registration.findFirst({
    where: { eventId, email: email.toLowerCase() },
  })
  if (existing) {
    return res.status(409).json({ error: 'You are already registered for this event', registration: existing })
  }

  const qr = 'AE-REG-' + Math.random().toString(36).slice(2, 6).toUpperCase()
  const reg = await prisma.registration.create({
    data: {
      eventId,
      name,
      email: email.toLowerCase(),
      type: type || 'Standard',
      amount: Number(amount) || 0,
      paid: false,
      qr,
    },
  })

  res.json({ registration: reg })
})

export default router
