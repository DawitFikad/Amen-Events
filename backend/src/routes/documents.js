import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authRequired } from '../middleware/auth.js'

const router = Router()

// GET /api/documents — list documents, optionally filtered by module + entityId
router.get('/', authRequired, async (req, res) => {
  const { module, entityId } = req.query
  const where = {}
  if (module) where.module = module
  if (entityId) where.entityId = entityId

  const documents = await prisma.document.findMany({
    where,
    include: { uploadedByUser: { select: { name: true, initials: true } } },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ documents })
})

// POST /api/documents — upload a document (metadata only, URL-based)
router.post('/', authRequired, async (req, res) => {
  const { name, type, module, entityId, mimeType, size, url } = req.body
  const doc = await prisma.document.create({
    data: {
      name, type: type || 'file', module: module || 'general',
      entityId: entityId || null, mimeType: mimeType || '', size: Number(size) || 0,
      url: url || '', uploadedBy: req.user.id,
    },
  })
  await prisma.activityLog.create({
    data: { userId: req.user.id, text: `Document uploaded: ${name}`, type: 'document', at: 'Just now' },
  })
  res.json({ document: doc })
})

// DELETE /api/documents/:id
router.delete('/:id', authRequired, async (req, res) => {
  await prisma.document.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

export default router
