import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authRequired } from '../middleware/auth.js'

const router = Router()

// Middleware: require client role
function requireClient(req, res, next) {
  const isClient = req.user.userRoles?.some((ur) => ur.role.key === 'client')
  if (!isClient) return res.status(403).json({ error: 'Client portal access only' })
  if (!req.user.clientId) return res.status(403).json({ error: 'No client account linked' })
  next()
}

// GET /api/portal/dashboard - client's events, invoices, registrations
router.get('/dashboard', authRequired, requireClient, async (req, res) => {
  const clientId = req.user.clientId

  const [events, invoices, registrations] = await Promise.all([
    prisma.event.findMany({
      where: { clientId },
      include: { venue: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.invoice.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.registration.findMany({
      where: { event: { clientId } },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const totalBudget = events.reduce((sum, e) => sum + (e.budget || 0), 0)
  const totalSpent = events.reduce((sum, e) => sum + (e.spent || 0), 0)
  const totalInvoiced = invoices.reduce((sum, i) => sum + (i.amount || 0), 0)
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.amount || 0), 0)
  const outstanding = totalInvoiced - totalPaid

  res.json({
    client: { id: req.user.clientId, company: req.user.client?.company || '' },
    events,
    invoices,
    registrations,
    stats: {
      totalEvents: events.length,
      upcoming: events.filter(e => e.status === 'upcoming').length,
      ongoing: events.filter(e => e.status === 'ongoing').length,
      completed: events.filter(e => e.status === 'completed').length,
      totalBudget,
      totalSpent,
      totalInvoiced,
      totalPaid,
      outstanding,
    },
  })
})

// GET /api/portal/events - client's events only
router.get('/events', authRequired, requireClient, async (req, res) => {
  const events = await prisma.event.findMany({
    where: { clientId: req.user.clientId },
    include: { venue: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ events })
})

// POST /api/portal/events - client submits a new event for review
router.post('/events', authRequired, requireClient, async (req, res) => {
  try {
    const {
      name, category, date, time, endDate, endTime,
      budget, capacity, price, description, venueId,
      contactName, contactPhone, tags, notes,
    } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Event name is required' })
    }

    const clientId = req.user.clientId

    // Validate venue if provided
    let validVenueId = null
    if (venueId && typeof venueId === 'string' && venueId.trim()) {
      const existingVenue = await prisma.venue.findUnique({ where: { id: venueId.trim() } }).catch(() => null)
      if (existingVenue) validVenueId = existingVenue.id
    }

    const event = await prisma.event.create({
      data: {
        name: name.trim(),
        clientId,
        venueId: validVenueId,
        category: category || 'Conference',
        date: date || '',
        time: time || '09:00',
        endDate: endDate || '',
        endTime: endTime || '',
        budget: Number(budget) || 0,
        capacity: Number(capacity) || 0,
        price: Number(price) || 0,
        description: description || '',
        contactName: contactName || '',
        contactPhone: contactPhone || '',
        tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        status: 'pending_review',
        published: false,
        stage: 0,
        progress: 10,
        team: [],
      },
      include: { venue: true, client: true },
    })

    // Create approval request for event manager review
    await prisma.approvalRequest.create({
      data: {
        type: 'event',
        entityId: event.id,
        entityName: event.name,
        amount: Number(budget) || 0,
        status: 'pending',
        submittedBy: req.user.id,
        note: notes || `Client submitted event "${event.name}" for review`,
      },
    }).catch((err) => console.warn('Approval request creation error:', err))

    // Activity log
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        text: `Client submitted event for review: ${event.name}`,
        type: 'event',
        at: 'Just now',
      },
    }).catch(() => {})

    // Notification for managers
    await prisma.notification.create({
      data: {
        text: `New event "${event.name}" submitted by client awaiting review.`,
        type: 'approval',
        at: 'Just now',
        link: '/erp/admin/events',
      },
    }).catch(() => {})

    res.status(201).json({ event })
  } catch (err) {
    console.error('Client event creation error:', err)
    res.status(500).json({ error: err.message || 'Failed to submit event' })
  }
})

// GET /api/portal/invoices - client's invoices only
router.get('/invoices', authRequired, requireClient, async (req, res) => {
  const invoices = await prisma.invoice.findMany({
    where: { clientId: req.user.clientId },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ invoices })
})

// GET /api/portal/registrations - client's event registrations
router.get('/registrations', authRequired, requireClient, async (req, res) => {
  const registrations = await prisma.registration.findMany({
    where: { event: { clientId: req.user.clientId } },
    include: { event: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ registrations })
})

export default router
