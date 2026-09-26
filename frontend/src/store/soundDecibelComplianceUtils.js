export function checkNoiseCompliance(decibels, hourOfDay, indoor = true) {
  const db = Number(decibels) || 0;
  const isNight = hourOfDay >= 22 || hourOfDay < 6;
  const limit = indoor ? (isNight ? 65 : 85) : (isNight ? 55 : 75);
  return { decibels: db, limit, compliant: db <= limit, excess: Math.max(0, db - limit) };
}