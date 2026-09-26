import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateShiftHours,
  calculateOvertimePay,
  isShiftOverlapping,
  verifyRestPeriod
} from '../frontend/src/store/staffPayrollUtils.js';

describe('Staff Scheduling & Payroll Suite', () => {
  it('calculates standard 8-hour shift duration', () => {
    assert.equal(calculateShiftHours('2026-10-01T08:00:00', '2026-10-01T16:00:00'), 8);
  });
  it('calculates overtime pay with multiplier', () => {
    const pay = calculateOvertimePay(40, 10, 200, 1.5);
    assert.equal(pay.regularPay, 8000);
    assert.equal(pay.overtimePay, 3000);
    assert.equal(pay.totalGross, 11000);
  });
  it('detects shift collision', () => {
    assert.equal(isShiftOverlapping(
      { start: '2026-10-01T09:00:00', end: '2026-10-01T15:00:00' },
      { start: '2026-10-01T14:00:00', end: '2026-10-01T20:00:00' }
    ), true);
  });
  it('verifies rest period', () => {
    assert.equal(verifyRestPeriod('2026-10-01T22:00:00', '2026-10-02T08:00:00', 8).valid, true);
  });
});
