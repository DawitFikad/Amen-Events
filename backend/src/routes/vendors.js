import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authRequired } from '../middleware/auth.js'
import { requirePermission } from '../middleware/rbac.js'

const router = Router()

router.get('/', authRequired, requirePermission('vendors', 'view'), async (req, res) => {
  const isAdmin = req.user.userRoles?.some((ur) => ur.role.key === 'admin')
  const where = isAdmin ? {} : {
    expenses: { some: { event: { OR: [{ pmId: req.user.id }, { team: { has: req.user.id } }] } } },
  }
  const vendors = await prisma.vendor.findMany({ where, orderBy: { createdAt: 'desc' } })
  res.json({ vendors })
})

router.post('/', authRequired, requirePermission('vendors', 'create'), async (req, res) => {
  const vendor = await prisma.vendor.create({ data: { ...req.body, rating: 4.0, contracts: 0, status: 'active' } })
  res.json({ vendor })
})

router.put('/:id', authRequired, requirePermission('vendors', 'edit'), async (req, res) => {
  const vendor = await prisma.vendor.update({ where: { id: req.params.id }, data: req.body })
  res.json({ vendor })
})

router.delete('/:id', authRequired, requirePermission('vendors', 'delete'), async (req, res) => {
  await prisma.vendor.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

export default router
