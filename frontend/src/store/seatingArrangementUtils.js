/**
 * VIP Seating and Table Capacity Allocation
 */
export function calculateTableAssignments(totalGuests, seatsPerTable = 8) {
  const guests = Math.max(0, Number(totalGuests) || 0);
  const seats = Math.max(1, Number(seatsPerTable) || 8);
  const tablesRequired = Math.ceil(guests / seats);
  const spareSeats = (tablesRequired * seats) - guests;
  return { totalGuests: guests, seatsPerTable: seats, tablesRequired, spareSeats };
}

export function assignVipToHeadTable(vips = [], maxHeadTableSeats = 12) {
  if (!Array.isArray(vips)) return { headTable: [], overflow: [] };
  const sorted = [...vips].sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
  return {
    headTable: sorted.slice(0, maxHeadTableSeats),
    overflow: sorted.slice(maxHeadTableSeats)
  };
}
