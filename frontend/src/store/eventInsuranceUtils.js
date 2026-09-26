export function calculateInsurancePremium(attendeeCount, hasPyrotechnics = false, outdoorWeatherRider = false) {
  const basePerGuest = 15; // ETB per attendee
  let total = (Number(attendeeCount) || 0) * basePerGuest;
  if (hasPyrotechnics) total += 25000;
  if (outdoorWeatherRider) total += 15000;
  return { attendeeCount, totalPremium: total };
}