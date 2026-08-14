// Self-contained QR ticket payload.
// The QR value embeds ALL attendee + event details so a scanned ticket can be
// validated instantly without any additional lookup (and works offline).

export const TICKET_SCHEMA = 1

// Human-readable, event-scoped ticket code prefix, e.g. ev3 -> "EV3",
// ev-7f3a -> "EV7F3A". Used to build unique per-event attendee ids + QR.
export function eventTicketCode(eventId) {
  if (!eventId) return 'EV1'
  const m = String(eventId).match(/(\d+)/)
  if (m) return 'EV' + m[1]
  return 'EV' + String(eventId).replace(/[^A-Za-z0-9]/g, '').slice(-4).toUpperCase()
}

// Builds a unique, event-scoped ticket id for a new registration: AE-{EVENT}-{SEQ}.
export function buildTicketCode(eventId, seq) {
  return `AE-${eventTicketCode(eventId)}-${String(Math.max(1, Number(seq) || 1)).padStart(4, '0')}`
}

export function ticketPayload(reg, event, venue) {
  if (!reg) return null
  const e = event || {}
  const v = venue || {}
  return {
    v: TICKET_SCHEMA,
    id: reg.id,
    qr: reg.qr,
    name: reg.name,
    email: reg.email || '',
    phone: reg.phone || '',
    type: reg.type || 'Standard',
    amount: reg.amount || 0,
    paid: !!reg.paid,
    paymentMethod: reg.paymentMethod || 'Cash',
    eventId: e.id || reg.eventId || '',
    event: e.name || '',
    category: e.category || '',
    date: e.date || '',
    time: e.time || '',
    venue: v.name || '',
    city: v.city || '',
    status: reg.checkedIn ? 'used' : 'valid',
    issued: new Date().toISOString().slice(0, 10),
  }
}

export function encodeTicket(payload) {
  return JSON.stringify(payload)
}

// Returns { legacy: true, code } for plain codes or { legacy: false, payload, code } for payloads.
export function decodeTicket(value) {
  if (value == null) return null
  const str = String(value).trim()
  if (!str) return null
  try {
    const obj = JSON.parse(str)
    if (obj && obj.v === TICKET_SCHEMA && obj.qr) {
      return { legacy: false, payload: obj, code: obj.qr }
    }
  } catch (e) { /* not JSON → legacy code */ }
  return { legacy: true, payload: null, code: str }
}