import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateStraightLineDepreciation, getBookValue } from '../frontend/src/store/assetDepreciationUtils.js';

describe('Asset Depreciation Suite', () => {
  it('calculates annual straight line depreciation', () => {
    const res = calculateStraightLineDepreciation(50000, 5000, 5);
    assert.equal(res.annualDepreciation, 9000);
  });
  it('calculates remaining book value after 2 years', () => {
    assert.equal(getBookValue(50000, 9000, 2), 32000);
  });
});