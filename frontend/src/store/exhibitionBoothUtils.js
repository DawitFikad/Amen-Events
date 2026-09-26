/**
 * Exhibition Booth Space Allocation and Power Calculation
 */
export function calculateBoothCost(squareMeters, ratePerSqMeter, powerAddonCost = 0) {
  const sqm = Math.max(0, Number(squareMeters) || 0);
  const rate = Math.max(0, Number(ratePerSqMeter) || 0);
  const power = Math.max(0, Number(powerAddonCost) || 0);
  const spaceCost = Math.round(sqm * rate * 100) / 100;
  return { squareMeters: sqm, spaceCost, powerAddonCost: power, totalCost: Math.round((spaceCost + power) * 100) / 100 };
}

export function isBoothAvailable(boothNumber, allocatedBooths = []) {
  if (!boothNumber) return false;
  return !allocatedBooths.some(b => b.number === boothNumber && b.status !== 'cancelled');
}
