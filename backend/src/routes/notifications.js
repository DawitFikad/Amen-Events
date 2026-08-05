import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authRequired } from '../middleware/auth.js'

const router = Router()

// SSE endpoint for real-time notifications
router.get('/stream', authRequired, (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  })
  res.write('\n')

  const interval = setInterval(async () => {
    const notifs = await prisma.notification.findMany({
      where: { userId: req.user.id, read: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })
    res.write(`data: ${JSON.stringify({ notifications: notifs })}\n\n`)
  }, 5000)

  req.on('close', () => clearInterval(interval))
})

// GET /api/notifications — user's notifications
router.get('/', authRequired, async (req, res) => {
  const isAdmin = req.user.userRoles?.some((ur) => ur.role.key === 'admin')
  const where = isAdmin ? {} : {
    OR: [{ userId: req.user.id }, { userId: null }],
  }
  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 30,
  })
  res.json({ notifications })
})

// POST /api/notifications/:id/read — mark as read
router.post('/:id/read', authRequired, async (req, res) => {
  await prisma.notification.update({
    where: { id: req.params.id },
    data: { read: true },
  })
  res.json({ success: true })
})

// POST /api/notifications/read-all — mark all as read
router.post('/read-all', authRequired, async (req, res) => {
  await prisma.notification.updateMany({
    where: { OR: [{ userId: req.user.id }, { userId: null }], read: false },
    data: { read: true },
  })
  res.json({ success: true })
})

// Helper: create notification (used by other routes)
export async function notify(userId, text, type = 'general', link = '') {
  return prisma.notification.create({
    data: { userId, text, type, at: 'Just now', link },
  })
}

// Helper: notify all users with a specific role
export async function notifyRole(roleKey, text, type = 'general', link = '') {
  const users = await prisma.user.findMany({
    where: { userRoles: { some: { role: { key: roleKey } } } },
    select: { id: true },
  })
  return Promise.all(users.map((u) => notify(u.id, text, type, link)))
}

export default router
