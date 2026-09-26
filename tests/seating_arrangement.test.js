import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateTableAssignments, assignVipToHeadTable } from '../frontend/src/store/seatingArrangementUtils.js';

describe('Seating Arrangement Suite', () => {
  it('calculates tables required for 50 guests with 8 per table', () => {
    const res = calculateTableAssignments(50, 8);
    assert.equal(res.tablesRequired, 7); // 7 * 8 = 56
    assert.equal(res.spareSeats, 6);
  });
  it('assigns highest priority VIPs to head table', () => {
    const vips = [{ id: 1, priorityScore: 50 }, { id: 2, priorityScore: 90 }, { id: 3, priorityScore: 70 }];
    const res = assignVipToHeadTable(vips, 2);
    assert.equal(res.headTable.length, 2);
    assert.equal(res.headTable[0].id, 2);
    assert.equal(res.overflow.length, 1);
  });
});
