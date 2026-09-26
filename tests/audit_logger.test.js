import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatAuditEntry, filterAuditTrail } from '../frontend/src/store/auditLoggerUtils.js';

describe('Audit Logger Suite', () => {
  it('creates structured audit trail entry', () => {
    const entry = formatAuditEntry('update', 'resource', 'res-1', { name: 'Admin' }, { field: 'status' });
    assert.equal(entry.action, 'UPDATE');
    assert.equal(entry.entity, 'resource');
    assert.equal(entry.actor, 'Admin');
  });
  it('filters audit trail by entity', () => {
    const trail = [
      { action: 'CREATE', entity: 'event', actor: 'Alice' },
      { action: 'UPDATE', entity: 'resource', actor: 'Bob' }
    ];
    const filtered = filterAuditTrail(trail, { entity: 'event' });
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].entity, 'event');
  });
});
