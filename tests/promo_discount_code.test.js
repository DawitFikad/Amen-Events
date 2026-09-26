import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateVoucherRedemption } from '../frontend/src/store/promoDiscountCodeUtils.js';

describe('Voucher Redemption Suite', () => {
  it('guards against voucher over-redemption', () => {
    const v = { maxRedemptions: 5 };
    assert.equal(validateVoucherRedemption(v, 5).valid, false);
    assert.equal(validateVoucherRedemption(v, 2).valid, true);
  });
});