import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateBoothCost, isBoothAvailable } from '../frontend/src/store/exhibitionBoothUtils.js';

describe('Exhibition Booths Suite', () => {
  it('calculates booth total cost with power add-on', () => {
    const res = calculateBoothCost(12, 1500, 3000);
    assert.equal(res.spaceCost, 18000);
    assert.equal(res.totalCost, 21000);
  });
  it('checks booth assignment availability', () => {
    const allocated = [{ number: 'A-101', status: 'confirmed' }];
    assert.equal(isBoothAvailable('A-101', allocated), false);
    assert.equal(isBoothAvailable('A-102', allocated), true);
  });
});
