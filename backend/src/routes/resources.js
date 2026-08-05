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

router.post('/', authRequired, requirePermission('resources', 'create'), async (req, res) => {
  const resource = await prisma.resource.create({ data: { ...req.body, qty: Number(req.body.qty) || 1, allocated: 0, maintenance: 0, status: 'available' } })
  res.json({ resource })
})

router.put('/:id', authRequired, requirePermission('resources', 'edit'), async (req, res) => {
  const resource = await prisma.resource.update({ where: { id: req.params.id }, data: req.body })
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
