// Self-contained QR ticket payload.
// The QR value embeds ALL attendee + event details so a scanned ticket can be
// validated instantly without any additional lookup (and works offline).

export const TICKET_SCHEMA = 1

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