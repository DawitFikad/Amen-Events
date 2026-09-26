import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  hasDateOverlap,
  detectVenueConflict,
  detectSpeakerConflict,
  isCapacityExceeded,
  hasBufferViolation,
  validateEventTimeWindow
} from '../frontend/src/store/eventConflictUtils.js';

describe('Event Scheduling & Conflict Detection Suite', () => {
  describe('hasDateOverlap', () => {
    it('detects direct overlap when interval 1 encloses interval 2', () => {
      assert.equal(hasDateOverlap('2026-11-01T09:00:00', '2026-11-01T17:00:00', '2026-11-01T10:00:00', '2026-11-01T12:00:00'), true);
    });

    it('detects partial overlap when interval 1 starts before and ends during interval 2', () => {
      assert.equal(hasDateOverlap('2026-11-01T09:00:00', '2026-11-01T11:00:00', '2026-11-01T10:00:00', '2026-11-01T12:00:00'), true);
    });

    it('returns false for adjacent non-overlapping times', () => {
      assert.equal(hasDateOverlap('2026-11-01T09:00:00', '2026-11-01T10:00:00', '2026-11-01T10:00:00', '2026-11-01T11:00:00'), false);
    });

    it('returns false when interval 1 is completely before interval 2', () => {
      assert.equal(hasDateOverlap('2026-11-01T08:00:00', '2026-11-01T09:00:00', '2026-11-01T14:00:00', '2026-11-01T16:00:00'), false);
    });

    it('returns false for invalid timestamps', () => {
      assert.equal(hasDateOverlap('invalid', 'dates', '2026-11-01', '2026-11-02'), false);
    });
  });

  describe('detectVenueConflict', () => {
    const existing = [
      { id: 'b1', venueId: 'v1', startDate: '2026-11-10T10:00:00', endDate: '2026-11-10T14:00:00', status: 'confirmed' },
      { id: 'b2', venueId: 'v1', startDate: '2026-11-10T15:00:00', endDate: '2026-11-10T18:00:00', status: 'cancelled' },
      { id: 'b3', venueId: 'v2', startDate: '2026-11-10T10:00:00', endDate: '2026-11-10T14:00:00', status: 'confirmed' }
    ];

    it('flags conflict when same venue is already booked during requested time', () => {
      const res = detectVenueConflict('v1', '2026-11-10T11:00:00', '2026-11-10T13:00:00', existing);
      assert.equal(res.hasConflict, true);
      assert.equal(res.conflictCount, 1);
      assert.equal(res.conflictingBookings[0].id, 'b1');
    });

    it('ignores cancelled bookings', () => {
      const res = detectVenueConflict('v1', '2026-11-10T15:30:00', '2026-11-10T17:00:00', existing);
      assert.equal(res.hasConflict, false);
      assert.equal(res.conflictCount, 0);
    });

    it('allows booking on a different venue at the same time', () => {
      const res = detectVenueConflict('v3', '2026-11-10T11:00:00', '2026-11-10T13:00:00', existing);
      assert.equal(res.hasConflict, false);
    });
  });

  describe('detectSpeakerConflict', () => {
    const sessions = [
      { id: 's1', speakerId: 'spk-1', start: '2026-11-15T09:00:00', end: '2026-11-15T10:30:00' },
      { id: 's2', speakerIds: ['spk-1', 'spk-2'], start: '2026-11-15T14:00:00', end: '2026-11-15T15:00:00' }
    ];

    it('detects speaker conflict in single speaker session', () => {
      const res = detectSpeakerConflict('spk-1', '2026-11-15T09:30:00', '2026-11-15T11:00:00', sessions);
      assert.equal(res.hasConflict, true);
    });

    it('detects speaker conflict when speaker is part of a panel array', () => {
      const res = detectSpeakerConflict('spk-2', '2026-11-15T14:15:00', '2026-11-15T14:45:00', sessions);
      assert.equal(res.hasConflict, true);
    });

    it('allows booking when speaker has no overlapping sessions', () => {
      const res = detectSpeakerConflict('spk-1', '2026-11-15T11:00:00', '2026-11-15T12:00:00', sessions);
      assert.equal(res.hasConflict, false);
    });
  });

  describe('isCapacityExceeded', () => {
    it('detects capacity overflow', () => {
      const res = isCapacityExceeded(550, 500);
      assert.equal(res.exceeded, true);
      assert.equal(res.overflow, 50);
      assert.equal(res.utilization, 110);
    });

    it('passes when attendee count is within limit', () => {
      const res = isCapacityExceeded(400, 500);
      assert.equal(res.exceeded, false);
      assert.equal(res.overflow, 0);
      assert.equal(res.utilization, 80);
    });

    it('handles zero capacity safely', () => {
      const res = isCapacityExceeded(100, 0);
      assert.equal(res.exceeded, false);
      assert.equal(res.utilization, 0);
    });
  });

  describe('hasBufferViolation', () => {
    it('detects violation when gap between events is less than required 30 min buffer', () => {
      const violated = hasBufferViolation('2026-11-20T12:00:00', '2026-11-20T12:15:00', 30);
      assert.equal(violated, true);
    });

    it('passes when gap meets or exceeds buffer time', () => {
      const violated = hasBufferViolation('2026-11-20T12:00:00', '2026-11-20T12:45:00', 30);
      assert.equal(violated, false);
    });
  });

  describe('validateEventTimeWindow', () => {
    it('validates a standard 4-hour conference window', () => {
      const res = validateEventTimeWindow('2026-11-25T08:00:00', '2026-11-25T12:00:00', 30, 7);
      assert.equal(res.valid, true);
      assert.equal(res.durationMinutes, 240);
    });

    it('rejects inverted time window', () => {
      const res = validateEventTimeWindow('2026-11-25T12:00:00', '2026-11-25T08:00:00');
      assert.equal(res.valid, false);
      assert.equal(res.error, 'End time must be after start time');
    });

    it('rejects duration shorter than minimum minutes', () => {
      const res = validateEventTimeWindow('2026-11-25T08:00:00', '2026-11-25T08:15:00', 30);
      assert.equal(res.valid, false);
      assert.match(res.error, /duration must be at least 30 minutes/);
    });

    it('rejects duration exceeding maximum days', () => {
      const res = validateEventTimeWindow('2026-11-01T08:00:00', '2026-11-30T08:00:00', 30, 14);
      assert.equal(res.valid, false);
      assert.match(res.error, /cannot exceed 14 days/);
    });
  });
});
