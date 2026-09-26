import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateVendorScore,
  computeMilestonePayout
} from '../frontend/src/store/vendorContractUtils.js';

describe('Vendor Contracts Suite', () => {
  it('calculates composite vendor rating', () => {
    const res = calculateVendorScore(90, 80, 85);
    assert.equal(res.compositeScore, 85.5);
    assert.equal(res.status, 'Approved');
  });
  it('computes milestone progress payout', () => {
    const res = computeMilestonePayout(100000, [{ id: 1 }, { id: 2 }], 4);
    assert.equal(res.payableAmount, 50000);
    assert.equal(res.percentComplete, 50);
  });
});
