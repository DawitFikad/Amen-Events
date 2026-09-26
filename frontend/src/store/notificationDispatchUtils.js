/**
 * Notification Routing and Quiet Hours Filter
 */
export function shouldSendUrgent(type, priority) {
  if (priority === 'urgent' || priority === 'critical') return true;
  return ['payment_failed', 'security_alert', 'schedule_change'].includes(type);
}

export function isQuietHours(date = new Date(), startHour = 22, endHour = 7) {
  const h = new Date(date).getHours();
  if (startHour > endHour) {
    return h >= startHour || h < endHour;
  }
  return h >= startHour && h < endHour;
}

export function filterNotificationsByChannel(notifications = [], channel = 'all') {
  if (!Array.isArray(notifications)) return [];
  if (channel === 'all') return notifications;
  return notifications.filter(n => (n.channel || 'in_app') === channel);
}
