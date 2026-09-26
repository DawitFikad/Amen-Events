import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTieredTicketPrice,
  applyPromoCode,
  calculateTicketFees
} from '../frontend/src/store/ticketPricingUtils.js';

describe('Ticketing Pricing Suite', () => {
  it('applies early bird discount', () => {
    const res = calculateTieredTicketPrice(1000, 2, 'early_bird');
    assert.equal(res.subtotal, 1600);
  });
  it('applies promo code', () => {
    const res = applyPromoCode(2000, 'AMEN10', { AMEN10: { type: 'percentage', value: 10 } });
    assert.equal(res.discount, 200);
    assert.equal(res.finalAmount, 1800);
  });
  it('calculates gateway fees', () => {
    const res = calculateTicketFees(1000, 0.035, 25);
    assert.equal(res.processingFee, 60);
    assert.equal(res.grandTotal, 1060);
  });
});
