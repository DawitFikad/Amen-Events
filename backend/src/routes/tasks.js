import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authRequired } from '../middleware/auth.js'
import { requirePermission } from '../middleware/rbac.js'
import { autoAdvance } from './workflow.js'

const router = Router()

// Tasks
router.get('/', authRequired, requirePermission('projects', 'view'), async (req, res) => {
  const tasks = await prisma.task.findMany({ include: { event: true }, orderBy: { createdAt: 'desc' } })
  res.json({ tasks })
})

router.post('/', authRequired, requirePermission('projects', 'create'), async (req, res) => {
  const fields = ['title', 'eventId', 'assigneeId', 'priority', 'status', 'due', 'comments']
  const out = {}
  for (const k of fields) if (req.body[k] !== undefined) out[k] = req.body[k]
  if (!out.priority) out.priority = 'medium'
  if (!out.status) out.status = 'todo'

  let validEventId = null
  if (out.eventId && typeof out.eventId === 'string' && out.eventId.trim()) {
    const existingEvent = await prisma.event.findUnique({ where: { id: out.eventId } }).catch(() => null)
    if (existingEvent) validEventId = existingEvent.id
  }
  out.eventId = validEventId

  const task = await prisma.task.create({ data: out, include: { event: true } })
  await prisma.activityLog.create({
    data: { userId: req.user.id, text: `Task created: ${out.title}`, type: 'task', at: 'Just now' },
  })
  if (out.eventId) await autoAdvance(out.eventId, req.user.id)
  res.json({ task })
})

router.put('/:id', authRequired, requirePermission('projects', 'edit'), async (req, res) => {
  const fields = ['title', 'eventId', 'assigneeId', 'priority', 'status', 'due', 'comments']
  const out = {}
  for (const k of fields) if (req.body[k] !== undefined) out[k] = req.body[k]
  if (out.comments !== undefined) out.comments = Number(out.comments) || 0
  const task = await prisma.task.update({ where: { id: req.params.id }, data: out })
  res.json({ task })
})

router.delete('/:id', authRequired, requirePermission('projects', 'delete'), async (req, res) => {
  await prisma.task.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

export default router
