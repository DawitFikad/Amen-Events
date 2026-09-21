import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authRequired } from '../middleware/auth.js'
import { requirePermission, userCan } from '../middleware/rbac.js'

const router = Router()

// 14-stage pipeline definition
export const STAGES = [
  { id: 0, name: 'Client Created',  key: 'client_created',  module: 'crm',       perm: 'create' },
  { id: 1, name: 'Opportunity',      key: 'opportunity',     module: 'crm',       perm: 'edit' },
  { id: 2, name: 'Quotation',        key: 'quotation',       module: 'crm',       perm: 'edit' },
  { id: 3, name: 'Contract',         key: 'contract',        module: 'crm',       perm: 'edit' },
  { id: 4, name: 'Event',            key: 'event',           module: 'events',    perm: 'create' },
  { id: 5, name: 'Tasks',            key: 'tasks',           module: 'projects',  perm: 'create' },
  { id: 6, name: 'Venue',            key: 'venue',           module: 'venues',    perm: 'assign' },
  { id: 7, name: 'Resources',        key: 'resources',       module: 'resources', perm: 'assign' },
  { id: 8, name: 'Budget',           key: 'budget',          module: 'finance',   perm: 'edit' },
  { id: 9, name: 'Registration',     key: 'registration',    module: 'ticketing', perm: 'create' },
  { id: 10, name: 'QR Tickets',      key: 'qr_tickets',      module: 'ticketing', perm: 'manage' },
  { id: 11, name: 'Check-In',        key: 'checkin',         module: 'checkin',   perm: 'create' },
  { id: 12, name: 'Reports',         key: 'reports',         module: 'reports',   perm: 'view' },
  { id: 13, name: 'Completed',       key: 'completed',       module: 'events',    perm: 'edit' },
]

// GET /api/workflow/stages - return the 14-stage pipeline definition
router.get('/stages', authRequired, (req, res) => {
  res.json({ stages: STAGES })
})

// GET /api/workflow - list all events with their workflow progress
router.get('/', authRequired, async (req, res) => {
  const isAdmin = req.user.userRoles?.some((ur) => ur.role.key === 'admin')
  const where = isAdmin ? {} : {
    OR: [
      { pmId: req.user.id },
      { team: { has: req.user.id } },
    ],
  }
  const events = await prisma.event.findMany({
    where,
    include: {
      client: true,
      venue: true,
      tasks: true,
      registrations: true,
      allocations: true,
      expenses: true,
      invoices: true,
      workflowLogs: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
    orderBy: { createdAt: 'desc' },
  })

  const enriched = events.map((e) => {
    const stage = STAGES[e.stage] || STAGES[0]
    const checklist = getChecklist(e)
    return {
      ...e,
      stageName: stage.name,
      stageKey: stage.key,
      checklist,
      completedSteps: checklist.filter((c) => c.done).length,
      totalSteps: checklist.length,
    }
  })

  res.json({ events: enriched, stages: STAGES })
})

// GET /api/workflow/:eventId - get detailed workflow for a single event
router.get('/:eventId', authRequired, async (req, res) => {
  const event = await prisma.event.findUnique({
    where: { id: req.params.eventId },
    include: {
      client: true,
      venue: true,
      tasks: true,
      registrations: true,
      allocations: { include: { resource: true } },
      expenses: true,
      invoices: true,
      workflowLogs: { orderBy: { createdAt: 'desc' } },
    },
  })
  if (!event) return res.status(404).json({ error: 'Event not found' })

  const stage = STAGES[event.stage] || STAGES[0]
  const checklist = getChecklist(event)

  res.json({
    event: {
      ...event,
      stageName: stage.name,
      stageKey: stage.key,
      checklist,
      completedSteps: checklist.filter((c) => c.done).length,
      totalSteps: checklist.length,
    },
    stages: STAGES,
  })
})

// POST /api/workflow/:eventId/advance - advance event to next stage
router.post('/:eventId/advance', authRequired, async (req, res) => {
  const { note } = req.body
  const event = await prisma.event.findUnique({
    where: { id: req.params.eventId },
    include: { client: true },
  })
  if (!event) return res.status(404).json({ error: 'Event not found' })

  if (event.stage >= STAGES.length - 1) {
    return res.status(400).json({ error: 'Event is already at the final stage' })
  }

  const currentStage = STAGES[event.stage]
  const nextStage = STAGES[event.stage + 1]

  // Check permission for the next stage
  if (!userCan(req.user, nextStage.module, nextStage.perm)) {
    return res.status(403).json({
      error: 'Access denied',
      message: `You need '${nextStage.perm}' permission on '${nextStage.module}' to advance to ${nextStage.name}`,
    })
  }

  const updated = await prisma.event.update({
    where: { id: event.id },
    data: {
      stage: nextStage.id,
      progress: Math.round(((nextStage.id + 1) / STAGES.length) * 100),
      status: nextStage.id === 13 ? 'completed' : event.status,
    },
  })

  await prisma.workflowLog.create({
    data: {
      eventId: event.id,
      stage: nextStage.id,
      stageName: nextStage.name,
      action: 'advanced',
      note: note || `Advanced from ${currentStage.name} to ${nextStage.name}`,
      userId: req.user.id,
    },
  })

  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      text: `Workflow: ${event.name} advanced to ${nextStage.name}`,
      type: 'workflow',
      at: 'Just now',
    },
  })

  res.json({ event: updated, stage: nextStage })
})

