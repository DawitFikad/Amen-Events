import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { attendeeRequired } from '../middleware/attendeeAuth.js'

const router = Router()

// ─── PUBLIC EVENT ROUTES ───────────────────────────────────────

// GET /api/portal/events — list events with filters
router.get('/events', async (req, res) => {
  const { category, search, sort, city } = req.query
  const where = { status: { in: ['upcoming', 'ongoing'] } }
  if (category && category !== 'all') where.category = { contains: category, mode: 'insensitive' }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ]
  }

  let orderBy = { date: 'asc' }
  if (sort === 'newest') orderBy = { createdAt: 'desc' }
  if (sort === 'price-low') orderBy = { budget: 'asc' }
  if (sort === 'price-high') orderBy = { budget: 'desc' }

  const events = await prisma.event.findMany({
    where,
    include: {
      client: { select: { company: true } },
      venue: { select: { name: true, city: true, capacity: true } },
      speakers: true,
      _count: { select: { registrations: true } },
    },
    orderBy,
  })

  let filtered = events
  if (city && city !== 'all') {
    filtered = filtered.filter((e) => e.venue?.city?.toLowerCase().includes(city.toLowerCase()))
  }

  if (sort === 'popular') {
    filtered = [...filtered].sort((a, b) => (b._count?.registrations || 0) - (a._count?.registrations || 0))
  }

  res.json({ events: filtered })
})

// GET /api/portal/events/:id — single event detail
router.get('/events/:id', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        client: { select: { company: true } },
        venue: { select: { name: true, city: true, capacity: true } },
        speakers: true,
        reviews: { include: { attendee: { select: { firstName: true, lastName: true, avatar: true } } }, orderBy: { createdAt: 'desc' }, take: 10 },
        _count: { select: { registrations: true } },
      },
    })
    if (!event) return res.status(404).json({ error: 'Event not found' })
    res.json({ event })
  } catch (err) {
    console.error('Event detail error:', err.message)
    res.status(500).json({ error: 'Failed to load event', detail: err.message })
  }
})

// GET /api/portal/categories — unique categories
router.get('/categories', async (req, res) => {
  const events = await prisma.event.findMany({
    where: { status: { in: ['upcoming', 'ongoing'] } },
    select: { category: true },
    distinct: ['category'],
  })
  const categories = events.map((e) => e.category).filter(Boolean)
  res.json({ categories })
})

// ─── AUTHENTICATED ROUTES ──────────────────────────────────────

// GET /api/portal/my-tickets
router.get('/my-tickets', attendeeRequired, async (req, res) => {
  const attendee = await prisma.attendee.findUnique({ where: { id: req.attendeeId }, select: { email: true } })
  const registrations = await prisma.registration.findMany({
    where: { email: attendee.email },
    include: { event: { include: { venue: { select: { name: true, city: true } } } } },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ tickets: registrations })
})

// GET /api/portal/my-events
router.get('/my-events', attendeeRequired, async (req, res) => {
  const attendee = await prisma.attendee.findUnique({ where: { id: req.attendeeId }, select: { email: true } })
  const registrations = await prisma.registration.findMany({
    where: { email: attendee.email },
    include: { event: { include: { venue: { select: { name: true, city: true } }, client: { select: { company: true } } } } },
    orderBy: { createdAt: 'desc' },
  })
  const events = registrations.map((r) => ({
    ...r.event,
    registration: { id: r.id, qr: r.qr, type: r.type, checkedIn: r.checkedIn, amount: r.amount, paid: r.paid },
  }))
  res.json({ events })
})

// GET /api/portal/orders
router.get('/orders', attendeeRequired, async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { attendeeId: req.attendeeId },
    include: {
      event: { select: { name: true, date: true, venue: { select: { name: true, city: true } } } },
      items: true,
      payments: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ orders })
})

// POST /api/portal/orders
router.post('/orders', attendeeRequired, async (req, res) => {
  const { eventId, items, couponCode } = req.body
  if (!eventId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Event ID and items are required' })
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } })
  if (!event) return res.status(404).json({ error: 'Event not found' })

  let subtotal = 0
  for (const item of items) {
    subtotal += (item.unitPrice || 0) * (item.quantity || 1)
  }
  const tax = Math.round(subtotal * 0.15)
  let discount = 0
  if (couponCode) {
    const coupon = await prisma.coupon.findFirst({ where: { code: couponCode, status: 'active' } }).catch(() => null)
    if (coupon) {
      const pct = parseFloat(coupon.value) || 0
      discount = Math.round(subtotal * (pct / 100))
    }
  }
  const total = subtotal + tax - discount

  const order = await prisma.order.create({
    data: {
      attendeeId: req.attendeeId,
      eventId,
      status: 'pending',
      subtotal,
      tax,
      discount,
      total,
      couponCode: couponCode || '',
      items: {
        create: items.map((item) => ({
          ticketType: item.ticketType || 'Standard',
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          lineTotal: (item.unitPrice || 0) * (item.quantity || 1),
        })),
      },
    },
    include: { items: true },
  })

  res.json({ order })
})

