import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkSlaBreach } from '../frontend/src/store/eventSlaResolutionUtils.js';

describe('SLA Escalation Suite', () => {
  it('detects SLA deadline breaches', () => {
    assert.equal(checkSlaBreach('2020-01-01', 4), true);
  });
});