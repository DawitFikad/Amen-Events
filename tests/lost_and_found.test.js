import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isItemPastRetention } from '../frontend/src/store/lostAndFoundUtils.js';

describe('Lost and Found Custody Suite', () => {
  it('flags items exceeding 30 day holding policy', () => {
    assert.equal(isItemPastRetention('2020-01-01', 30), true);
  });
});