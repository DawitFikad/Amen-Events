export function isMaintenanceDue(lastServiceDate, intervalDays = 90) {
  if (!lastServiceDate) return true;
  const last = new Date(lastServiceDate).getTime();
  const nextDue = last + (intervalDays * 24 * 60 * 60 * 1000);
  return Date.now() >= nextDue;
}
export function calculateDowntimeCost(downtimeHours, hourlyRevenueImpact) {
  const h = Math.max(0, Number(downtimeHours) || 0);
  const r = Math.max(0, Number(hourlyRevenueImpact) || 0);
  return Math.round(h * r * 100) / 100;
}