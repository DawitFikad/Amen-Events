import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateNps } from '../frontend/src/store/feedbackNpsUtils.js';

describe('Feedback NPS Suite', () => {
  it('calculates NPS score correctly', () => {
    const ratings = [10, 10, 9, 8, 7, 5, 2]; // 3 promoters, 2 passives, 2 detractors -> (3-2)/7 = +14
    const res = calculateNps(ratings);
    assert.equal(res.promoters, 3);
    assert.equal(res.detractors, 2);
    assert.equal(res.nps, 14);
  });
});