import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateEventRoi, calculateTicketSalesVelocity } from '../frontend/src/store/analyticsMetricUtils.js';

describe('Executive Analytics Suite', () => {
  it('calculates ROI percentage', () => {
    const roi = calculateEventRoi(150000, 100000);
    assert.equal(roi.netProfit, 50000);
    assert.equal(roi.roiPercentage, 50);
  });
  it('calculates ticket velocity per day', () => {
    const vel = calculateTicketSalesVelocity(300, 15);
    assert.equal(vel, 20);
  });
});
