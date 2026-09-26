/**
 * Audit Logging and Action Tracking Utilities
 */
export function formatAuditEntry(action, entity, entityId, actor = 'System', details = {}) {
  const timestamp = new Date().toISOString();
  return {
    id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    action: String(action).toUpperCase(),
    entity: String(entity).toLowerCase(),
    entityId: String(entityId),
    actor: typeof actor === 'object' ? (actor.name || actor.email || 'User') : String(actor),
    timestamp,
    details
  };
}

export function filterAuditTrail(trail = [], filter = {}) {
  if (!Array.isArray(trail)) return [];
  return trail.filter(entry => {
    if (filter.action && entry.action !== filter.action.toUpperCase()) return false;
    if (filter.entity && entry.entity !== filter.entity.toLowerCase()) return false;
    if (filter.actor && !entry.actor.toLowerCase().includes(filter.actor.toLowerCase())) return false;
    return true;
  });
}
