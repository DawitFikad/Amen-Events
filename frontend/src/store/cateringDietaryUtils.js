export function aggregateDietaryRequirements(attendees = [], safetyBuffer = 0.05) {
  const counts = { standard: 0, vegetarian: 0, vegan: 0, halal: 0, glutenFree: 0 };
  if (!Array.isArray(attendees)) return counts;
  attendees.forEach(a => {
    const d = (a.dietary || 'standard').toLowerCase();
    if (counts[d] !== undefined) counts[d]++;
    else counts.standard++;
  });
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const bufferUnits = Math.ceil(total * safetyBuffer);
  return { ...counts, totalMeals: total + bufferUnits, safetyBufferUnits: bufferUnits };
}