import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authRequired } from '../middleware/auth.js'
import { requirePermission } from '../middleware/rbac.js'

const router = Router()

// Speakers
router.get('/speakers', authRequired, requirePermission('speakers', 'view'), async (req, res) => {
  const speakers = await prisma.speaker.findMany({ orderBy: { createdAt: 'desc' } })
  res.json({ speakers })
})

router.post('/speakers', authRequired, requirePermission('speakers', 'create'), async (req, res) => {
  const { name, topic, eventId, company, time, status } = req.body
  const initials = (name || '').split(' ').map(p => p[0]).slice(0, 2).join('')
  const speaker = await prisma.speaker.create({
    data: { name, topic, eventId, company, time, status, initials, color: 'bg-gold-500' },
  })
  res.json({ speaker })
})

// Exhibitors
router.get('/exhibitors', authRequired, requirePermission('exhibition', 'view'), async (req, res) => {
  const exhibitors = await prisma.exhibitor.findMany({ orderBy: { createdAt: 'desc' } })
  res.json({ exhibitors })
})

router.post('/exhibitors', authRequired, requirePermission('exhibition', 'create'), async (req, res) => {
  const exhibitor = await prisma.exhibitor.create({ data: req.body })
  res.json({ exhibitor })
})

// Sponsors
router.get('/sponsors', authRequired, requirePermission('sponsorship', 'view'), async (req, res) => {
  const sponsors = await prisma.sponsor.findMany({ orderBy: { createdAt: 'desc' } })
  res.json({ sponsors })
})

router.post('/sponsors', authRequired, requirePermission('sponsorship', 'create'), async (req, res) => {
  const { name, package: pkg, amount, status, deliverables } = req.body
  const sponsor = await prisma.sponsor.create({
    data: { name, package: pkg, amount: Number(amount) || 0, status, deliverables: deliverables ? [deliverables] : [] },
  })
  res.json({ sponsor })
})

// Campaigns
router.get('/campaigns', authRequired, requirePermission('marketing', 'view'), async (req, res) => {
  const campaigns = await prisma.campaign.findMany({ orderBy: { createdAt: 'desc' } })
  res.json({ campaigns })
})

router.post('/campaigns', authRequired, requirePermission('marketing', 'create'), async (req, res) => {
  const { name, channel, audience, status } = req.body
  const campaign = await prisma.campaign.create({
    data: { name, channel, audience: Number(audience) || 0, status: status || 'draft' },
  })
  res.json({ campaign })
})

// Coupons
router.get('/coupons', authRequired, requirePermission('marketing', 'view'), async (req, res) => {
  const coupons = await prisma.coupon.findMany()
  res.json({ coupons })
})

router.post('/coupons', authRequired, requirePermission('marketing', 'create'), async (req, res) => {
  const { code, type, value, max } = req.body
  const coupon = await prisma.coupon.create({
    data: { code, type, value, max: Number(max) || 500, status: 'active' },
  })
  res.json({ coupon })
})

export default router
