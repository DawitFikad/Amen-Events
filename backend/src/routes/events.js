import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authRequired } from '../middleware/auth.js'
import { requirePermission } from '../middleware/rbac.js'
import { autoAdvance } from './workflow.js'
import { notify, notifyRole } from './notifications.js'

const router = Router()

router.get('/', authRequired, requirePermission('events', 'view'), async (req, res) => {
  const isAdmin = req.user.userRoles?.some((ur) => ur.role.key === 'admin')
  const where = isAdmin ? {} : {
    OR: [
      { pmId: req.user.id },
      { team: { has: req.user.id } },
    ],
  }
  const events = await prisma.event.findMany({
    where,
    include: { client: true, venue: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ events })
})

router.post('/', authRequired, requirePermission('events', 'create'), async (req, res) => {
  const { name, clientId, venueId, category, date, time, budget, pmId } = req.body
  if (!name) {
    return res.status(400).json({ error: 'Event name is required' })
  }
  const event = await prisma.event.create({
    data: {
      name, clientId, venueId, category, date, time: time || '09:00',
      budget: Number(budget) || 0, pmId, team: [pmId].filter(Boolean),
      status: 'upcoming', stage: 4, progress: 36,
    },
  })
  await prisma.activityLog.create({
    data: { userId: req.user.id, text: `Event created: ${name}`, type: 'event', at: 'Just now' },
  })
  // Auto-advance workflow
  await autoAdvance(event.id, req.user.id)
  res.json({ event })
})

router.put('/:id', authRequired, requirePermission('events', 'edit'), async (req, res) => {
  const event = await prisma.event.update({ where: { id: req.params.id }, data: req.body })
  await autoAdvance(event.id, req.user.id)
  res.json({ event })
})

router.delete('/:id', authRequired, requirePermission('events', 'delete'), async (req, res) => {
  await prisma.event.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

// Team assignment
router.put('/:id/team', authRequired, requirePermission('events', 'assign'), async (req, res) => {
  const { memberIds } = req.body
  const team = Array.isArray(memberIds) ? memberIds : []
  const event = await prisma.event.update({
    where: { id: req.params.id },
    data: { team },
  })
  await prisma.activityLog.create({
    data: { userId: req.user.id, text: `Team updated on event (${team.length} members)`, type: 'event', at: 'Just now' },
  })
  res.json({ event })
})

// Budget
router.put('/:id/budget', authRequired, requirePermission('events', 'assign'), async (req, res) => {
  const { budget } = req.body
  const event = await prisma.event.update({
    where: { id: req.params.id },
    data: { budget: Number(budget) || 0 },
  })
  await autoAdvance(event.id, req.user.id)
  // Notify finance about budget update
  await notifyRole('finance', `Budget updated for ${event.name}: ETB ${Number(budget).toLocaleString()}`, 'budget', '/finance')
  res.json({ event })
})

export default router