// POST /api/workflow/:eventId/revert - revert event to previous stage
router.post('/:eventId/revert', authRequired, async (req, res) => {
  const { note } = req.body
  const event = await prisma.event.findUnique({ where: { id: req.params.eventId } })
  if (!event) return res.status(404).json({ error: 'Event not found' })

  if (event.stage <= 0) {
    return res.status(400).json({ error: 'Event is already at the first stage' })
  }

  const currentStage = STAGES[event.stage]
  const prevStage = STAGES[event.stage - 1]

  const updated = await prisma.event.update({
    where: { id: event.id },
    data: {
      stage: prevStage.id,
      progress: Math.round(((prevStage.id + 1) / STAGES.length) * 100),
    },
  })

  await prisma.workflowLog.create({
    data: {
      eventId: event.id,
      stage: prevStage.id,
      stageName: prevStage.name,
      action: 'reverted',
      note: note || `Reverted from ${currentStage.name} to ${prevStage.name}`,
      userId: req.user.id,
    },
  })

  res.json({ event: updated, stage: prevStage })
})

// POST /api/workflow/:eventId/set-stage - jump to a specific stage
router.post('/:eventId/set-stage', authRequired, async (req, res) => {
  const { stageId, note } = req.body
  if (stageId < 0 || stageId >= STAGES.length) {
    return res.status(400).json({ error: 'Invalid stage ID' })
  }

  const event = await prisma.event.findUnique({ where: { id: req.params.eventId } })
  if (!event) return res.status(404).json({ error: 'Event not found' })

  const targetStage = STAGES[stageId]
  const updated = await prisma.event.update({
    where: { id: event.id },
    data: {
      stage: targetStage.id,
      progress: Math.round(((targetStage.id + 1) / STAGES.length) * 100),
      status: targetStage.id === 13 ? 'completed' : event.status,
    },
  })

  await prisma.workflowLog.create({
    data: {
      eventId: event.id,
      stage: targetStage.id,
      stageName: targetStage.name,
      action: 'set',
      note: note || `Stage set to ${targetStage.name}`,
      userId: req.user.id,
    },
  })

  res.json({ event: updated, stage: targetStage })
})

// GET /api/workflow/:eventId/logs - get workflow transition history
router.get('/:eventId/logs', authRequired, async (req, res) => {
  const logs = await prisma.workflowLog.findMany({
    where: { eventId: req.params.eventId },
    include: { user: { select: { name: true, initials: true } } },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ logs })
})

