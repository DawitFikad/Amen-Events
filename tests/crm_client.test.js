import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeLeadScore,
  determineClientTier,
  calculateCustomerLifetimeValue,
  calculateAttendanceRate,
  isInvoiceOverdue,
  calculateLateFee
} from '../frontend/src/store/crmUtils.js';

describe('CRM & Client Lifecycle Suite', () => {
  describe('computeLeadScore', () => {
    it('scores high-value corporate lead as Hot (score >= 75)', () => {
      const lead = {
        budget: 600000,
        interactionCount: 5,
        companySize: 120,
        timeline: 'immediate event next month'
      };
      const res = computeLeadScore(lead);
      assert.equal(res.grade, 'Hot');
      assert.ok(res.score >= 75);
    });

    it('scores low engagement small lead as Cold', () => {
      const lead = {
        budget: 10000,
        interactionCount: 1,
        companySize: 2,
        timeline: 'sometime next year'
      };
      const res = computeLeadScore(lead);
      assert.equal(res.grade, 'Cold');
      assert.ok(res.score < 45);
    });

    it('caps max score at 100', () => {
      const lead = {
        budget: 1000000,
        interactionCount: 50,
        companySize: 500,
        timeline: 'urgent immediate'
      };
      const res = computeLeadScore(lead);
      assert.equal(res.score, 100);
      assert.equal(res.grade, 'Hot');
    });
  });

  describe('determineClientTier', () => {
    it('assigns Platinum VIP tier for spend over 1,000,000 ETB', () => {
      const res = determineClientTier(1250000);
      assert.equal(res.tier, 'Platinum VIP');
      assert.equal(res.discountRate, 0.15);
      assert.equal(res.prioritySupport, true);
    });

    it('assigns Gold Enterprise tier for spend over 500,000 ETB', () => {
      const res = determineClientTier(600000);
      assert.equal(res.tier, 'Gold Enterprise');
      assert.equal(res.discountRate, 0.10);
    });

    it('defaults to Standard Client for new or low spend accounts', () => {
      const res = determineClientTier(25000);
      assert.equal(res.tier, 'Standard Client');
      assert.equal(res.discountRate, 0);
      assert.equal(res.prioritySupport, false);
    });
  });

  describe('calculateCustomerLifetimeValue', () => {
    it('computes total spend and average order value across valid orders', () => {
      const orders = [
        { total: 50000, status: 'completed' },
        { total: 30000, status: 'paid' },
        { total: 20000, status: 'cancelled' } // Should be excluded
      ];
      const res = calculateCustomerLifetimeValue(orders);
      assert.equal(res.totalSpend, 80000);
      assert.equal(res.orderCount, 2);
      assert.equal(res.averageOrderValue, 40000);
    });

    it('handles empty orders array safely', () => {
      const res = calculateCustomerLifetimeValue([]);
      assert.equal(res.totalSpend, 0);
      assert.equal(res.orderCount, 0);
      assert.equal(res.averageOrderValue, 0);
    });
  });

  describe('calculateAttendanceRate', () => {
    it('computes percentage attendance and drop-off rate', () => {
      const res = calculateAttendanceRate(200, 160);
      assert.equal(res.registered, 200);
      assert.equal(res.attended, 160);
      assert.equal(res.noShowCount, 40);
      assert.equal(res.rate, 80);
      assert.equal(res.dropoffRate, 20);
    });

    it('clamps attended count if it exceeds registered', () => {
      const res = calculateAttendanceRate(100, 120);
      assert.equal(res.attended, 100);
      assert.equal(res.rate, 100);
      assert.equal(res.noShowCount, 0);
    });

    it('returns 0 when registered is 0', () => {
      const res = calculateAttendanceRate(0, 0);
      assert.equal(res.rate, 0);
    });
  });

  describe('isInvoiceOverdue', () => {
    const asOf = new Date('2026-11-01');

    it('returns true when due date has passed and status is pending', () => {
      assert.equal(isInvoiceOverdue('2026-10-15', 'pending', asOf), true);
    });

    it('returns false when invoice is already marked paid', () => {
      assert.equal(isInvoiceOverdue('2026-10-15', 'paid', asOf), false);
    });

    it('returns false when due date is in the future', () => {
      assert.equal(isInvoiceOverdue('2026-11-15', 'pending', asOf), false);
    });
  });

  describe('calculateLateFee', () => {
    it('calculates daily late penalty for delinquent days', () => {
      // 100,000 * 10 days * 0.001 (0.1% daily) = 1,000 ETB
      const res = calculateLateFee(100000, 10, 0.001);
      assert.equal(res.penaltyAmount, 1000);
      assert.equal(res.totalDue, 101000);
    });

    it('caps late fee at 15% maximum penalty cap', () => {
      // 100,000 * 200 days * 0.001 = 20,000 (exceeds 15,000 cap)
      const res = calculateLateFee(100000, 200, 0.001);
      assert.equal(res.penaltyAmount, 15000);
      assert.equal(res.totalDue, 115000);
    });

    it('returns zero penalty when days late is zero or negative', () => {
      const res = calculateLateFee(50000, 0);
      assert.equal(res.penaltyAmount, 0);
      assert.equal(res.totalDue, 50000);
    });
  });
});
