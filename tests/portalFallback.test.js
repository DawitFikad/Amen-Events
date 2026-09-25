import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  portalCategoriesFallback,
  portalEventsFallback,
  portalEventFallback,
} from '../frontend/src/store/portalFallback.js'
import { eventsSeed } from '../frontend/src/store/data.js'

describe('portalFallback.js - Public Portal Offline Fallback Suite', () => {
  describe('portalCategoriesFallback', () => {
    test('returns array of 7 public portal categories', () => {
      const categories = portalCategoriesFallback()
      assert.ok(Array.isArray(categories))
      assert.equal(categories.length, 7)
      assert.ok(categories.includes('Conference'))
      assert.ok(categories.includes('Exhibition'))
      assert.ok(categories.includes('Product Launch'))
      assert.ok(categories.includes('Retreat'))
      assert.ok(categories.includes('Gala'))
      assert.ok(categories.includes('Ceremony'))
      assert.ok(categories.includes('Workshop'))
    })
  })

  describe('portalEventsFallback', () => {
    test('returns all seeded events when called without filter arguments', () => {
      const events = portalEventsFallback()
      assert.equal(events.length, eventsSeed.length)
    })

    test('enriches each event with venue, client, speakers, reviews, and _count', () => {
      const [first] = portalEventsFallback()
      assert.ok(first.id)
      assert.ok(first.name)
      assert.ok(first.venue !== undefined)
      assert.ok(first.client !== undefined)
      assert.ok(Array.isArray(first.speakers))
      assert.ok(Array.isArray(first.reviews))
      assert.ok(typeof first._count?.registrations === 'number')
    })

    test('filters events by search query matching event name', () => {
      const results = portalEventsFallback({ search: 'Tech' })
      assert.ok(results.length > 0)
      for (const ev of results) {
        const matchesName = ev.name.toLowerCase().includes('tech')
        const matchesCat = ev.category.toLowerCase().includes('tech')
        assert.ok(matchesName || matchesCat)
      }
    })

    test('filters events by search query matching event category', () => {
      const results = portalEventsFallback({ search: 'Conference' })
      assert.ok(results.length > 0)
      for (const ev of results) {
        const matchesName = ev.name.toLowerCase().includes('conference')
        const matchesCat = ev.category.toLowerCase().includes('conference')
        assert.ok(matchesName || matchesCat)
      }
    })

    test('search query filter is case-insensitive', () => {
      const upper = portalEventsFallback({ search: 'FINTECH' })
      const lower = portalEventsFallback({ search: 'fintech' })
      assert.equal(upper.length, lower.length)
    })

    test('filters events by specific category', () => {
      const results = portalEventsFallback({ category: 'Conference' })
      assert.ok(results.length > 0)
      for (const ev of results) {
        assert.equal(ev.category, 'Conference')
      }
    })

    test('ignores category filter when category is "all"', () => {
      const allCategory = portalEventsFallback({ category: 'all' })
      const noFilter = portalEventsFallback()
      assert.equal(allCategory.length, noFilter.length)
    })

    test('sorts by "popular" descending by registrations count', () => {
      const results = portalEventsFallback({ sort: 'popular' })
      assert.ok(results.length > 1)
      for (let i = 0; i < results.length - 1; i++) {
        const currentCount = results[i]._count?.registrations || 0
        const nextCount = results[i + 1]._count?.registrations || 0
        assert.ok(currentCount >= nextCount)
      }
    })

    test('sorts by "newest" descending by date', () => {
      const results = portalEventsFallback({ sort: 'newest' })
      assert.ok(results.length > 1)
      for (let i = 0; i < results.length - 1; i++) {
        const currentDate = results[i].date || ''
        const nextDate = results[i + 1].date || ''
        assert.ok(currentDate >= nextDate)
      }
    })

    test('limits the result count when limit parameter is provided', () => {
      const limited = portalEventsFallback({ limit: 2 })
      assert.equal(limited.length, 2)

      const single = portalEventsFallback({ limit: 1 })
      assert.equal(single.length, 1)
    })
  })

  describe('portalEventFallback', () => {
    test('returns single enriched event for valid ID', () => {
      const event = portalEventFallback('ev1')
      assert.ok(event)
      assert.equal(event.id, 'ev1')
      assert.ok(event.venue)
      assert.ok(typeof event.venue.name === 'string')
      assert.ok(event._count)
      assert.ok(typeof event._count.registrations === 'number')
    })

    test('returns null for non-existent event ID', () => {
      const event = portalEventFallback('non-existent-id')
      assert.equal(event, null)
    })
  })
})
