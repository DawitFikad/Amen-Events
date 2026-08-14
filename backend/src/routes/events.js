import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authRequired } from '../middleware/auth.js'
import { requirePermission } from '../middleware/rbac.js'
import { autoAdvance } from './workflow.js'
import { notify, notifyRole } from './notifications.js'

const router = Router()

const EVENT_FIELDS = [
  'name', 'clientId', 'venueId', 'category', 'date', 'time', 'status', 'pmId',
  'budget', 'image', 'description', 'endDate', 'endTime', 'deadline', 'capacity',
  'price', 'published', 'tags', 'contactName', 'contactPhone',
]

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
  const { name, clientId, venueId, category, date, time, budget, pmId, status, tags, documents } = req.body
  if (!name) {
    return res.status(400).json({ error: 'Event name is required' })
  }
  const event = await prisma.event.create({
    data: {
      name, clientId, venueId, category, date, time: time || '09:00',
      budget: Number(budget) || 0, pmId, team: [pmId].filter(Boolean),
      status: status || 'upcoming', stage: 4, progress: 36,
      image: req.body.image || '',
      description: req.body.description || '',
      endDate: req.body.endDate || '',
      endTime: req.body.endTime || '',
      deadline: req.body.deadline || '',
      capacity: Number(req.body.capacity) || 0,
      price: Number(req.body.price) || 0,
      published: !!req.body.published,
      tags: Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [],
      contactName: req.body.contactName || '',
      contactPhone: req.body.contactPhone || '',
    },
  })
  // Attach any documents handed in with the registration form
  if (Array.isArray(documents) && documents.length) {
    await prisma.document.createMany({
      data: documents
        .filter((d) => d && d.name)
        .map((d) => ({
          name: d.name,
          type: d.type || 'file',
          module: 'events',
          entityId: event.id,
          mimeType: d.mimeType || '',
          size: Number(d.size) || 0,
          url: d.url || '',
          uploadedBy: req.user.id,
        })),
    })
  }
  await prisma.activityLog.create({
    data: { userId: req.user.id, text: `Event created: ${name}`, type: 'event', at: 'Just now' },
  })
  // Auto-advance workflow
  await autoAdvance(event.id, req.user.id)
  res.json({ event })
})

router.put('/:id', authRequired, requirePermission('events', 'edit'), async (req, res) => {
  const data = {}
  for (const f of EVENT_FIELDS) {
    if (req.body[f] !== undefined) data[f] = req.body[f]
  }
  if (data.tags !== undefined) data.tags = data.tags.map((t) => String(t).trim()).filter(Boolean)
  if (data.budget !== undefined) data.budget = Number(data.budget) || 0
  const event = await prisma.event.update({ where: { id: req.params.id }, data })
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