// Helper: compute checklist for each stage based on event data
function getChecklist(event) {
  return STAGES.map((stage) => {
    let done = false
    let detail = ''

    switch (stage.key) {
      case 'client_created':
        done = !!event.clientId
        detail = event.client ? event.client.company : 'No client linked'
        break
      case 'opportunity':
        done = !!event.clientId && event.client?.stage !== 'lead'
        detail = event.client ? `Stage: ${event.client.stage}` : 'No client'
        break
      case 'quotation':
        done = event.budget > 0
        detail = event.budget > 0 ? `Budget: ETB ${event.budget.toLocaleString()}` : 'No budget set'
        break
      case 'contract':
        done = !!event.clientId && event.client?.stage === 'contract'
        detail = event.client?.stage === 'contract' ? 'Contract signed' : 'Not yet contracted'
        break
      case 'event':
        done = !!event.name && !!event.date
        detail = event.date ? `Scheduled: ${event.date}` : 'No date set'
        break
      case 'tasks':
        done = event.tasks && event.tasks.length > 0
        detail = event.tasks ? `${event.tasks.length} task(s)` : 'No tasks'
        break
      case 'venue':
        done = !!event.venueId
        detail = event.venue ? event.venue.name : 'No venue assigned'
        break
      case 'resources':
        done = event.allocations && event.allocations.length > 0
        detail = event.allocations ? `${event.allocations.length} allocation(s)` : 'No resources allocated'
        break
      case 'budget':
        done = event.budget > 0 && event.spent > 0
        detail = `Budget: ${event.budget.toLocaleString()} | Spent: ${event.spent.toLocaleString()}`
        break
      case 'registration':
        done = event.registrations && event.registrations.length > 0
        detail = event.registrations ? `${event.registrations.length} registration(s)` : 'No registrations'
        break
      case 'qr_tickets':
        done = event.registrations?.some((r) => r.qr)
        detail = event.registrations?.some((r) => r.qr) ? 'QR codes generated' : 'No QR codes'
        break
      case 'checkin':
        done = event.registrations?.some((r) => r.checkedIn)
        detail = event.registrations ? `${event.registrations.filter((r) => r.checkedIn).length} checked in` : 'No check-ins'
        break
      case 'reports':
        done = event.status === 'completed' || event.stage >= 12
        detail = event.stage >= 12 ? 'Report stage reached' : 'Not yet'
        break
      case 'completed':
        done = event.status === 'completed'
        detail = event.status === 'completed' ? 'Event completed' : 'In progress'
        break
    }

    return { ...stage, done, detail }
  })
}

export default router

// Auto-advance: check if the event's current stage prerequisites are met
// and auto-advance to the next stage. Called after data mutations.
export async function autoAdvance(eventId, userId = null) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      client: true, venue: true, tasks: true,
      registrations: true, allocations: true, expenses: true, invoices: true,
    },
  })
  if (!event || event.stage >= STAGES.length - 1) return null

  const checklist = getChecklist(event)
  const currentStage = STAGES[event.stage]

  // If current stage is done, advance to next
  if (checklist[event.stage]?.done) {
    const nextStage = STAGES[event.stage + 1]
    const updated = await prisma.event.update({
      where: { id: eventId },
      data: {
        stage: nextStage.id,
        progress: Math.round(((nextStage.id + 1) / STAGES.length) * 100),
        status: nextStage.id === 13 ? 'completed' : event.status,
      },
    })

    await prisma.workflowLog.create({
      data: {
        eventId, stage: nextStage.id, stageName: nextStage.name,
        action: 'auto_advanced',
        note: `Auto-advanced: ${currentStage.name} completed → ${nextStage.name}`,
        userId,
      },
    })

    // Recursively check if next stage is also done
    return autoAdvance(eventId, userId).then(() => updated)
  }

  return null
}
