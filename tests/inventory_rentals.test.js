import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateRentalDuration,
  calculateRentalRevenue,
  calculateTotalPayable,
  calculateAvailableStock,
  canFulfillRental,
  isRentalOverdue,
  calculateOverdueDays,
  formatRentalRef,
  aggregateRentalMetrics,
  calculateDepositSettlement,
  filterRentalRecords,
  validateRentalCreation,
} from '../frontend/src/store/rentalUtils.js'
import { resourcesSeed, rentalsSeed } from '../frontend/src/store/data.js'

describe('inventory_rentals.test.js - Equipment Rental Monetization & Inventory Suite', () => {

  // ─── SUITE 1: DURATION CALCULATIONS ─────────────────────────────
  describe('calculateRentalDuration', () => {
    test('returns 1 when start date and end date are the exact same day', () => {
      assert.equal(calculateRentalDuration('2026-08-15', '2026-08-15'), 1)
    })

    test('calculates correct whole days within the same month', () => {
      assert.equal(calculateRentalDuration('2026-08-10', '2026-08-13'), 3)
      assert.equal(calculateRentalDuration('2026-08-01', '2026-08-08'), 7)
    })

    test('calculates correct days crossing month boundary', () => {
      assert.equal(calculateRentalDuration('2026-08-30', '2026-09-02'), 3)
    })

    test('defaults to 1 when start date is null or undefined', () => {
      assert.equal(calculateRentalDuration(null, '2026-08-15'), 1)
      assert.equal(calculateRentalDuration(undefined, '2026-08-15'), 1)
    })

    test('defaults to 1 when end date is null or undefined', () => {
      assert.equal(calculateRentalDuration('2026-08-15', null), 1)
      assert.equal(calculateRentalDuration('2026-08-15', undefined), 1)
    })

    test('defaults to 1 when both dates are empty strings', () => {
      assert.equal(calculateRentalDuration('', ''), 1)
    })

    test('defaults to 1 when date strings are malformed or invalid', () => {
      assert.equal(calculateRentalDuration('invalid-date', '2026-08-15'), 1)
      assert.equal(calculateRentalDuration('2026-08-15', 'not-a-date'), 1)
    })

    test('returns minimum 1 day even if end date is earlier than start date', () => {
      assert.equal(calculateRentalDuration('2026-08-20', '2026-08-15'), 1)
    })
  })

  // ─── SUITE 2: RENTAL REVENUE CALCULATIONS ────────────────────────
  describe('calculateRentalRevenue', () => {
    test('calculates base revenue for 1 unit for 1 day', () => {
      assert.equal(calculateRentalRevenue(1, 25000, 1), 25000)
    })

    test('calculates revenue for multiple units over multiple days', () => {
      // 10 units @ 500 ETB for 3 days = 15,000 ETB
      assert.equal(calculateRentalRevenue(10, 500, 3), 15000)
    })

    test('calculates high-value production equipment hire correctly', () => {
      // 2 LED walls @ 25,000 ETB for 5 days = 250,000 ETB
      assert.equal(calculateRentalRevenue(2, 25000, 5), 250000)
    })

    test('returns 0 when quantity is zero', () => {
      assert.equal(calculateRentalRevenue(0, 18000, 3), 0)
    })

    test('returns 0 when daily rate is zero', () => {
      assert.equal(calculateRentalRevenue(5, 0, 4), 0)
    })

    test('converts numeric strings to numbers smoothly', () => {
      assert.equal(calculateRentalRevenue('3', '14000', '2'), 84000)
    })

    test('treats negative quantities as zero', () => {
      assert.equal(calculateRentalRevenue(-2, 1000, 2), 0)
    })

    test('treats negative daily rates as zero', () => {
      assert.equal(calculateRentalRevenue(2, -500, 2), 0)
    })
  })

  // ─── SUITE 3: TOTAL PAYABLE (REVENUE + DEPOSIT) ──────────────────
  describe('calculateTotalPayable', () => {
    test('calculates total payable with zero deposit', () => {
      assert.equal(calculateTotalPayable(75000, 0), 75000)
    })

    test('adds security deposit to rental revenue correctly', () => {
      // 75,000 ETB fee + 50,000 ETB deposit = 125,000 ETB
      assert.equal(calculateTotalPayable(75000, 50000), 125000)
    })

    test('handles numeric string inputs correctly', () => {
      assert.equal(calculateTotalPayable('36000', '30000'), 66000)
    })

    test('handles null or undefined deposit gracefully', () => {
      assert.equal(calculateTotalPayable(25000, null), 25000)
      assert.equal(calculateTotalPayable(25000, undefined), 25000)
    })

    test('prevents negative deposit from reducing rental revenue', () => {
      assert.equal(calculateTotalPayable(10000, -5000), 10000)
    })
  })

  // ─── SUITE 4: AVAILABLE STOCK & FULFILLMENT ─────────────────────
  describe('calculateAvailableStock and canFulfillRental', () => {
    test('returns total quantity when neither allocated nor rented', () => {
      const res = { qty: 10, allocated: 0, rented: 0 }
      assert.equal(calculateAvailableStock(res), 10)
    })

    test('subtracts internal event allocations from total quantity', () => {
      const res = { qty: 10, allocated: 4, rented: 0 }
      assert.equal(calculateAvailableStock(res), 6)
    })

    test('subtracts active commercial rentals from total quantity', () => {
      const res = { qty: 10, allocated: 0, rented: 3 }
      assert.equal(calculateAvailableStock(res), 7)
    })

    test('subtracts both event allocations and active rentals together', () => {
      const res = { qty: 10, allocated: 3, rented: 4 }
      assert.equal(calculateAvailableStock(res), 3)
    })

    test('returns 0 when allocated + rented equals or exceeds total quantity', () => {
      const res1 = { qty: 5, allocated: 3, rented: 2 }
      const res2 = { qty: 5, allocated: 4, rented: 3 }
      assert.equal(calculateAvailableStock(res1), 0)
      assert.equal(calculateAvailableStock(res2), 0)
    })

    test('handles null or undefined resource by returning 0', () => {
      assert.equal(calculateAvailableStock(null), 0)
      assert.equal(calculateAvailableStock(undefined), 0)
    })

    test('canFulfillRental returns true when requested quantity <= available stock', () => {
      assert.equal(canFulfillRental(1, 5), true)
      assert.equal(canFulfillRental(5, 5), true)
    })

    test('canFulfillRental returns false when requested quantity exceeds available stock, is non-integer, or <= 0', () => {
      assert.equal(canFulfillRental(6, 5), false)
      assert.equal(canFulfillRental(0, 5), false)
      assert.equal(canFulfillRental(-1, 5), false)
      assert.equal(canFulfillRental(2.5, 5), false)
    })
  })

  // ─── SUITE 5: OVERDUE CHECKS & CALCULATIONS ─────────────────────
  describe('isRentalOverdue and calculateOverdueDays', () => {
    test('returns false when rental status is already returned', () => {
      const r = { status: 'returned', endDate: '2026-08-01' }
      assert.equal(isRentalOverdue(r, '2026-08-10'), false)
    })

    test('returns false when rental is active and return date is in future', () => {
      const r = { status: 'active', endDate: '2026-08-20' }
      assert.equal(isRentalOverdue(r, '2026-08-15'), false)
    })

    test('returns false when rental is active and return date is today', () => {
      const r = { status: 'active', endDate: '2026-08-15' }
      assert.equal(isRentalOverdue(r, '2026-08-15'), false)
    })

    test('returns true when rental is active and return date was yesterday or earlier', () => {
      const r = { status: 'active', endDate: '2026-08-10' }
      assert.equal(isRentalOverdue(r, '2026-08-15'), true)
    })

    test('returns 0 overdue days for non-overdue rental', () => {
      const r = { status: 'active', endDate: '2026-08-20' }
      assert.equal(calculateOverdueDays(r, '2026-08-15'), 0)
    })

    test('calculates exact number of overdue days', () => {
      const r = { status: 'active', endDate: '2026-08-10' }
      assert.equal(calculateOverdueDays(r, '2026-08-14'), 4)
    })

    test('handles missing dates or null rental gracefully', () => {
      assert.equal(isRentalOverdue(null, '2026-08-15'), false)
      assert.equal(calculateOverdueDays(null, '2026-08-15'), 0)
    })
  })

  // ─── SUITE 6: METRICS AGGREGATION ───────────────────────────────
  describe('aggregateRentalMetrics', () => {
    const mockRentals = [
      { id: '1', totalAmount: 75000, qty: 1, deposit: 50000, depositStatus: 'held', paymentStatus: 'paid', status: 'active', endDate: '2026-08-20' },
      { id: '2', totalAmount: 36000, qty: 1, deposit: 30000, depositStatus: 'held', paymentStatus: 'paid', status: 'active', endDate: '2026-08-12' },
      { id: '3', totalAmount: 5000, qty: 50, deposit: 2000, depositStatus: 'refunded', paymentStatus: 'paid', status: 'returned', endDate: '2026-08-08' },
      { id: '4', totalAmount: 20000, qty: 2, deposit: 10000, depositStatus: 'held', paymentStatus: 'pending', status: 'active', endDate: '2026-08-25' },
    ]

    test('sums total revenue across all rentals', () => {
      const metrics = aggregateRentalMetrics(mockRentals, '2026-08-15')
      // 75000 + 36000 + 5000 + 20000 = 136,000
      assert.equal(metrics.totalRevenue, 136000)
    })

    test('calculates active revenue excluding completed returns', () => {
      const metrics = aggregateRentalMetrics(mockRentals, '2026-08-15')
      // 75000 + 36000 + 20000 = 131,000
      assert.equal(metrics.activeRevenue, 131000)
    })

    test('counts active rental bookings correctly', () => {
      const metrics = aggregateRentalMetrics(mockRentals, '2026-08-15')
      assert.equal(metrics.activeCount, 3)
    })

    test('sums active physical units rented in the field', () => {
      const metrics = aggregateRentalMetrics(mockRentals, '2026-08-15')
      // 1 + 1 + 2 = 4 units
      assert.equal(metrics.rentedUnits, 4)
    })

    test('sums deposits currently held in escrow', () => {
      const metrics = aggregateRentalMetrics(mockRentals, '2026-08-15')
      // 50000 + 30000 + 10000 = 90,000 (deposit on item 3 is refunded)
      assert.equal(metrics.depositsHeld, 90000)
    })

    test('identifies overdue rentals correctly relative to reference date', () => {
      const metrics = aggregateRentalMetrics(mockRentals, '2026-08-15')
      // item 2 has endDate 2026-08-12 which is < 2026-08-15
      assert.equal(metrics.overdueCount, 1)
    })

    test('separates settled paid revenue from pending revenue', () => {
      const metrics = aggregateRentalMetrics(mockRentals, '2026-08-15')
      // Paid: 75000 + 36000 + 5000 = 116000. Pending: 20000
      assert.equal(metrics.paidRevenue, 116000)
      assert.equal(metrics.pendingRevenue, 20000)
    })

    test('handles empty or non-array inputs cleanly', () => {
      const empty = aggregateRentalMetrics([], '2026-08-15')
      assert.equal(empty.totalRevenue, 0)
      assert.equal(empty.activeCount, 0)
      assert.equal(empty.depositsHeld, 0)
    })
  })

  // ─── SUITE 7: DEPOSIT SETTLEMENT ────────────────────────────────
  describe('calculateDepositSettlement', () => {
    test('returns full refund when no damage deduction exists', () => {
      const res = calculateDepositSettlement(50000, 0, 'refunded')
      assert.equal(res.refundAmount, 50000)
      assert.equal(res.deduction, 0)
      assert.equal(res.status, 'refunded')
    })

    test('deducts repair fee and refunds remaining deposit', () => {
      const res = calculateDepositSettlement(50000, 15000, 'refunded')
      assert.equal(res.refundAmount, 35000)
      assert.equal(res.deduction, 15000)
      assert.equal(res.status, 'partial_deduction')
    })

    test('caps damage deduction to deposit amount held', () => {
      const res = calculateDepositSettlement(10000, 25000, 'refunded')
      assert.equal(res.refundAmount, 0)
      assert.equal(res.deduction, 10000)
      assert.equal(res.status, 'partial_deduction')
    })

    test('forfeits entire deposit when action is forfeited', () => {
      const res = calculateDepositSettlement(30000, 0, 'forfeited')
      assert.equal(res.refundAmount, 0)
      assert.equal(res.deduction, 30000)
      assert.equal(res.status, 'forfeited')
    })

    test('holds deposit when action is held', () => {
      const res = calculateDepositSettlement(20000, 0, 'held')
      assert.equal(res.refundAmount, 0)
      assert.equal(res.deduction, 0)
      assert.equal(res.status, 'held')
    })

    test('handles negative damage deduction safely by treating as 0', () => {
      const res = calculateDepositSettlement(10000, -2000, 'refunded')
      assert.equal(res.refundAmount, 10000)
      assert.equal(res.deduction, 0)
    })

    test('handles zero initial deposit safely', () => {
      const res = calculateDepositSettlement(0, 0, 'refunded')
      assert.equal(res.refundAmount, 0)
      assert.equal(res.deduction, 0)
    })
  })

  // ─── SUITE 8: RENTAL RECORDS FILTERING ──────────────────────────
  describe('filterRentalRecords', () => {
    const list = [
      { id: '1', rentalCode: 'RNT-2026-001', resourceName: 'LED Wall 4K 12m²', renterName: 'ETH FINTECH Group', renterCompany: 'ETH FINTECH', renterPhone: '+251 911 222', status: 'active', endDate: '2026-08-20' },
      { id: '2', rentalCode: 'RNT-2026-002', resourceName: 'Line Array Sound System', renterName: 'Addis Grand Gala', renterCompany: 'Addis Gala', renterPhone: '+251 912 333', status: 'active', endDate: '2026-08-10' },
      { id: '3', rentalCode: 'RNT-2026-003', resourceName: 'Banquet Chairs', renterName: 'Zemen Pharma', renterCompany: 'Zemen', renterPhone: '+251 913 444', status: 'returned', endDate: '2026-08-05' },
    ]

    test('filters by renter name matching query', () => {
      const results = filterRentalRecords(list, { query: 'FINTECH' })
      assert.equal(results.length, 1)
      assert.equal(results[0].rentalCode, 'RNT-2026-001')
    })

    test('filters by equipment name matching query', () => {
      const results = filterRentalRecords(list, { query: 'sound system' })
      assert.equal(results.length, 1)
      assert.equal(results[0].rentalCode, 'RNT-2026-002')
    })

    test('filters by rental reference code', () => {
      const results = filterRentalRecords(list, { query: 'RNT-2026-003' })
      assert.equal(results.length, 1)
      assert.equal(results[0].renterName, 'Zemen Pharma')
    })

    test('filters by active status pill', () => {
      const results = filterRentalRecords(list, { status: 'active' })
      assert.equal(results.length, 2)
    })

    test('filters by returned status pill', () => {
      const results = filterRentalRecords(list, { status: 'returned' })
      assert.equal(results.length, 1)
      assert.equal(results[0].rentalCode, 'RNT-2026-003')
    })

    test('filters by overdue status pill based on reference date', () => {
      // With date 2026-08-15, item 2 has endDate 2026-08-10 and is active, so it is overdue
      const results = filterRentalRecords(list, { status: 'overdue', referenceDate: '2026-08-15' })
      assert.equal(results.length, 1)
      assert.equal(results[0].rentalCode, 'RNT-2026-002')
    })
  })

  // ─── SUITE 9: RENTAL VALIDATION ─────────────────────────────────
  describe('validateRentalCreation', () => {
    const validForm = {
      resourceId: 'rc1',
      qty: 1,
      renterName: 'Meron Ayele',
      startDate: '2026-08-15',
      endDate: '2026-08-18',
      dailyRate: 25000,
      deposit: 50000,
    }

    test('passes when all required fields are valid', () => {
      const res = validateRentalCreation(validForm, 2)
      assert.equal(res.ok, true)
      assert.equal(Object.keys(res.errors).length, 0)
    })

    test('fails when asset resourceId is missing', () => {
      const res = validateRentalCreation({ ...validForm, resourceId: '' }, 2)
      assert.equal(res.ok, false)
      assert.ok(res.errors.resourceId)
    })

    test('fails when quantity is zero or negative', () => {
      const resZero = validateRentalCreation({ ...validForm, qty: 0 }, 2)
      const resNeg = validateRentalCreation({ ...validForm, qty: -1 }, 2)
      assert.equal(resZero.ok, false)
      assert.equal(resNeg.ok, false)
      assert.ok(resZero.errors.qty)
    })

    test('fails when quantity is a non-integer floating point number', () => {
      const res = validateRentalCreation({ ...validForm, qty: 1.5 }, 5)
      assert.equal(res.ok, false)
      assert.ok(res.errors.qty)
    })

    test('fails when requested quantity exceeds available stock', () => {
      const res = validateRentalCreation({ ...validForm, qty: 3 }, 2)
      assert.equal(res.ok, false)
      assert.ok(res.errors.qty.includes('exceeds available stock'))
    })

    test('fails when renter name is shorter than 2 characters', () => {
      const resEmpty = validateRentalCreation({ ...validForm, renterName: '' }, 2)
      const resShort = validateRentalCreation({ ...validForm, renterName: 'A' }, 2)
      assert.equal(resEmpty.ok, false)
      assert.equal(resShort.ok, false)
      assert.ok(resShort.errors.renterName)
    })

    test('fails when start date is missing', () => {
      const res = validateRentalCreation({ ...validForm, startDate: '' }, 2)
      assert.equal(res.ok, false)
      assert.ok(res.errors.startDate)
    })

    test('fails when return date is earlier than start date', () => {
      const res = validateRentalCreation({ ...validForm, startDate: '2026-08-20', endDate: '2026-08-15' }, 2)
      assert.equal(res.ok, false)
      assert.ok(res.errors.endDate.includes('earlier than start date'))
    })

    test('fails when daily rate is negative', () => {
      const res = validateRentalCreation({ ...validForm, dailyRate: -100 }, 2)
      assert.equal(res.ok, false)
      assert.ok(res.errors.dailyRate)
    })
  })

  // ─── SUITE 10: REFERENCE FORMATTING & SEED DATA CONSISTENCY ─────
  describe('formatRentalRef and Seed Data Verification', () => {
    test('formats sequence numbers with 3-digit zero-padding', () => {
      assert.equal(formatRentalRef(1), 'RNT-2026-001')
      assert.equal(formatRentalRef(42), 'RNT-2026-042')
      assert.equal(formatRentalRef(150), 'RNT-2026-150')
    })

    test('handles custom year parameter in rental reference', () => {
      assert.equal(formatRentalRef(7, 2027), 'RNT-2027-007')
    })

    test('verifies all seed resources have valid positive rental rates when marked rentable', () => {
      assert.ok(resourcesSeed.length > 0)
      const rentable = resourcesSeed.filter((r) => r.rentalAvailable)
      assert.ok(rentable.length >= 8)
      rentable.forEach((r) => {
        assert.ok(typeof r.rentalRate === 'number' && r.rentalRate > 0)
        assert.ok(typeof r.rentalDeposit === 'number' && r.rentalDeposit >= 0)
        assert.ok(typeof r.name === 'string' && r.name.length > 0)
      })
    })

    test('verifies all seed rentals have valid codes, positive duration, and positive revenue', () => {
      assert.ok(rentalsSeed.length >= 5)
      rentalsSeed.forEach((r) => {
        assert.ok(r.rentalCode.startsWith('RNT-'))
        assert.ok(r.durationDays >= 1)
        assert.ok(r.totalAmount > 0)
        assert.ok(r.dailyRate > 0)
        assert.ok(['paid', 'partial', 'pending'].includes(r.paymentStatus))
        assert.ok(['active', 'returned', 'overdue'].includes(r.status))
      })
    })

    test('verifies total seed rental revenue meets or exceeds ETB 180,000', () => {
      const totalSeedRevenue = rentalsSeed.reduce((sum, r) => sum + r.totalAmount, 0)
      assert.equal(totalSeedRevenue, 182000)
    })
  })

})
