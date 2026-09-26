export function sortPrintQueue(queue = []) {
  if (!Array.isArray(queue)) return [];
  return [...queue].sort((a, b) => {
    if (a.isVip && !b.isVip) return -1;
    if (!a.isVip && b.isVip) return 1;
    return (a.queuedAt || 0) - (b.queuedAt || 0);
  });
}