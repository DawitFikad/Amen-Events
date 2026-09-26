// Utility functions and business logic for Inventory Equipment Rentals & Monetization.

/**
 * Calculates rental duration in days between two YYYY-MM-DD date strings.
 * Minimum rental period is 1 day.
 */
export function calculateRentalDuration(startDate, endDate) {
  if (!startDate || !endDate) return 1
  const d1 = new Date(startDate)
  const d2 = new Date(endDate)
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 1
  const diffMs = d2.getTime() - d1.getTime()
  if (diffMs <= 0) return 1
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24))
  return Math.max(1, days)
}

/**
 * Calculates total rental revenue: quantity * dailyRate * durationDays.
 */
export function calculateRentalRevenue(qty, dailyRate, durationDays = 1) {
  const q = Math.max(0, Number(qty) || 0)
  const rate = Math.max(0, Number(dailyRate) || 0)
  const days = Math.max(1, Number(durationDays) || 1)
  return Math.round(q * rate * days)
}

/**
 * Calculates total payable upon checkout: rental revenue + refundable security deposit.
 */
export function calculateTotalPayable(rentalRevenue, deposit = 0) {
  const rev = Math.max(0, Number(rentalRevenue) || 0)
  const dep = Math.max(0, Number(deposit) || 0)
  return rev + dep
}

/**
 * Calculates remaining available units for an asset that can be allocated or rented.
 */
export function calculateAvailableStock(resource) {
  if (!resource) return 0
  const total = Math.max(0, Number(resource.qty) || 0)
  const allocated = Math.max(0, Number(resource.allocated) || 0)
  const rented = Math.max(0, Number(resource.rented) || 0)
  return Math.max(0, total - allocated - rented)
}

/**
 * Checks if a rental can be fulfilled given requested quantity and available stock.
 */
export function canFulfillRental(requestedQty, availableStock) {
  const req = Number(requestedQty)
  if (!Number.isInteger(req) || req <= 0) return false
  return req <= Number(availableStock)
}

/**
 * Determines if an active rental is overdue relative to a given date (YYYY-MM-DD).
 */
export function isRentalOverdue(rental, referenceDate) {
  if (!rental || rental.status !== 'active') return false
  if (!rental.endDate || !referenceDate) return false
  return rental.endDate < referenceDate
}

/**
 * Returns number of overdue days for an active rental past its scheduled return date.
 */
export function calculateOverdueDays(rental, referenceDate) {
  if (!isRentalOverdue(rental, referenceDate)) return 0
  const end = new Date(rental.endDate)
  const ref = new Date(referenceDate)
  const diffMs = ref.getTime() - end.getTime()
  if (diffMs <= 0) return 0
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Formats standard rental reference codes: e.g. RNT-2026-001
 */
export function formatRentalRef(index, year = 2026) {
  const num = Math.max(1, Number(index) || 1)
  return `RNT-${year}-${String(num).padStart(3, '0')}`
}

/**
 * Aggregates financial and operational metrics across an array of rental records.
 */
export function aggregateRentalMetrics(rentals = [], referenceDate = new Date().toISOString().slice(0, 10)) {
  const list = Array.isArray(rentals) ? rentals : []
  let totalRevenue = 0
  let activeRevenue = 0
  let activeCount = 0
  let rentedUnits = 0
  let depositsHeld = 0
  let overdueCount = 0
  let completedCount = 0
  let paidRevenue = 0
  let pendingRevenue = 0

  for (const r of list) {
    const amount = Number(r.totalAmount) || 0
    const qty = Number(r.qty) || 1
    const deposit = Number(r.deposit) || 0
    totalRevenue += amount

    if (r.paymentStatus === 'paid') {
      paidRevenue += amount
    } else {
      pendingRevenue += amount
    }

    if (r.depositStatus === 'held') {
      depositsHeld += deposit
    }

    if (r.status === 'active' || r.status === 'overdue') {
      activeCount += 1
      activeRevenue += amount
      rentedUnits += qty
      if (r.endDate && r.endDate < referenceDate) {
        overdueCount += 1
      }
    } else if (r.status === 'returned') {
      completedCount += 1
    }
  }

  return {
    totalRentals: list.length,
    totalRevenue,
    activeRevenue,
    activeCount,
    rentedUnits,
    depositsHeld,
    overdueCount,
    completedCount,
    paidRevenue,
    pendingRevenue,
  }
}

/**
 * Calculates deposit settlement upon return: refund amount and damage deductions.
 */
export function calculateDepositSettlement(depositHeld, damageDeduction = 0, action = 'refunded') {
  const dep = Math.max(0, Number(depositHeld) || 0)
  const deduction = Math.max(0, Number(damageDeduction) || 0)

  if (action === 'forfeited') {
    return { refundAmount: 0, deduction: dep, status: 'forfeited' }
  }
  if (action === 'held') {
    return { refundAmount: 0, deduction: 0, status: 'held' }
  }

  const effectiveDeduction = Math.min(dep, deduction)
  const refundAmount = Math.max(0, dep - effectiveDeduction)
  return {
    refundAmount,
    deduction: effectiveDeduction,
    status: refundAmount === dep ? 'refunded' : 'partial_deduction',
  }
}

/**
 * Filter rental records by search term and status pill.
 */
export function filterRentalRecords(rentals = [], { query = '', status = 'all', referenceDate } = {}) {
  const refDate = referenceDate || new Date().toISOString().slice(0, 10)
  const q = String(query).toLowerCase().trim()

  return (rentals || []).filter((r) => {
    const isOverdue = (r.status === 'active' || r.status === 'overdue') && r.endDate < refDate

    if (status === 'active' && r.status !== 'active') return false
    if (status === 'returned' && r.status !== 'returned') return false
    if (status === 'overdue' && !isOverdue) return false

    if (q) {
      const haystack = `${r.rentalCode || ''} ${r.resourceName || ''} ${r.renterName || ''} ${r.renterCompany || ''} ${r.renterPhone || ''}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }

    return true
  })
}

/**
 * Validates a rental creation form.
 */
export function validateRentalCreation(form, availableStock = Infinity) {
  const errors = {}

  if (!form.resourceId) errors.resourceId = 'Please select an asset to rent'

  const qty = Number(form.qty)
  if (!form.qty || isNaN(qty) || qty <= 0) {
    errors.qty = 'Quantity must be at least 1'
  } else if (!Number.isInteger(qty)) {
    errors.qty = 'Quantity must be a whole number'
  } else if (qty > availableStock) {
    errors.qty = `Requested quantity exceeds available stock (${availableStock})`
  }

  if (!form.renterName || String(form.renterName).trim().length < 2) {
    errors.renterName = 'Renter name must be at least 2 characters'
  }

  if (!form.startDate) {
    errors.startDate = 'Rental start date is required'
  }

  if (!form.endDate) {
    errors.endDate = 'Rental return date is required'
  } else if (form.startDate && form.endDate < form.startDate) {
    errors.endDate = 'Return date cannot be earlier than start date'
  }

  const rate = Number(form.dailyRate)
  if (form.dailyRate === undefined || form.dailyRate === '' || isNaN(rate) || rate < 0) {
    errors.dailyRate = 'Daily rate must be a non-negative number'
  }

  const deposit = Number(form.deposit)
  if (form.deposit !== undefined && form.deposit !== '' && (isNaN(deposit) || deposit < 0)) {
    errors.deposit = 'Deposit must be a non-negative number'
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    first: Object.values(errors)[0] || '',
  }
}
