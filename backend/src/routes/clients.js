import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authRequired } from '../middleware/auth.js'
import { requirePermission } from '../middleware/rbac.js'

const router = Router()

// GET /api/clients
router.get('/', authRequired, requirePermission('crm', 'view'), async (req, res) => {
  const isAdmin = req.user.userRoles?.some((ur) => ur.role.key === 'admin')
  const where = isAdmin ? {} : {
    events: { some: { OR: [{ pmId: req.user.id }, { team: { has: req.user.id } }] } },
  }
  const clients = await prisma.client.findMany({ where, orderBy: { createdAt: 'desc' } })
  res.json({ clients })
})

// POST /api/clients
router.post('/', authRequired, requirePermission('crm', 'create'), async (req, res) => {
  const { company, industry, city, contactPerson, contactRole, phone, email, stage } = req.body
  if (!company) {
    return res.status(400).json({ error: 'Company name is required' })
  }
  const logo = (company || '').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || 'CO'
  const client = await prisma.client.create({
    data: { company, industry, city, contactPerson, contactRole, phone, email, stage, logo },
  })
  await prisma.activityLog.create({
    data: { userId: req.user.id, text: `New client profile created: ${company}`, type: 'crm', at: 'Just now' },
  })
  res.json({ client })
})

// PUT /api/clients/:id
router.put('/:id', authRequired, requirePermission('crm', 'edit'), async (req, res) => {
  const client = await prisma.client.update({ where: { id: req.params.id }, data: req.body })
  res.json({ client })
})

// DELETE /api/clients/:id
router.delete('/:id', authRequired, requirePermission('crm', 'delete'), async (req, res) => {
  await prisma.client.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

export default router
