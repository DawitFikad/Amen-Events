import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateInsurancePremium } from '../frontend/src/store/eventInsuranceUtils.js';

describe('Event Insurance Suite', () => {
  it('calculates liability premium with high risk riders', () => {
    const res = calculateInsurancePremium(500, true, true);
    assert.equal(res.totalPremium, 47500); // 7500 + 25000 + 15000
  });
});