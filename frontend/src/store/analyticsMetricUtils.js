/**
 * Executive Analytics and Event ROI Calculations
 */
export function calculateEventRoi(totalRevenue, totalCost) {
  const rev = Number(totalRevenue) || 0;
  const cost = Number(totalCost) || 0;
  if (cost <= 0) return { netProfit: rev, roiPercentage: 0 };
  const net = Math.round((rev - cost) * 100) / 100;
  const roi = Math.round((net / cost) * 10000) / 100;
  return { netProfit: net, roiPercentage: roi };
}

export function calculateTicketSalesVelocity(ticketsSold, daysOnSale) {
  const tickets = Math.max(0, Number(ticketsSold) || 0);
  const days = Math.max(1, Number(daysOnSale) || 1);
  return Math.round((tickets / days) * 100) / 100;
}
