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
