import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateSpeakerPayout } from '../frontend/src/store/speakerHonorariumUtils.js';

describe('Speaker Honorarium Suite', () => {
  it('calculates total compensation including travel', () => {
    const res = calculateSpeakerPayout(15000, 2000, 3, 5000);
    assert.equal(res.perDiemTotal, 6000);
    assert.equal(res.grandTotal, 26000);
  });
});