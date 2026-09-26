import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isMaintenanceDue, calculateDowntimeCost } from '../frontend/src/store/equipmentMaintenanceUtils.js';

describe('Equipment Maintenance Suite', () => {
  it('flags maintenance as due when interval exceeded', () => {
    assert.equal(isMaintenanceDue('2020-01-01', 90), true);
  });
  it('computes financial impact of equipment downtime', () => {
    assert.equal(calculateDowntimeCost(10, 2500), 25000);
  });
});