import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { shouldSendUrgent, isQuietHours, filterNotificationsByChannel } from '../frontend/src/store/notificationDispatchUtils.js';

describe('Notification Dispatch Suite', () => {
  it('identifies urgent priority alerts', () => {
    assert.equal(shouldSendUrgent('payment_failed', 'high'), true);
    assert.equal(shouldSendUrgent('newsletter', 'low'), false);
  });
  it('filters quiet hours at midnight', () => {
    const midnight = new Date('2026-10-01T23:30:00');
    assert.equal(isQuietHours(midnight, 22, 7), true);
  });
  it('filters notifications by specific channel', () => {
    const notifs = [{ id: 1, channel: 'email' }, { id: 2, channel: 'sms' }];
    assert.equal(filterNotificationsByChannel(notifs, 'sms').length, 1);
  });
});
