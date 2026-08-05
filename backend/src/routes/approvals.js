import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authRequired } from '../middleware/auth.js'
import { requirePermission, userCan } from '../middleware/rbac.js'
import { notify, notifyRole } from './notifications.js'

const router = Router()

// GET /api/approvals — list approval requests
router.get('/', authRequired, async (req, res) => {
  const isAdmin = req.user.userRoles?.some((ur) => ur.role.key === 'admin')
  const isFinance = req.user.userRoles?.some((ur) => ur.role.key === 'finance')
  const where = (isAdmin || isFinance) ? {} : { submittedBy: req.user.id }
  const approvals = await prisma.approvalRequest.findMany({
    where,
    include: {
      submittedByUser: { select: { name: true, initials: true } },
      reviewedByUser: { select: { name: true, initials: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ approvals })
})

// GET /api/approvals/pending — count of pending approvals
router.get('/pending', authRequired, async (req, res) => {
  const count = await prisma.approvalRequest.count({ where: { status: 'pending' } })
  res.json({ count })
})

// POST /api/approvals — submit a new approval request
router.post('/', authRequired, async (req, res) => {
  const { type, entityId, entityName, amount, note } = req.body
  const approval = await prisma.approvalRequest.create({
    data: {
      type, entityId, entityName,
      amount: Number(amount) || 0,
      note: note || '',
      submittedBy: req.user.id,
      status: 'pending',
    },
  })

  // Notify finance users about new approval
  await notifyRole('finance', `New ${type} approval request: ${entityName}`, 'approval', '/finance')
  await notifyRole('admin', `New ${type} approval request: ${entityName}`, 'approval', '/finance')

  await prisma.activityLog.create({
    data: { userId: req.user.id, text: `Submitted ${type} approval for ${entityName}`, type: 'approval', at: 'Just now' },
  })

  res.json({ approval })
})

// POST /api/approvals/:id/approve — approve a request
router.post('/:id/approve', authRequired, async (req, res) => {
  const { reviewNote } = req.body
  const approval = await prisma.approvalRequest.findUnique({ where: { id: req.params.id } })
  if (!approval) return res.status(404).json({ error: 'Approval not found' })
  if (approval.status !== 'pending') return res.status(400).json({ error: 'Already reviewed' })

  const updated = await prisma.approvalRequest.update({
    where: { id: approval.id },
    data: { status: 'approved', reviewedBy: req.user.id, reviewNote: reviewNote || '' },
  })

  // Notify the submitter
  if (approval.submittedBy) {
    await notify(approval.submittedBy, `Your ${approval.type} request for ${approval.entityName} was approved`, 'approval', '')
  }

  await prisma.activityLog.create({
    data: { userId: req.user.id, text: `Approved ${approval.type} request: ${approval.entityName}`, type: 'approval', at: 'Just now' },
  })

  res.json({ approval: updated })
})

// POST /api/approvals/:id/reject — reject a request
router.post('/:id/reject', authRequired, async (req, res) => {
  const { reviewNote } = req.body
  const approval = await prisma.approvalRequest.findUnique({ where: { id: req.params.id } })
  if (!approval) return res.status(404).json({ error: 'Approval not found' })
  if (approval.status !== 'pending') return res.status(400).json({ error: 'Already reviewed' })

  const updated = await prisma.approvalRequest.update({
    where: { id: approval.id },
    data: { status: 'rejected', reviewedBy: req.user.id, reviewNote: reviewNote || '' },
  })

  if (approval.submittedBy) {
    await notify(approval.submittedBy, `Your ${approval.type} request for ${approval.entityName} was rejected`, 'approval', '')
  }

  await prisma.activityLog.create({
    data: { userId: req.user.id, text: `Rejected ${approval.type} request: ${approval.entityName}`, type: 'approval', at: 'Just now' },
  })

  res.json({ approval: updated })
})

// POST /api/approvals/:id/revision — request revision
router.post('/:id/revision', authRequired, async (req, res) => {
  const { reviewNote } = req.body
  const approval = await prisma.approvalRequest.findUnique({ where: { id: req.params.id } })
  if (!approval) return res.status(404).json({ error: 'Approval not found' })
  if (approval.status !== 'pending') return res.status(400).json({ error: 'Already reviewed' })

  const updated = await prisma.approvalRequest.update({
    where: { id: approval.id },
    data: { status: 'revision_requested', reviewedBy: req.user.id, reviewNote: reviewNote || '' },
  })

  if (approval.submittedBy) {
    await notify(approval.submittedBy, `Revision requested for ${approval.entityName}: ${reviewNote || ''}`, 'approval', '')
  }

  res.json({ approval: updated })
})

export default router
