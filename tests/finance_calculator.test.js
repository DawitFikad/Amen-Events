import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTaxAndWithholding,
  calculateBudgetVariance,
  calculateProfitMargin,
  categorizeExpense,
  computeCashflowBreakdown,
  calculateAgingBucket,
  formatETBCurrency,
  calculateBulkDiscount
} from '../frontend/src/store/financeUtils.js';

describe('Finance & Budget Calculations Suite', () => {
  describe('calculateTaxAndWithholding', () => {
    it('calculates 15% VAT and 2% withholding on 100,000 ETB invoice', () => {
      const res = calculateTaxAndWithholding(100000);
      assert.equal(res.subtotal, 100000);
      assert.equal(res.vatAmount, 15000);
      assert.equal(res.withholdingAmount, 2000);
      assert.equal(res.grossTotal, 115000);
      assert.equal(res.netPayable, 113000);
    });

    it('returns zero values for zero or negative amount', () => {
      const res = calculateTaxAndWithholding(0);
      assert.equal(res.subtotal, 0);
      assert.equal(res.grossTotal, 0);
      assert.equal(res.netPayable, 0);
    });

    it('handles custom VAT and withholding rates', () => {
      const res = calculateTaxAndWithholding(50000, 0.10, 0.05);
      assert.equal(res.vatAmount, 5000);
      assert.equal(res.withholdingAmount, 2500);
      assert.equal(res.grossTotal, 55000);
      assert.equal(res.netPayable, 52500);
    });
  });

  describe('calculateBudgetVariance', () => {
    it('calculates positive variance when spending under budget', () => {
      const res = calculateBudgetVariance(200000, 150000);
      assert.equal(res.variance, 50000);
      assert.equal(res.percentage, 25);
      assert.equal(res.isOverBudget, false);
    });

    it('calculates negative variance when spending exceeds budget', () => {
      const res = calculateBudgetVariance(100000, 120000);
      assert.equal(res.variance, -20000);
      assert.equal(res.percentage, -20);
      assert.equal(res.isOverBudget, true);
    });

    it('handles zero budgeted amount safely without division by zero', () => {
      const res = calculateBudgetVariance(0, 5000);
      assert.equal(res.percentage, 0);
      assert.equal(res.isOverBudget, true);
    });
  });

  describe('calculateProfitMargin', () => {
    it('calculates 30% margin on 100,000 rev and 70,000 expenses', () => {
      const res = calculateProfitMargin(100000, 70000);
      assert.equal(res.netProfit, 30000);
      assert.equal(res.marginPercentage, 30);
      assert.equal(res.isProfitable, true);
    });

    it('identifies loss when expenses exceed revenue', () => {
      const res = calculateProfitMargin(50000, 60000);
      assert.equal(res.netProfit, -10000);
      assert.equal(res.marginPercentage, -20);
      assert.equal(res.isProfitable, false);
    });

    it('handles zero revenue safely', () => {
      const res = calculateProfitMargin(0, 5000);
      assert.equal(res.marginPercentage, 0);
      assert.equal(res.isProfitable, false);
    });
  });

  describe('categorizeExpense', () => {
    it('identifies operational expenses', () => {
      const res = categorizeExpense(25000, 'equipment');
      assert.equal(res.category, 'equipment');
      assert.equal(res.isOperational, true);
    });

    it('falls back to miscellaneous for unknown category', () => {
      const res = categorizeExpense(5000, 'random_category_123');
      assert.equal(res.category, 'miscellaneous');
      assert.equal(res.isOperational, false);
    });
  });

  describe('computeCashflowBreakdown', () => {
    it('aggregates multi-item incomes and expenses', () => {
      const incomes = [{ amount: 50000 }, { amount: 30000 }];
      const expenses = [{ amount: 20000 }, { amount: 15000 }];
      const res = computeCashflowBreakdown(incomes, expenses);
      assert.equal(res.totalIncome, 80000);
      assert.equal(res.totalExpense, 35000);
      assert.equal(res.netCashflow, 45000);
      assert.equal(res.healthy, true);
    });

    it('identifies unhealthy negative cashflow', () => {
      const incomes = [{ amount: 10000 }];
      const expenses = [{ amount: 25000 }];
      const res = computeCashflowBreakdown(incomes, expenses);
      assert.equal(res.netCashflow, -15000);
      assert.equal(res.healthy, false);
    });
  });

  describe('calculateAgingBucket', () => {
    const asOf = new Date('2026-10-15');

    it('marks future or same day due date as current', () => {
      assert.equal(calculateAgingBucket('2026-10-20', asOf), 'current');
      assert.equal(calculateAgingBucket('2026-10-15', asOf), 'current');
    });

    it('categorizes 1-30 days overdue', () => {
      assert.equal(calculateAgingBucket('2026-10-01', asOf), '1-30_days');
    });

    it('categorizes 31-60 days overdue', () => {
      assert.equal(calculateAgingBucket('2026-09-01', asOf), '31-60_days');
    });

    it('categorizes 90+ days overdue', () => {
      assert.equal(calculateAgingBucket('2026-06-01', asOf), '90+_days');
    });
  });

  describe('formatETBCurrency', () => {
    it('formats number into localized ETB currency string', () => {
      assert.equal(formatETBCurrency(12500), 'ETB 12,500.00');
    });

    it('handles invalid number gracefully', () => {
      assert.equal(formatETBCurrency('abc'), 'ETB 0.00');
    });
  });

  describe('calculateBulkDiscount', () => {
    it('applies 20% discount for orders of 50+ units', () => {
      const res = calculateBulkDiscount(1000, 50);
      assert.equal(res.discountRate, 0.20);
      assert.equal(res.totalBeforeDiscount, 50000);
      assert.equal(res.discountAmount, 10000);
      assert.equal(res.finalAmount, 40000);
    });

    it('applies 0% discount for orders under 5 units', () => {
      const res = calculateBulkDiscount(1000, 3);
      assert.equal(res.discountRate, 0);
      assert.equal(res.discountAmount, 0);
      assert.equal(res.finalAmount, 3000);
    });
  });
});
