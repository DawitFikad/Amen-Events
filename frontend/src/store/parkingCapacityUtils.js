export function calculateParkingAllocation(totalSpots, vipReservedPercent = 0.20) {
  const total = Math.max(0, Number(totalSpots) || 0);
  const vip = Math.floor(total * vipReservedPercent);
  const general = total - vip;
  return { totalSpots: total, vipSpots: vip, generalSpots: general };
}