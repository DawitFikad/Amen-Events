import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkNoiseCompliance } from '../frontend/src/store/soundDecibelComplianceUtils.js';

describe('Sound Decibel Compliance Suite', () => {
  it('enforces stricter limits during night hours', () => {
    const res = checkNoiseCompliance(70, 23, false);
    assert.equal(res.compliant, false);
    assert.equal(res.excess, 15);
  });
});