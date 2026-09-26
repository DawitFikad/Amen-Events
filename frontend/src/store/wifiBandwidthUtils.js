export function calculateRequiredBandwidth(expectedAttendees, mbpsPerDevice = 2.5, concurrency = 0.6) {
  const att = Math.max(0, Number(expectedAttendees) || 0);
  const activeDevices = Math.round(att * concurrency);
  const totalMbps = Math.round(activeDevices * mbpsPerDevice);
  return { expectedAttendees: att, concurrentUsers: activeDevices, requiredMbps: totalMbps };
}