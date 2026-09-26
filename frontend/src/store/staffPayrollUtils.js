/**
 * Staff Scheduling, Wage, and Overtime Calculations
 */
export function calculateShiftHours(startTime, endTime) {
  const s = new Date(startTime).getTime();
  const e = new Date(endTime).getTime();
  if (isNaN(s) || isNaN(e) || e <= s) return 0;
  return Math.round(((e - s) / (1000 * 60 * 60)) * 100) / 100;
}

export function calculateOvertimePay(regularHours, overtimeHours, hourlyRate, overtimeMultiplier = 1.5) {
  const reg = Math.max(0, Number(regularHours) || 0);
  const ot = Math.max(0, Number(overtimeHours) || 0);
  const rate = Math.max(0, Number(hourlyRate) || 0);
  const mult = Math.max(1, Number(overtimeMultiplier) || 1.5);
  const regularPay = Math.round(reg * rate * 100) / 100;
  const overtimePay = Math.round(ot * rate * mult * 100) / 100;
  return { regularHours: reg, overtimeHours: ot, regularPay, overtimePay, totalGross: Math.round((regularPay + overtimePay) * 100) / 100 };
}

export function isShiftOverlapping(shiftA, shiftB) {
  const aStart = new Date(shiftA.start).getTime();
  const aEnd = new Date(shiftA.end).getTime();
  const bStart = new Date(shiftB.start).getTime();
  const bEnd = new Date(shiftB.end).getTime();
  if (isNaN(aStart) || isNaN(aEnd) || isNaN(bStart) || isNaN(bEnd)) return false;
  return aStart < bEnd && bStart < aEnd;
}

export function verifyRestPeriod(shiftEnd, nextShiftStart, minRestHours = 8) {
  const end = new Date(shiftEnd).getTime();
  const next = new Date(nextShiftStart).getTime();
  if (isNaN(end) || isNaN(next)) return { valid: false, restHours: 0 };
  const restHours = (next - end) / (1000 * 60 * 60);
  return { valid: restHours >= minRestHours, restHours: Math.round(restHours * 100) / 100 };
}
