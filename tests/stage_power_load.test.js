import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateTotalElectricalLoad } from '../frontend/src/store/stagePowerLoadUtils.js';

describe('Stage Electrical Load Suite', () => {
  it('protects against electrical overload using 80% safety margin', () => {
    const fixtures = [{ watts: 2000, quantity: 5 }]; // 10,000 watts
    const res = calculateTotalElectricalLoad(fixtures, 12000); // 80% of 12000 = 9600
    assert.equal(res.isSafe, false);
  });
});