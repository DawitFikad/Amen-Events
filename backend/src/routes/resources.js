import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authRequired } from '../middleware/auth.js'
import { requirePermission } from '../middleware/rbac.js'
import { autoAdvance } from './workflow.js'

const router = Router()

router.get('/', authRequired, requirePermission('resources', 'view'), async (req, res) => {
  const isAdmin = req.user.userRoles?.some((ur) => ur.role.key === 'admin')
  const where = isAdmin ? {} : {
    allocations: { some: { event: { OR: [{ pmId: req.user.id }, { team: { has: req.user.id } }] } } },
  }
  const resources = await prisma.resource.findMany({ where, orderBy: { createdAt: 'desc' } })
  res.json({ resources })
})

// Rental endpoints
router.get('/rentals', authRequired, requirePermission('resources', 'view'), async (req, res) => {
  try {
    const rentals = await prisma.rental.findMany({
      include: { resource: true, client: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ rentals })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/rentals', authRequired, requirePermission('resources', 'assign'), async (req, res) => {
  try {
    const { resourceId, qty, renterName, renterPhone, renterEmail, renterCompany, clientId, renterType, startDate, endDate, durationDays, dailyRate, totalAmount, deposit, paymentStatus, paymentMethod, conditionOnOut, notes } = req.body
    const count = await prisma.rental.count()
    const rentalCode = `RNT-2026-${String(count + 1).padStart(3, '0')}`
    const rental = await prisma.rental.create({
      data: {
        rentalCode,
        resourceId,
        qty: Number(qty) || 1,
        renterType: renterType || (clientId ? 'client' : 'external'),
        clientId: clientId || null,
        renterName: renterName || 'Renter',
        renterPhone: renterPhone || '',
        renterEmail: renterEmail || '',
        renterCompany: renterCompany || '',
        startDate: startDate || new Date().toISOString().slice(0, 10),
        endDate: endDate || new Date().toISOString().slice(0, 10),
        durationDays: Number(durationDays) || 1,
        dailyRate: Number(dailyRate) || 0,
        totalAmount: Number(totalAmount) || 0,
        deposit: Number(deposit) || 0,
        depositStatus: 'held',
        paymentStatus: paymentStatus || 'paid',
        paymentMethod: paymentMethod || 'Cash',
        status: 'active',
        conditionOnOut: conditionOnOut || '',
        notes: notes || '',
      },
    })
    if (resourceId) {
      await prisma.resource.update({
        where: { id: resourceId },
        data: { allocated: { increment: Number(qty) || 1 } },
      })
    }
    await prisma.activityLog.create({
      data: { userId: req.user.id, text: `Equipment rented out: ${rentalCode} (ETB ${totalAmount})`, type: 'inventory', at: 'Just now' },
    })
    res.json({ rental })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.put('/rentals/:id/return', authRequired, requirePermission('resources', 'edit'), async (req, res) => {
  try {
    const { conditionOnReturn, notes, depositStatus } = req.body
    const existing = await prisma.rental.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ error: 'Rental not found' })

    const rental = await prisma.rental.update({
      where: { id: req.params.id },
      data: {
        status: 'returned',
        actualReturnDate: new Date().toISOString().slice(0, 10),
        conditionOnReturn: conditionOnReturn || 'Good',
        depositStatus: depositStatus || 'refunded',
        notes: notes ? `${existing.notes ? existing.notes + ' | ' : ''}${notes}` : existing.notes,
      },
    })
    if (existing.resourceId) {
      await prisma.resource.update({
        where: { id: existing.resourceId },
        data: { allocated: { decrement: existing.qty } },
      })
    }
    await prisma.activityLog.create({
      data: { userId: req.user.id, text: `Rental returned: ${existing.rentalCode}`, type: 'inventory', at: 'Just now' },
    })
    res.json({ rental })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.put('/rentals/:id', authRequired, requirePermission('resources', 'edit'), async (req, res) => {
  try {
    const rental = await prisma.rental.update({
      where: { id: req.params.id },
      data: req.body,
    })
    res.json({ rental })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.delete('/rentals/:id', authRequired, requirePermission('resources', 'delete'), async (req, res) => {
  try {
    await prisma.rental.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/', authRequired, requirePermission('resources', 'create'), async (req, res) => {
  const fields = ['name', 'category', 'status', 'location', 'code', 'rentalTerms']
  const out = {}
  for (const k of fields) if (req.body[k] !== undefined) out[k] = req.body[k]
  out.qty = Number(req.body.qty) || 1
  out.allocated = 0
  out.maintenance = 0
  out.rentalRate = Number(req.body.rentalRate) || 0
  out.rentalDeposit = Number(req.body.rentalDeposit) || 0
  out.rentalAvailable = req.body.rentalAvailable !== undefined ? Boolean(req.body.rentalAvailable) : true
  if (!out.status) out.status = 'available'
  if (!out.location) out.location = 'Main Warehouse'
  const resource = await prisma.resource.create({ data: out })
  res.json({ resource })
})

router.put('/:id', authRequired, requirePermission('resources', 'edit'), async (req, res) => {
  const numeric = ['qty', 'allocated', 'maintenance', 'rentalRate', 'rentalDeposit']
  const stringFields = ['name', 'category', 'status', 'location', 'code', 'rentalTerms']
  const out = {}
  for (const k of stringFields) if (req.body[k] !== undefined) out[k] = req.body[k]
  for (const k of numeric) if (req.body[k] !== undefined) out[k] = Number(req.body[k]) || 0
  if (req.body.rentalAvailable !== undefined) out.rentalAvailable = Boolean(req.body.rentalAvailable)
  const resource = await prisma.resource.update({ where: { id: req.params.id }, data: out })
  res.json({ resource })
})

router.delete('/:id', authRequired, requirePermission('resources', 'delete'), async (req, res) => {
  await prisma.resource.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

// Allocate resource to event
router.post('/:id/allocate', authRequired, requirePermission('resources', 'assign'), async (req, res) => {
  const { eventId, qty } = req.body
  const resource = await prisma.resource.update({
    where: { id: req.params.id },
    data: { allocated: { increment: Number(qty) || 1 } },
  })
  await prisma.allocation.create({
    data: { resourceId: req.params.id, eventId, qty: Number(qty) || 1 },
  })
  await prisma.activityLog.create({
    data: { userId: req.user.id, text: `Resource allocated to event (${qty}x)`, type: 'inventory', at: 'Just now' },
  })
  if (eventId) await autoAdvance(eventId, req.user.id)
  res.json({ resource })
})

export default router