// POST /api/portal/orders/:id/pay — mock payment
router.post('/orders/:id/pay', attendeeRequired, async (req, res) => {
  const { method } = req.body
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  })
  if (!order) return res.status(404).json({ error: 'Order not found' })
  if (order.attendeeId !== req.attendeeId) return res.status(403).json({ error: 'Not your order' })
  if (order.status === 'paid') return res.status(400).json({ error: 'Order already paid' })

  const success = Math.random() > 0.1
  const reference = 'PAY-' + Math.random().toString(36).slice(2, 8).toUpperCase()

  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      amount: order.total,
      method: method || 'mock',
      status: success ? 'success' : 'failed',
      reference,
    },
  })

  if (success) {
    await prisma.order.update({ where: { id: order.id }, data: { status: 'paid' } })

    const attendee = await prisma.attendee.findUnique({ where: { id: req.attendeeId } })
    for (const item of order.items) {
      for (let i = 0; i < item.quantity; i++) {
        const qr = 'AE-REG-' + Math.random().toString(36).slice(2, 6).toUpperCase()
        await prisma.registration.create({
          data: {
            eventId: order.eventId,
            name: `${attendee.firstName} ${attendee.lastName}`,
            email: attendee.email,
            type: item.ticketType,
            amount: item.unitPrice,
            paid: true,
            qr,
          },
        })
      }
    }
  }

  res.json({ payment, success })
})

// GET /api/portal/payments
router.get('/payments', attendeeRequired, async (req, res) => {
  const payments = await prisma.payment.findMany({
    where: { order: { attendeeId: req.attendeeId } },
    include: { order: { include: { event: { select: { name: true, date: true } } } } },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ payments })
})

// ─── WISHLIST ──────────────────────────────────────────────────

router.get('/wishlist', attendeeRequired, async (req, res) => {
  const wishlist = await prisma.wishlist.findMany({
    where: { attendeeId: req.attendeeId },
    include: { event: { include: { venue: { select: { name: true, city: true } }, _count: { select: { registrations: true } } } } },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ wishlist })
})

router.post('/wishlist', attendeeRequired, async (req, res) => {
  const { eventId } = req.body
  if (!eventId) return res.status(400).json({ error: 'Event ID required' })

  const existing = await prisma.wishlist.findUnique({
    where: { attendeeId_eventId: { attendeeId: req.attendeeId, eventId } },
  })
  if (existing) return res.status(409).json({ error: 'Already in wishlist' })

  const item = await prisma.wishlist.create({
    data: { attendeeId: req.attendeeId, eventId },
  })
  res.json({ wishlist: item })
})

router.delete('/wishlist/:eventId', attendeeRequired, async (req, res) => {
  await prisma.wishlist.deleteMany({
    where: { attendeeId: req.attendeeId, eventId: req.params.eventId },
  })
  res.json({ success: true })
})

// ─── REVIEWS ───────────────────────────────────────────────────

router.get('/events/:id/reviews', async (req, res) => {
  const reviews = await prisma.review.findMany({
    where: { eventId: req.params.id },
    include: { attendee: { select: { firstName: true, lastName: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ reviews })
})

router.post('/events/:id/reviews', attendeeRequired, async (req, res) => {
  const { rating, comment } = req.body
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating (1-5) is required' })
  }

  const review = await prisma.review.create({
    data: {
      eventId: req.params.id,
      attendeeId: req.attendeeId,
      rating: parseInt(rating),
      comment: comment || '',
    },
    include: { attendee: { select: { firstName: true, lastName: true, avatar: true } } },
  })
  res.json({ review })
})

// ─── NOTIFICATIONS ─────────────────────────────────────────────

router.get('/notifications', attendeeRequired, async (req, res) => {
  const attendee = await prisma.attendee.findUnique({ where: { id: req.attendeeId }, select: { email: true } })
  const orders = await prisma.order.findMany({
    where: { attendeeId: req.attendeeId },
    include: { event: { select: { name: true, date: true } } },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })
  const registrations = await prisma.registration.findMany({
    where: { email: attendee.email },
    include: { event: { select: { name: true, date: true } } },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  const notifications = []
  for (const order of orders) {
    notifications.push({
      id: 'order-' + order.id,
      type: 'order',
      title: `Order ${order.status === 'paid' ? 'confirmed' : 'pending'}`,
      message: `${order.event.name} — ETB ${order.total.toLocaleString()}`,
      date: order.createdAt,
      read: false,
    })
  }
  for (const reg of registrations) {
    notifications.push({
      id: 'reg-' + reg.id,
      type: 'registration',
      title: `Registration ${reg.checkedIn ? 'checked in' : 'confirmed'}`,
      message: `${reg.event.name} — QR: ${reg.qr}`,
      date: reg.createdAt,
      read: false,
    })
  }

  notifications.sort((a, b) => new Date(b.date) - new Date(a.date))
  res.json({ notifications })
})

export default router
