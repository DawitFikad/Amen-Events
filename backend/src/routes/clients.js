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

const CLIENT_FIELDS = [
  'company', 'industry', 'city', 'contactPerson', 'contactRole', 'phone', 'email',
  'website', 'taxId', 'address', 'notes', 'photo', 'stage', 'status', 'totalValue', 'logo',
]

// POST /api/clients
router.post('/', authRequired, requirePermission('crm', 'create'), async (req, res) => {
  const { company, industry, city, contactPerson, contactRole, phone, email, stage, website, taxId, address, notes, photo, documents } = req.body
  if (!company) {
    return res.status(400).json({ error: 'Company name is required' })
  }
  const logo = req.body.logo || (company || '').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || 'CO'
  const client = await prisma.client.create({
    data: { company, industry, city, contactPerson, contactRole, phone, email, stage, website, taxId, address, notes, photo, logo },
  })
  // Attach any documents handed in with the registration form
  if (Array.isArray(documents) && documents.length) {
    await prisma.document.createMany({
      data: documents
        .filter((d) => d && d.name)
        .map((d) => ({
          name: d.name,
          type: d.type || 'company_doc',
          module: 'clients',
          entityId: client.id,
          mimeType: d.mimeType || '',
          size: Number(d.size) || 0,
          url: d.url || '',
          uploadedBy: req.user.id,
        })),
    })
  }
  await prisma.activityLog.create({
    data: { userId: req.user.id, text: `New client profile created: ${company}`, type: 'crm', at: 'Just now' },
  })
  res.json({ client })
})

// PUT /api/clients/:id
router.put('/:id', authRequired, requirePermission('crm', 'edit'), async (req, res) => {
  const data = {}
  for (const f of CLIENT_FIELDS) {
    if (req.body[f] !== undefined) data[f] = req.body[f]
  }
  const client = await prisma.client.update({ where: { id: req.params.id }, data })
  res.json({ client })
})

// DELETE /api/clients/:id
router.delete('/:id', authRequired, requirePermission('crm', 'delete'), async (req, res) => {
  await prisma.client.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

export default router
