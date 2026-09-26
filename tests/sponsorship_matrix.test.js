import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getTierDeliverables, calculateFulfillmentProgress } from '../frontend/src/store/sponsorshipMatrixUtils.js';

describe('Sponsorship Matrix Suite', () => {
  it('retrieves deliverables for Title Partner', () => {
    const delivs = getTierDeliverables('Title Partner');
    assert.ok(delivs.includes('Main Stage Keynote'));
  });
  it('calculates deliverable fulfillment progress', () => {
    const delivs = [{ completed: true }, { completed: true }, { completed: false }, { completed: false }];
    assert.equal(calculateFulfillmentProgress(delivs), 50);
  });
});
