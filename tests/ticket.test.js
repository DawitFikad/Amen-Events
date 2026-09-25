import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  TICKET_SCHEMA,
  eventTicketCode,
  buildTicketCode,
  ticketPayload,
  encodeTicket,
  decodeTicket,
} from '../frontend/src/store/ticket.js'

describe('ticket.js - QR Ticket Encoding and Validation Suite', () => {
  describe('eventTicketCode', () => {
    test('returns EV1 when eventId is null, undefined, or empty', () => {
      assert.equal(eventTicketCode(null), 'EV1')
      assert.equal(eventTicketCode(undefined), 'EV1')
      assert.equal(eventTicketCode(''), 'EV1')
    })

    test('extracts number digits when present in eventId', () => {
      assert.equal(eventTicketCode('ev3'), 'EV3')
      assert.equal(eventTicketCode('event-104'), 'EV104')
      assert.equal(eventTicketCode('ev42a'), 'EV42')
      assert.equal(eventTicketCode(7), 'EV7')
    })

    test('falls back to uppercase alphanumeric suffix when no digits exist', () => {
      assert.equal(eventTicketCode('summit'), 'EVMMIT')
      assert.equal(eventTicketCode('gala-night'), 'EVIGHT')
      assert.equal(eventTicketCode('abc-def'), 'EVCDEF')
    })
  })

  describe('buildTicketCode', () => {
    test('formats unique ticket code as AE-{EVENT}-{SEQ}', () => {
      assert.equal(buildTicketCode('ev3', 1), 'AE-EV3-0001')
      assert.equal(buildTicketCode('ev3', 42), 'AE-EV3-0042')
      assert.equal(buildTicketCode('ev3', 999), 'AE-EV3-0999')
      assert.equal(buildTicketCode('ev3', 9999), 'AE-EV3-9999')
    })

    test('handles sequence numbers beyond 4 digits without truncation', () => {
      assert.equal(buildTicketCode('ev3', 10000), 'AE-EV3-10000')
      assert.equal(buildTicketCode('ev3', 123456), 'AE-EV3-123456')
    })

    test('defaults to 1 when sequence is zero, negative, or invalid', () => {
      assert.equal(buildTicketCode('ev1', 0), 'AE-EV1-0001')
      assert.equal(buildTicketCode('ev1', -10), 'AE-EV1-0001')
      assert.equal(buildTicketCode('ev1', 'invalid'), 'AE-EV1-0001')
      assert.equal(buildTicketCode('ev1', null), 'AE-EV1-0001')
    })
  })

  describe('ticketPayload', () => {
    const mockReg = {
      id: 'reg-001',
      qr: 'AE-EV3-0001',
      name: 'Abebe Bikila',
      email: 'abebe@example.com',
      phone: '+251 911 000 111',
      type: 'VIP',
      amount: 2500,
      paid: true,
      paymentMethod: 'Telebirr',
      checkedIn: false,
    }

    const mockEvent = {
      id: 'ev3',
      name: 'Addis Tech Summit 2026',
      category: 'Conference',
      date: '2026-08-15',
      time: '09:00 AM',
    }

    const mockVenue = {
      name: 'Millennium Hall',
      city: 'Addis Ababa',
    }

    test('returns null when registration object is missing', () => {
      assert.equal(ticketPayload(null, mockEvent, mockVenue), null)
      assert.equal(ticketPayload(undefined, mockEvent, mockVenue), null)
    })

    test('creates full ticket payload with schema version 1', () => {
      const payload = ticketPayload(mockReg, mockEvent, mockVenue)
      assert.equal(payload.v, TICKET_SCHEMA)
      assert.equal(payload.id, 'reg-001')
      assert.equal(payload.qr, 'AE-EV3-0001')
      assert.equal(payload.name, 'Abebe Bikila')
      assert.equal(payload.email, 'abebe@example.com')
      assert.equal(payload.phone, '+251 911 000 111')
      assert.equal(payload.type, 'VIP')
      assert.equal(payload.amount, 2500)
      assert.equal(payload.paid, true)
      assert.equal(payload.paymentMethod, 'Telebirr')
      assert.equal(payload.eventId, 'ev3')
      assert.equal(payload.event, 'Addis Tech Summit 2026')
      assert.equal(payload.category, 'Conference')
      assert.equal(payload.date, '2026-08-15')
      assert.equal(payload.time, '09:00 AM')
      assert.equal(payload.venue, 'Millennium Hall')
      assert.equal(payload.city, 'Addis Ababa')
      assert.equal(payload.status, 'valid')
      assert.match(payload.issued, /^\d{4}-\d{2}-\d{2}$/)
    })

    test('sets status to "used" when registration has checkedIn: true', () => {
      const usedReg = { ...mockReg, checkedIn: true }
      const payload = ticketPayload(usedReg, mockEvent, mockVenue)
      assert.equal(payload.status, 'used')
    })

    test('applies safe defaults for optional or missing fields', () => {
      const minimalReg = { id: 'reg-min', qr: 'AE-EV1-0002', name: 'Minimal User' }
      const payload = ticketPayload(minimalReg, null, null)
      assert.equal(payload.email, '')
      assert.equal(payload.phone, '')
      assert.equal(payload.type, 'Standard')
      assert.equal(payload.amount, 0)
      assert.equal(payload.paid, false)
      assert.equal(payload.paymentMethod, 'Cash')
      assert.equal(payload.eventId, '')
      assert.equal(payload.event, '')
      assert.equal(payload.venue, '')
      assert.equal(payload.status, 'valid')
    })
  })

  describe('encodeTicket & decodeTicket', () => {
    const samplePayload = {
      v: 1,
      id: 'reg-1',
      qr: 'AE-EV3-0001',
      name: 'Hana Tadesse',
      status: 'valid',
    }

    test('encodeTicket stringifies payload to valid JSON', () => {
      const encoded = encodeTicket(samplePayload)
      assert.equal(typeof encoded, 'string')
      assert.deepEqual(JSON.parse(encoded), samplePayload)
    })

    test('decodeTicket returns null for null, undefined, or empty string', () => {
      assert.equal(decodeTicket(null), null)
      assert.equal(decodeTicket(undefined), null)
      assert.equal(decodeTicket(''), null)
      assert.equal(decodeTicket('   '), null)
    })

    test('decodeTicket returns legacy: false with parsed payload for valid QR tickets', () => {
      const encoded = encodeTicket(samplePayload)
      const decoded = decodeTicket(encoded)
      assert.equal(decoded.legacy, false)
      assert.deepEqual(decoded.payload, samplePayload)
      assert.equal(decoded.code, 'AE-EV3-0001')
    })

    test('decodeTicket detects plain legacy ticket code string', () => {
      const legacyCode = 'AE-EV3-0042'
      const decoded = decodeTicket(legacyCode)
      assert.equal(decoded.legacy, true)
      assert.equal(decoded.payload, null)
      assert.equal(decoded.code, legacyCode)
    })

    test('decodeTicket falls back to legacy for JSON missing qr field or incorrect schema version', () => {
      const invalidJson1 = JSON.stringify({ v: 2, qr: 'AE-EV1-0001' })
      const res1 = decodeTicket(invalidJson1)
      assert.equal(res1.legacy, true)
      assert.equal(res1.payload, null)

      const invalidJson2 = JSON.stringify({ v: 1, name: 'No QR' })
      const res2 = decodeTicket(invalidJson2)
      assert.equal(res2.legacy, true)
    })

    test('decodeTicket trims surrounding whitespace on input strings', () => {
      const decoded = decodeTicket('   AE-EV3-0001   \n')
      assert.equal(decoded.legacy, true)
      assert.equal(decoded.code, 'AE-EV3-0001')
    })
  })
})
