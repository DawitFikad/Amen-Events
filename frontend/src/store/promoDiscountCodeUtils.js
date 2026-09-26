export function validateVoucherRedemption(voucher, currentRedemptions = 0) {
  if (!voucher) return { valid: false, error: 'Voucher not found' };
  const max = Number(voucher.maxRedemptions) || 1;
  if (currentRedemptions >= max) return { valid: false, error: 'Voucher usage limit reached' };
  return { valid: true, remainingUses: max - currentRedemptions - 1 };
}