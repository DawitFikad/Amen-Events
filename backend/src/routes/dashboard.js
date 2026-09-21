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
    prisma.event.findMany({ include: { client: true, venue: true }, orderBy: { createdAt: 'desc' } }),
    prisma.task.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.client.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.invoice.findMany({ include: { client: true, event: true }, orderBy: { createdAt: 'desc' } }),
    prisma.expense.findMany({ include: { event: true, vendor: true }, orderBy: { createdAt: 'desc' } }),
    prisma.user.findMany({ select: { id: true, name: true, initials: true, color: true, dept: true, jobTitle: true, email: true, phone: true, type: true, status: true, avatar: true } }),
    prisma.venue.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.resource.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.vendor.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.registration.findMany({ include: { event: true }, orderBy: { createdAt: 'desc' } }),
    prisma.speaker.findMany({ include: { event: true }, orderBy: { createdAt: 'desc' } }),
    prisma.exhibitor.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.sponsor.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.campaign.findMany({ orderBy: { createdAt: 'desc' } }),
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
