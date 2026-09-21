import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authRequired } from '../middleware/auth.js'

const router = Router()

// GET /api/calendar - aggregate all calendar items
router.get('/', authRequired, async (req, res) => {
  const { month, year } = req.query
  const isAdmin = req.user.userRoles?.some((ur) => ur.role.key === 'admin')
  const eventFilter = isAdmin ? {} : { OR: [{ pmId: req.user.id }, { team: { has: req.user.id } }] }

  // Fetch events
  const events = await prisma.event.findMany({
    where: eventFilter,
    select: { id: true, name: true, date: true, time: true, status: true, venueId: true },
  })

  // Fetch tasks with due dates
  const tasks = await prisma.task.findMany({
    where: { due: { not: '' }, ...(isAdmin ? {} : { OR: [{ assigneeId: req.user.id }, { event: eventFilter }] }) },
    select: { id: true, title: true, due: true, status: true, eventId: true },
  })

  // Fetch venue bookings (events with venueId)
  const venueBookings = events.filter((e) => e.venueId).map((e) => ({
    id: `vb-${e.id}`, title: e.name, type: 'venue_booking',
    date: e.date, time: e.time, entityId: e.id, color: 'bg-gold-600',
  }))

  // Fetch registrations (as event-live markers)
  const registrations = await prisma.registration.findMany({
    where: { event: eventFilter },
    select: { id: true, name: true, event: { select: { id: true, name: true, date: true } } },
  })

  // Build calendar items
  const calendarEvents = [
    ...events.map((e) => ({
      id: `ev-${e.id}`, title: e.name, type: 'event',
      date: e.date, time: e.time, entityId: e.id, color: 'bg-brand-600',
    })),
    ...tasks.map((t) => ({
      id: `tk-${t.id}`, title: t.title, type: 'task',
      date: t.due, time: '', entityId: t.id, color: 'bg-gold-500',
    })),
    ...venueBookings,
    ...registrations.map((r) => ({
      id: `rg-${r.id}`, title: `Registration: ${r.name}`, type: 'registration',
      date: r.event?.date || '', time: '', entityId: r.id, color: 'bg-sky-600',
    })),
  ]

  // Filter by month/year if provided
  const filtered = month && year
    ? calendarEvents.filter((c) => {
        if (!c.date) return false
        const d = new Date(c.date + 'T00:00')
        return d.getMonth() === Number(month) && d.getFullYear() === Number(year)
      })
    : calendarEvents.filter((c) => c.date)

  res.json({ events: filtered })
})

// POST /api/calendar - create a custom calendar event (meeting, etc.)
router.post('/', authRequired, async (req, res) => {
  const { title, type, date, endDate, time, endTime, location, notes, color } = req.body
  const calEvent = await prisma.calendarEvent.create({
    data: {
      title, type: type || 'meeting', date, endDate: endDate || null,
      time: time || '', endTime: endTime || '', location: location || '',
      notes: notes || '', color: color || 'bg-brand-600', userId: req.user.id,
    },
  })
  res.json({ event: calEvent })
})

// DELETE /api/calendar/:id
router.delete('/:id', authRequired, async (req, res) => {
  await prisma.calendarEvent.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

export default router
