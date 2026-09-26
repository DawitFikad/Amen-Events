/**
 * Vendor SLA and Contract Milestone Tracking
 */
export function calculateVendorScore(qualityScore, punctualityScore, responsivenessScore) {
  const q = Math.min(100, Math.max(0, Number(qualityScore) || 0));
  const p = Math.min(100, Math.max(0, Number(punctualityScore) || 0));
  const r = Math.min(100, Math.max(0, Number(responsivenessScore) || 0));
  const composite = Math.round((q * 0.45 + p * 0.35 + r * 0.20) * 100) / 100;
  let status = 'Approved';
  if (composite < 60) status = 'Probation';
  return { compositeScore: composite, quality: q, punctuality: p, responsiveness: r, status };
}

export function computeMilestonePayout(contractAmount, completedMilestones = [], totalCount = 1) {
  const total = Number(contractAmount) || 0;
  const count = Math.max(1, Number(totalCount) || 1);
  const completed = Array.isArray(completedMilestones) ? completedMilestones.length : 0;
  const perMilestone = total / count;
  const payable = Math.round(completed * perMilestone * 100) / 100;
  return { contractAmount: total, payableAmount: payable, remainingBalance: Math.round((total - payable) * 100) / 100, percentComplete: Math.round((completed / count) * 100) };
}
