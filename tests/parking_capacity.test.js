import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateParkingAllocation } from '../frontend/src/store/parkingCapacityUtils.js';

describe('Parking Logistics Suite', () => {
  it('reserves 20% of parking for VIP guests', () => {
    const res = calculateParkingAllocation(500, 0.20);
    assert.equal(res.vipSpots, 100);
    assert.equal(res.generalSpots, 400);
  });
});