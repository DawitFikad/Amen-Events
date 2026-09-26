export function isItemPastRetention(loggedDate, retentionDays = 30) {
  if (!loggedDate) return false;
  const logged = new Date(loggedDate).getTime();
  const deadline = logged + (retentionDays * 24 * 60 * 60 * 1000);
  return Date.now() >= deadline;
}