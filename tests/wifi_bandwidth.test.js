import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateRequiredBandwidth } from '../frontend/src/store/wifiBandwidthUtils.js';

describe('WiFi Network Sizing Suite', () => {
  it('calculates bandwidth for 1000 attendees with 60% concurrency', () => {
    const res = calculateRequiredBandwidth(1000, 2, 0.6);
    assert.equal(res.concurrentUsers, 600);
    assert.equal(res.requiredMbps, 1200);
  });
});