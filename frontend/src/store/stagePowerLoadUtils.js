export function calculateTotalElectricalLoad(fixtures = [], breakerWatts = 15000) {
  if (!Array.isArray(fixtures)) return { totalWatts: 0, isSafe: true };
  const total = fixtures.reduce((sum, f) => sum + (Number(f.watts) || 0) * (Number(f.quantity) || 1), 0);
  const maxSafe = breakerWatts * 0.8; // 80% continuous load safety margin
  return { totalWatts: total, breakerWatts, maxSafeWatts: maxSafe, isSafe: total <= maxSafe };
}