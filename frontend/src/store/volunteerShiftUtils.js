export function allocateVolunteerResources(volunteersCount, hoursPerShift = 4) {
  const count = Math.max(0, Number(volunteersCount) || 0);
  const mealTokens = count;
  const certificates = count;
  return { volunteerCount: count, mealTokens, certificates, totalVolunteerHours: count * hoursPerShift };
}