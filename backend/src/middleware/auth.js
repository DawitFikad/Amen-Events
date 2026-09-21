import { verifyAccessToken } from '../lib/jwt.js'
import prisma from '../lib/prisma.js'

export async function authRequired(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  const token = header.slice(7)
  try {
    const payload = verifyAccessToken(token)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: { rolePerms: { include: { permission: true } } },
            },
          },
        },
      },
    })
    if (!user) return res.status(401).json({ error: 'User not found' })
    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization
  if (header && header.startsWith('Bearer ')) {
    try {
      const payload = verifyAccessToken(header.slice(7))
      req.userId = payload.userId
    } catch (err) {
      // ignore - optional
    }
  }
  next()
}
