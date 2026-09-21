import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authRequired } from '../middleware/auth.js'
import { requirePermission } from '../middleware/rbac.js'

const router = Router()

router.get('/', authRequired, requirePermission('venues', 'view'), async (req, res) => {
  const isAdmin = req.user.userRoles?.some((ur) => ur.role.key === 'admin')
  const where = isAdmin ? {} : {
    events: { some: { OR: [{ pmId: req.user.id }, { team: { has: req.user.id } }] } },
  }
  const venues = await prisma.venue.findMany({ where, orderBy: { createdAt: 'desc' } })
  res.json({ venues })
})

router.post('/', authRequired, requirePermission('venues', 'create'), async (req, res) => {
  const { name, city, halls, capacity, price, contact, equipment } = req.body
  const eq = typeof equipment === 'string' ? equipment.split(',').map(s => s.trim()).filter(Boolean) : Array.isArray(equipment) ? equipment : []
  const abbr = (name || 'VN').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || 'VN'
  const venue = await prisma.venue.create({
    data: { name, city, halls: Number(halls) || 1, capacity: Number(capacity) || 100, price: Number(price) || 0, contact, equipment: eq, abbr, status: 'available' },
  })
  res.json({ venue })
})

router.put('/:id', authRequired, requirePermission('venues', 'edit'), async (req, res) => {
  const venueFields = ['name', 'city', 'halls', 'capacity', 'price', 'contact', 'equipment', 'status', 'color', 'abbr']
  const out = {}
  for (const k of venueFields) if (req.body[k] !== undefined) out[k] = req.body[k]
  if (out.equipment !== undefined) {
    out.equipment = typeof out.equipment === 'string' ? out.equipment.split(',').map((s) => s.trim()).filter(Boolean) : Array.isArray(out.equipment) ? out.equipment : []
  }
  if (out.halls !== undefined) out.halls = Number(out.halls) || 1
  if (out.capacity !== undefined) out.capacity = Number(out.capacity) || 0
  if (out.price !== undefined) out.price = Number(out.price) || 0
  const venue = await prisma.venue.update({ where: { id: req.params.id }, data: out })
  res.json({ venue })
})

router.delete('/:id', authRequired, requirePermission('venues', 'delete'), async (req, res) => {
  await prisma.venue.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

export default router
