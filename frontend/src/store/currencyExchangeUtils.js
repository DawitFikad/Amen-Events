/**
 * Multi-Currency Exchange and Conversion Utilities
 */
export const EXCHANGE_RATES = {
  ETB: 1.0,
  USD: 145.0, // Example bank reference rate
  EUR: 155.0,
  GBP: 180.0
};

export function convertToETB(amount, currency = 'USD', rates = EXCHANGE_RATES) {
  const amt = Number(amount) || 0;
  const rate = rates[currency.toUpperCase()] || 1.0;
  return Math.round(amt * rate * 100) / 100;
}

export function convertFromETB(amountETB, targetCurrency = 'USD', rates = EXCHANGE_RATES) {
  const amt = Number(amountETB) || 0;
  const rate = rates[targetCurrency.toUpperCase()] || 1.0;
  if (rate <= 0) return 0;
  return Math.round((amt / rate) * 100) / 100;
}
