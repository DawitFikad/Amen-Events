export function calculateStraightLineDepreciation(cost, salvageValue, usefulLifeYears) {
  const c = Math.max(0, Number(cost) || 0);
  const s = Math.max(0, Number(salvageValue) || 0);
  const y = Math.max(1, Number(usefulLifeYears) || 1);
  const annual = Math.max(0, Math.round(((c - s) / y) * 100) / 100);
  return { cost: c, salvageValue: s, usefulLifeYears: y, annualDepreciation: annual, monthlyDepreciation: Math.round((annual / 12) * 100) / 100 };
}
export function getBookValue(cost, annualDepreciation, yearsElapsed) {
  const c = Math.max(0, Number(cost) || 0);
  const dep = Math.max(0, Number(annualDepreciation) || 0);
  const elapsed = Math.max(0, Number(yearsElapsed) || 0);
  return Math.max(0, Math.round((c - (dep * elapsed)) * 100) / 100);
}