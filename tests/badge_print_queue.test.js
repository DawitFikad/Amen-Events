import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sortPrintQueue } from '../frontend/src/store/badgePrintQueueUtils.js';

describe('Badge Print Queue Suite', () => {
  it('prioritizes VIP badges over standard queue items', () => {
    const queue = [{ id: 1, isVip: false }, { id: 2, isVip: true }];
    const sorted = sortPrintQueue(queue);
    assert.equal(sorted[0].id, 2);
  });
});