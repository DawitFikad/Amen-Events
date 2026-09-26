/**
 * Ticketing, Promo Code, and Tiered Discount Logic
 */
export function calculateTieredTicketPrice(basePrice, quantity, tier = 'standard') {
  const p = Number(basePrice) || 0;
  const q = Math.max(1, Number(quantity) || 1);
  let multiplier = 1.0;
  if (tier === 'early_bird') multiplier = 0.8;
  else if (tier === 'vip') multiplier = 1.8;
  else if (tier === 'group_pass' && q >= 5) multiplier = 0.85;
  const unitPrice = Math.round(p * multiplier * 100) / 100;
  return { tier, unitPrice, quantity: q, subtotal: Math.round(unitPrice * q * 100) / 100 };
}

export function applyPromoCode(subtotal, promoCode, activePromos = {}) {
  const amt = Number(subtotal) || 0;
  if (!promoCode || amt <= 0) return { valid: false, discount: 0, finalAmount: amt };
  const code = promoCode.toUpperCase().trim();
  const promo = activePromos[code];
  if (!promo) return { valid: false, error: 'Invalid promo code', discount: 0, finalAmount: amt };
  let discount = 0;
  if (promo.type === 'percentage') discount = Math.round(amt * (promo.value / 100) * 100) / 100;
  else if (promo.type === 'fixed') discount = Math.min(amt, promo.value);
  return { valid: true, code, discount, finalAmount: Math.round((amt - discount) * 100) / 100 };
}

export function calculateTicketFees(ticketTotal, processingRate = 0.035, flatFee = 25) {
  const t = Number(ticketTotal) || 0;
  if (t <= 0) return { subtotal: 0, fee: 0, grandTotal: 0 };
  const fee = Math.round((t * processingRate + flatFee) * 100) / 100;
  return { subtotal: t, processingFee: fee, grandTotal: Math.round((t + fee) * 100) / 100 };
}
