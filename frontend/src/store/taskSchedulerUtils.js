/**
 * Operational Task Scheduler and Priority Sorter
 */
export function sortTasksByUrgency(tasks = []) {
  if (!Array.isArray(tasks)) return [];
  const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
  return [...tasks].sort((a, b) => {
    const wa = priorityWeight[a.priority?.toLowerCase()] || 0;
    const wb = priorityWeight[b.priority?.toLowerCase()] || 0;
    if (wb !== wa) return wb - wa;
    return new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
  });
}

export function isTaskOverdue(dueDate, status) {
  if (status === 'completed' || status === 'done') return false;
  if (!dueDate) return false;
  return new Date(dueDate).getTime() < Date.now();
}
