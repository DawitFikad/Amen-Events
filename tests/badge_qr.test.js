import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateBadgePayload, verifyBadgeQr } from '../frontend/src/store/badgeQrUtils.js';

describe('Badge & QR Security Suite', () => {
  it('generates secure tamper-evident QR payload', () => {
    const res = generateBadgePayload('TCK-001', 'EVT-10', 'ATT-55');
    assert.ok(res.qrDataString.startsWith('AMEN:TCK-001:'));
  });
  it('verifies valid scanned QR string', () => {
    const payload = generateBadgePayload('TCK-001', 'EVT-10', 'ATT-55');
    assert.equal(verifyBadgeQr(payload.qrDataString, 'TCK-001', 'EVT-10', 'ATT-55'), true);
  });
  it('rejects tampered QR string', () => {
    assert.equal(verifyBadgeQr('AMEN:TCK-001:tamperedhash', 'TCK-001', 'EVT-10', 'ATT-55'), false);
  });
});
