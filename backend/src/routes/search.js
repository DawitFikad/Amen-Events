import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authRequired } from '../middleware/auth.js'

const router = Router()

// Global search across all entities
router.get('/', authRequired, async (req, res) => {
  const q = (req.query.q || '').trim()
  if (q.length < 2) return res.json({ results: [] })

  const term = q.toLowerCase()
  const results = []

  // Clients
  const clients = await prisma.client.findMany({
    where: {
      OR: [
        { company: { contains: term, mode: 'insensitive' } },
        { contactPerson: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ],
    },
    take: 5,
  })
  clients.forEach((c) => results.push({ type: 'client', id: c.id, title: c.company, subtitle: c.contactPerson || c.email, to: '/crm' }))

  // Events
  const events = await prisma.event.findMany({
    where: {
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { category: { contains: term, mode: 'insensitive' } },
      ],
    },
    take: 5,
  })
  events.forEach((e) => results.push({ type: 'event', id: e.id, title: e.name, subtitle: `${e.category} · ${e.date ? new Date(e.date).toLocaleDateString() : ''}`, to: '/events' }))

  // Staff
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ],
    },
    take: 5,
  })
  users.forEach((u) => results.push({ type: 'staff', id: u.id, title: u.name, subtitle: u.email, to: '/staff' }))

  // Vendors
  const vendors = await prisma.vendor.findMany({
    where: {
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { type: { contains: term, mode: 'insensitive' } },
      ],
    },
    take: 5,
  })
  vendors.forEach((v) => results.push({ type: 'vendor', id: v.id, title: v.name, subtitle: v.type, to: '/vendors' }))

  // Resources
  const resources = await prisma.resource.findMany({
    where: {
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { category: { contains: term, mode: 'insensitive' } },
      ],
    },
    take: 5,
  })
  resources.forEach((r) => results.push({ type: 'resource', id: r.id, title: r.name, subtitle: r.category, to: '/resources' }))

  // Invoices
  const invoices = await prisma.invoice.findMany({
    where: {
      OR: [
        { ref: { contains: term, mode: 'insensitive' } },
        { status: { contains: term, mode: 'insensitive' } },
      ],
    },
    take: 5,
  })
  invoices.forEach((i) => results.push({ type: 'invoice', id: i.id, title: i.ref, subtitle: `${i.status} · ETB ${i.amount.toLocaleString()}`, to: '/finance' }))

  // Registrations
  const registrations = await prisma.registration.findMany({
    where: {
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { qr: { contains: term, mode: 'insensitive' } },
      ],
    },
    take: 5,
  })
  registrations.forEach((r) => results.push({ type: 'registration', id: r.id, title: r.name, subtitle: `${r.type} · ${r.qr}`, to: '/ticketing' }))

  // Documents
  const documents = await prisma.document.findMany({
    where: {
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { type: { contains: term, mode: 'insensitive' } },
      ],
    },
    take: 5,
  })
  documents.forEach((d) => results.push({ type: 'document', id: d.id, title: d.name, subtitle: d.type, to: '/documents' }))

  res.json({ results })
})

export default router
