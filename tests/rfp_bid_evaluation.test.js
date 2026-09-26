import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { rankVendorBids } from '../frontend/src/store/rfpBidEvaluationUtils.js';

describe('RFP Bid Evaluation Suite', () => {
  it('ranks vendor bids by weighted price and technical scores', () => {
    const bids = [
      { id: 'v1', price: 50000, technicalRating: 85 },
      { id: 'v2', price: 40000, technicalRating: 95 }
    ];
    const ranked = rankVendorBids(bids);
    assert.equal(ranked[0].id, 'v2');
  });
});