/**
 * CRM, Client Lifecycle, and Account Health Scoring Utilities
 * Computes lead scoring, client VIP tiers, CLV, attendance metrics, and overdue invoice tracking.
 */

export function computeLeadScore(profile = {}) {
  let score = 0;
  const budget = Number(profile.budget) || 0;
  const interactions = Number(profile.interactionCount) || 0;
  const companySize = Number(profile.companySize) || 0;
  const timeline = (profile.timeline || '').toLowerCase();

  // Budget points (max 40)
  if (budget >= 500000) score += 40;
  else if (budget >= 200000) score += 30;
  else if (budget >= 50000) score += 20;
  else if (budget > 0) score += 10;

  // Interaction engagement points (max 25)
  score += Math.min(25, interactions * 5);

  // Company scale points (max 20)
  if (companySize >= 100) score += 20;
  else if (companySize >= 20) score += 15;
  else if (companySize >= 5) score += 10;
  else if (companySize > 0) score += 5;

  // Timeline urgency (max 15)
  if (timeline.includes('immediate') || timeline.includes('urgent')) score += 15;
  else if (timeline.includes('month') || timeline.includes('30')) score += 10;
  else if (timeline.includes('quarter')) score += 5;

  let grade = 'Cold';
  if (score >= 75) grade = 'Hot';
  else if (score >= 45) grade = 'Warm';

  return { score: Math.min(100, score), grade };
}

export function determineClientTier(totalSpend) {
  const spend = Number(totalSpend) || 0;
  if (spend >= 1000000) return { tier: 'Platinum VIP', discountRate: 0.15, prioritySupport: true };
  if (spend >= 500000) return { tier: 'Gold Enterprise', discountRate: 0.10, prioritySupport: true };
  if (spend >= 150000) return { tier: 'Silver Business', discountRate: 0.05, prioritySupport: false };
  return { tier: 'Standard Client', discountRate: 0.00, prioritySupport: false };
}

export function calculateCustomerLifetimeValue(orders = []) {
  if (!Array.isArray(orders) || orders.length === 0) {
    return { totalSpend: 0, orderCount: 0, averageOrderValue: 0 };
  }

  const validOrders = orders.filter(o => o.status !== 'cancelled' && o.status !== 'refunded');
  const total = validOrders.reduce((sum, o) => sum + (Number(o.total || o.amount) || 0), 0);
  const count = validOrders.length;
  const aov = count > 0 ? Math.round((total / count) * 100) / 100 : 0;

  return {
    totalSpend: Math.round(total * 100) / 100,
    orderCount: count,
    averageOrderValue: aov
  };
}

export function calculateAttendanceRate(registered, attended) {
  const reg = Number(registered) || 0;
  const att = Number(attended) || 0;

  if (reg <= 0) return { rate: 0, dropoffRate: 0, noShowCount: 0 };

  const safeAtt = Math.min(reg, Math.max(0, att));
  const noShows = reg - safeAtt;
  const rate = Math.round((safeAtt / reg) * 10000) / 100;
  const dropoffRate = Math.round((noShows / reg) * 10000) / 100;

  return {
    registered: reg,
    attended: safeAtt,
    noShowCount: noShows,
    rate,
    dropoffRate
  };
}

export function isInvoiceOverdue(dueDate, paymentStatus, asOfDate = new Date()) {
  const status = (paymentStatus || '').toLowerCase();
  if (status === 'paid' || status === 'refunded' || status === 'void') return false;
  if (!dueDate) return false;

  const due = new Date(dueDate).setHours(0, 0, 0, 0);
  const asOf = new Date(asOfDate).setHours(0, 0, 0, 0);

  return due < asOf;
}

export function calculateLateFee(invoiceAmount, daysLate, dailyPenaltyRate = 0.001) {
  const amt = Number(invoiceAmount) || 0;
  const days = Math.max(0, Number(daysLate) || 0);

  if (amt <= 0 || days <= 0) return { penaltyAmount: 0, totalDue: amt };

  // Cap late penalty to 15% maximum of original invoice
  const rawPenalty = amt * days * dailyPenaltyRate;
  const maxPenalty = amt * 0.15;
  const penalty = Math.min(rawPenalty, maxPenalty);

  return {
    penaltyAmount: Math.round(penalty * 100) / 100,
    totalDue: Math.round((amt + penalty) * 100) / 100
  };
}
