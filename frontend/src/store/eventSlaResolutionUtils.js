export function checkSlaBreach(createdTime, maxHours = 4) {
  if (!createdTime) return false;
  const elapsed = (Date.now() - new Date(createdTime).getTime()) / (1000 * 60 * 60);
  return elapsed > maxHours;
}