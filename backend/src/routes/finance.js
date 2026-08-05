import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authRequired } from '../middleware/auth.js'
import { requirePermission } from '../middleware/rbac.js'

const router = Router()

router.get('/', authRequired, requirePermission('finance', 'view'), async (req, res) => {
  const isAdmin = req.user.userRoles?.some((ur) => ur.role.key === 'admin')
  const eventFilter = isAdmin ? {} : { OR: [{ pmId: req.user.id }, { team: { has: req.user.id } }] }
  const [invoices, expenses] = await Promise.all([
    prisma.invoice.findMany({ where: { event: eventFilter }, include: { client: true, event: true }, orderBy: { createdAt: 'desc' } }),
    prisma.expense.findMany({ where: { event: eventFilter }, include: { event: true, vendor: true }, orderBy: { createdAt: 'desc' } }),
  ])
  res.json({ invoices, expenses })
})

router.post('/invoices', authRequired, requirePermission('finance', 'create'), async (req, res) => {
  const { clientId, eventId, amount, paid, dueDate, ref } = req.body
  if (!clientId || !eventId || !amount || !ref) {
    return res.status(400).json({ error: 'Missing required fields: clientId, eventId, amount, ref' })
  }
  if (Number(amount) <= 0) {
    return res.status(400).json({ error: 'Invoice amount must be greater than zero' })
  }
  const invoice = await prisma.invoice.create({
    data: {
      clientId, eventId, amount: Number(amount) || 0,
      paid: Number(paid) || 0, dueDate, ref,
      status: (Number(paid) || 0) > 0 ? 'partial' : 'outstanding',
    },
  })
  await prisma.activityLog.create({
    data: { userId: req.user.id, text: `Invoice issued for ${ref || invoice.id}`, type: 'finance', at: 'Just now' },
  })
  res.json({ invoice })
})

router.post('/invoices/:id/payment', authRequired, requirePermission('finance', 'edit'), async (req, res) => {
  const { amount } = req.body
  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Payment amount must be greater than zero' })
  }
  const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } })
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' })
  const newPaid = invoice.paid + Number(amount)
  if (newPaid > invoice.amount) {
    return res.status(400).json({ error: `Payment exceeds invoice balance. Outstanding: ETB ${invoice.amount - invoice.paid}` })
  }
  const status = newPaid >= invoice.amount ? 'paid' : newPaid > 0 ? 'partial' : 'outstanding'
  const updated = await prisma.invoice.update({ where: { id: invoice.id }, data: { paid: newPaid, status } })
  await prisma.activityLog.create({
    data: { userId: req.user.id, text: `Payment of ${amount} recorded`, type: 'finance', at: 'Just now' },
  })
  res.json({ invoice: updated })
})

router.post('/expenses', authRequired, requirePermission('finance', 'create'), async (req, res) => {
  const { eventId, category, amount, date, vendorId } = req.body
  if (!eventId || !category || !amount) {
    return res.status(400).json({ error: 'Missing required fields: eventId, category, amount' })
  }
  if (Number(amount) <= 0) {
    return res.status(400).json({ error: 'Expense amount must be greater than zero' })
  }
  // Check budget limit
  if (eventId) {
    const event = await prisma.event.findUnique({ where: { id: eventId } })
    if (event && event.budget > 0) {
      const newSpent = (event.spent || 0) + Number(amount)
      if (newSpent > event.budget) {
        return res.status(400).json({ error: `Expense exceeds event budget. Budget: ETB ${event.budget}, Spent: ETB ${event.spent}, Available: ETB ${event.budget - event.spent}` })
      }
    }
  }
  const expense = await prisma.expense.create({
    data: { eventId, category, amount: Number(amount) || 0, date, vendorId },
  })
  if (eventId) {
    await prisma.event.update({
      where: { id: eventId },
      data: { spent: { increment: Number(amount) || 0 } },
    })
  }
  await prisma.activityLog.create({
    data: { userId: req.user.id, text: `Expense recorded: ${category} ${amount}`, type: 'finance', at: 'Just now' },
  })
  res.json({ expense })
})

export default router
