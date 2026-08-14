import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authRequired } from '../middleware/auth.js'
import { requirePermission } from '../middleware/rbac.js'

const router = Router()

// Speakers
const speakerFields = ['name', 'topic', 'eventId', 'company', 'email', 'phone', 'bio', 'time', 'status']
const pickSpeaker = (body) => {
  const out = {}
  for (const k of speakerFields) if (body[k] !== undefined) out[k] = body[k]
  if (out.name !== undefined) out.initials = (out.name || '').split(' ').map((p) => p[0]).slice(0, 2).join('')
  return out
}

router.get('/speakers', authRequired, requirePermission('speakers', 'view'), async (req, res) => {
  const speakers = await prisma.speaker.findMany({ orderBy: { createdAt: 'desc' } })
  res.json({ speakers })
})

router.post('/speakers', authRequired, requirePermission('speakers', 'create'), async (req, res) => {
  const speaker = await prisma.speaker.create({ data: pickSpeaker(req.body) })
  res.json({ speaker })
})

router.put('/speakers/:id', authRequired, requirePermission('speakers', 'edit'), async (req, res) => {
  const speaker = await prisma.speaker.update({ where: { id: req.params.id }, data: pickSpeaker(req.body) })
  res.json({ speaker })
})

const exhibitorFields = ['company', 'booth', 'size', 'package', 'paid', 'status', 'contact', 'email', 'phone', 'website', 'description', 'logo']
const pickExhibitor = (body) => {
  const out = {}
  for (const k of exhibitorFields) if (body[k] !== undefined) out[k] = k === 'paid' ? Number(body[k]) || 0 : body[k]
  return out
}

// Exhibitors
router.get('/exhibitors', authRequired, requirePermission('exhibition', 'view'), async (req, res) => {
  const exhibitors = await prisma.exhibitor.findMany({ orderBy: { createdAt: 'desc' } })
  res.json({ exhibitors })
})

router.post('/exhibitors', authRequired, requirePermission('exhibition', 'create'), async (req, res) => {
  const exhibitor = await prisma.exhibitor.create({ data: pickExhibitor(req.body) })
  res.json({ exhibitor })
})

router.put('/exhibitors/:id', authRequired, requirePermission('exhibition', 'update'), async (req, res) => {
  const exhibitor = await prisma.exhibitor.update({ where: { id: req.params.id }, data: pickExhibitor(req.body) })
  res.json({ exhibitor })
})

// Sponsors
const deliverableList = (d) => typeof d === 'string' ? d.split(',').map((s) => s.trim()).filter(Boolean) : Array.isArray(d) ? d : []
const sponsorFields = ['name', 'package', 'status', 'contact', 'email', 'phone', 'date']
const pickSponsor = (body) => {
  const out = {}
  for (const k of sponsorFields) if (body[k] !== undefined) out[k] = body[k]
  if (body.amount !== undefined) out.amount = Number(body.amount) || 0
  if (body.deliverables !== undefined) out.deliverables = deliverableList(body.deliverables)
  return out
}

router.get('/sponsors', authRequired, requirePermission('sponsorship', 'view'), async (req, res) => {
  const sponsors = await prisma.sponsor.findMany({ orderBy: { createdAt: 'desc' } })
  res.json({ sponsors })
})

router.post('/sponsors', authRequired, requirePermission('sponsorship', 'create'), async (req, res) => {
  const sponsor = await prisma.sponsor.create({ data: pickSponsor(req.body) })
  res.json({ sponsor })
})

router.put('/sponsors/:id', authRequired, requirePermission('sponsorship', 'edit'), async (req, res) => {
  const sponsor = await prisma.sponsor.update({ where: { id: req.params.id }, data: pickSponsor(req.body) })
  res.json({ sponsor })
})

// Campaigns
const campaignFields = ['name', 'channel', 'status', 'schedule', 'description']
const pickCampaign = (body) => {
  const out = {}
  for (const k of campaignFields) if (body[k] !== undefined) out[k] = body[k]
  if (body.audience !== undefined) out.audience = Number(body.audience) || 0
  if (body.sent !== undefined) out.sent = Number(body.sent) || 0
  if (body.opens !== undefined) out.opens = Number(body.opens) || 0
  if (body.clicks !== undefined) out.clicks = Number(body.clicks) || 0
  return out
}

router.get('/campaigns', authRequired, requirePermission('marketing', 'view'), async (req, res) => {
  const campaigns = await prisma.campaign.findMany({ orderBy: { createdAt: 'desc' } })
  res.json({ campaigns })
})

router.post('/campaigns', authRequired, requirePermission('marketing', 'create'), async (req, res) => {
  const campaign = await prisma.campaign.create({ data: pickCampaign(req.body) })
  res.json({ campaign })
})

router.put('/campaigns/:id', authRequired, requirePermission('marketing', 'edit'), async (req, res) => {
  const campaign = await prisma.campaign.update({ where: { id: req.params.id }, data: pickCampaign(req.body) })
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
