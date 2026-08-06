// Offline fallback data for the public portal.
// Mirrors the API response shapes so portal pages render real content
// even when the backend is not running (demo mode).

import { eventsSeed, venuesSeed, clientsSeed, registrationsSeed, speakersSeed } from './data'

const CATEGORIES = [
  'Conference', 'Exhibition', 'Product Launch', 'Retreat', 'Gala', 'Ceremony', 'Workshop',
]

function buildEvent(e) {
  const venue = venuesSeed.find((v) => v.id === e.venueId)
  const client = clientsSeed.find((c) => c.id === e.clientId)
  const regs = registrationsSeed.filter((r) => r.eventId === e.id)
  const speakers = speakersSeed
    .filter((s) => s.eventId === e.id)
    .map((s) => ({ id: s.id, name: s.name, title: s.topic, company: s.company }))
  return {
    ...e,
    venue: venue ? { name: venue.name, city: venue.city, capacity: venue.capacity } : null,
    client: client ? { company: client.company } : null,
    speakers,
    reviews: [],
    _count: { registrations: regs.length },
  }
}

export function portalCategoriesFallback() {
  return CATEGORIES
}

export function portalEventsFallback({ search = '', category = '', sort = '', limit } = {}) {
  let list = eventsSeed.map(buildEvent)
  if (search) {
    const q = search.toLowerCase()
    list = list.filter((e) => (e.name || '').toLowerCase().includes(q) || (e.category || '').toLowerCase().includes(q))
  }
  if (category && category !== 'all') list = list.filter((e) => e.category === category)
  if (sort === 'popular') list = [...list].sort((a, b) => (b._count?.registrations || 0) - (a._count?.registrations || 0))
  else if (sort === 'newest') list = [...list].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  else list = [...list].sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'))
  if (limit) list = list.slice(0, limit)
  return list
}

export function portalEventFallback(id) {
  const e = eventsSeed.find((ev) => ev.id === id)
  return e ? buildEvent(e) : null
}
