/**
 * Finance & Budget Calculation Utilities for Amen Events ERP
 * Handles VAT (15%), Withholding tax (2%), budget variance, profit margins, and aging buckets.
 */

export function calculateTaxAndWithholding(amount, vatRate = 0.15, withholdingRate = 0.02) {
  const num = Number(amount);
  if (isNaN(num) || num <= 0) {
    return {
      subtotal: 0,
      vatAmount: 0,
      withholdingAmount: 0,
      netPayable: 0,
      grossTotal: 0
    };
  }

  const vat = Math.round(num * vatRate * 100) / 100;
  const withholding = Math.round(num * withholdingRate * 100) / 100;
  const gross = Math.round((num + vat) * 100) / 100;
  const net = Math.round((gross - withholding) * 100) / 100;

  return {
    subtotal: num,
    vatAmount: vat,
    withholdingAmount: withholding,
    grossTotal: gross,
    netPayable: net
  };
}

export function calculateBudgetVariance(budgeted, actual) {
  const b = Number(budgeted) || 0;
  const a = Number(actual) || 0;
  const variance = Math.round((b - a) * 100) / 100;
  const percentage = b > 0 ? Math.round(((b - a) / b) * 10000) / 100 : 0;
  const isOverBudget = a > b;

  return {
    budgeted: b,
    actual: a,
    variance,
    percentage,
    isOverBudget
  };
}

export function calculateProfitMargin(revenue, expenses) {
  const rev = Number(revenue) || 0;
  const exp = Number(expenses) || 0;
  const netProfit = Math.round((rev - exp) * 100) / 100;
  const marginPercentage = rev > 0 ? Math.round((netProfit / rev) * 10000) / 100 : 0;

  return {
    revenue: rev,
    expenses: exp,
    netProfit,
    marginPercentage,
    isProfitable: netProfit > 0
  };
}

export function categorizeExpense(amount, category) {
  const amt = Number(amount) || 0;
  const validCategories = ['venue', 'catering', 'equipment', 'marketing', 'staff', 'logistics', 'miscellaneous'];
  const cat = (category || 'miscellaneous').toLowerCase().trim();
  const normalizedCategory = validCategories.includes(cat) ? cat : 'miscellaneous';

  return {
    category: normalizedCategory,
    amount: amt,
    isOperational: ['venue', 'catering', 'equipment', 'staff'].includes(normalizedCategory)
  };
}

export function computeCashflowBreakdown(incomes = [], expenses = []) {
  const safeIncomes = Array.isArray(incomes) ? incomes : [];
  const safeExpenses = Array.isArray(expenses) ? expenses : [];

  const totalIncome = safeIncomes.reduce((acc, curr) => acc + (Number(curr?.amount) || 0), 0);
  const totalExpense = safeExpenses.reduce((acc, curr) => acc + (Number(curr?.amount) || 0), 0);
  const netCashflow = Math.round((totalIncome - totalExpense) * 100) / 100;

  return {
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpense: Math.round(totalExpense * 100) / 100,
    netCashflow,
    healthy: netCashflow >= 0
  };
}

export function calculateAgingBucket(dueDate, asOfDate = new Date()) {
  if (!dueDate) return 'current';
  const due = new Date(dueDate).setHours(0, 0, 0, 0);
  const asOf = new Date(asOfDate).setHours(0, 0, 0, 0);
  const diffDays = Math.floor((asOf - due) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'current';
  if (diffDays <= 30) return '1-30_days';
  if (diffDays <= 60) return '31-60_days';
  if (diffDays <= 90) return '61-90_days';
  return '90+_days';
}

export function formatETBCurrency(amount) {
  const num = Number(amount);
  if (isNaN(num)) return 'ETB 0.00';
  return `ETB ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function calculateBulkDiscount(baseAmount, quantity) {
  const amt = Number(baseAmount) || 0;
  const qty = Number(quantity) || 1;
  let discountRate = 0;

  if (qty >= 50) discountRate = 0.20;
  else if (qty >= 20) discountRate = 0.15;
  else if (qty >= 10) discountRate = 0.10;
  else if (qty >= 5) discountRate = 0.05;

  const totalBefore = Math.round(amt * qty * 100) / 100;
  const discountAmount = Math.round(totalBefore * discountRate * 100) / 100;
  const totalAfter = Math.round((totalBefore - discountAmount) * 100) / 100;

  return {
    quantity: qty,
    discountRate,
    discountAmount,
    totalBeforeDiscount: totalBefore,
    finalAmount: totalAfter
  };
}
