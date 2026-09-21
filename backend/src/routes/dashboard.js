import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authRequired } from '../middleware/auth.js'
import { userAccessibleModules, userCan } from '../middleware/rbac.js'

const router = Router()

// GET /api/dashboard - aggregated data for the dashboard (ownership-filtered)
router.get('/', authRequired, async (req, res) => {
  const isAdmin = req.user.userRoles?.some((ur) => ur.role.key === 'admin')
  const userId = req.user.id

  // Build ownership filters for non-admin users
  const eventFilter = isAdmin ? {} : {
    OR: [
      { pmId: userId },
      { team: { has: userId } },
    ],
  }
  const taskFilter = isAdmin ? {} : {
    OR: [
      { assigneeId: userId },
      { event: { pmId: userId } },
      { event: { team: { has: userId } } },
    ],
  }

  const [
    events, tasks, clients, invoices, expenses,
    staff, venues, resources, vendors, registrations,
    speakers, exhibitors, sponsors, campaigns, coupons,
    activities, notifications,
  ] = await Promise.all([
    prisma.event.findMany({ where: eventFilter, include: { client: true, venue: true } }),
    prisma.task.findMany({ where: taskFilter }),
    prisma.client.findMany({ orderBy: { createdAt: 'desc' } }),
    isAdmin ? prisma.invoice.findMany() : prisma.invoice.findMany({
      where: { event: { OR: [{ pmId: userId }, { team: { has: userId } }] } },
    }),
    isAdmin ? prisma.expense.findMany() : prisma.expense.findMany({
      where: { event: { OR: [{ pmId: userId }, { team: { has: userId } }] } },
    }),
    prisma.user.findMany({ select: { id: true, name: true, initials: true, color: true, dept: true, jobTitle: true, email: true, phone: true, type: true, status: true, avatar: true } }),
    prisma.venue.findMany(),
    prisma.resource.findMany(),
    prisma.vendor.findMany(),
    isAdmin ? prisma.registration.findMany() : prisma.registration.findMany({
      where: { event: { OR: [{ pmId: userId }, { team: { has: userId } }] } },
    }),
    isAdmin ? prisma.speaker.findMany() : prisma.speaker.findMany({
      where: { event: { OR: [{ pmId: userId }, { team: { has: userId } }] } },
    }),
    prisma.exhibitor.findMany(),
    prisma.sponsor.findMany(),
    prisma.campaign.findMany(),
    prisma.coupon.findMany(),
    prisma.activityLog.findMany({ take: 20, orderBy: { createdAt: 'desc' } }),
    prisma.notification.findMany({ take: 10, orderBy: { createdAt: 'desc' } }),
  ])

  const accessibleModules = userAccessibleModules(req.user)

  res.json({
    events, tasks, clients, invoices, expenses,
    staff, venues, resources, vendors, registrations,
    speakers, exhibitors, sponsors, campaigns, coupons,
    activities, notifications,
    accessibleModules,
  })
})

export default router
