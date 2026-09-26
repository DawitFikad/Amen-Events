import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  WORKFLOW_STATUSES,
  canTransition,
  executeTransition,
  isWorkflowTerminal,
  requiresManagerApproval,
  calculateApprovalProgress
} from '../frontend/src/store/workflowStateMachine.js';

describe('Workflow & Approval State Machine Suite', () => {
  describe('canTransition', () => {
    it('allows staff to submit a draft item', () => {
      assert.equal(canTransition(WORKFLOW_STATUSES.DRAFT, WORKFLOW_STATUSES.SUBMITTED, 'staff'), true);
    });

    it('denies staff from directly approving submitted items', () => {
      assert.equal(canTransition(WORKFLOW_STATUSES.SUBMITTED, WORKFLOW_STATUSES.APPROVED, 'staff'), false);
    });

    it('allows manager to move submitted item to under_review', () => {
      assert.equal(canTransition(WORKFLOW_STATUSES.SUBMITTED, WORKFLOW_STATUSES.UNDER_REVIEW, 'manager'), true);
    });

    it('allows admin to approve under_review item', () => {
      assert.equal(canTransition(WORKFLOW_STATUSES.UNDER_REVIEW, WORKFLOW_STATUSES.APPROVED, 'admin'), true);
    });

    it('disallows jumping directly from draft to approved', () => {
      assert.equal(canTransition(WORKFLOW_STATUSES.DRAFT, WORKFLOW_STATUSES.APPROVED, 'admin'), false);
    });
  });

  describe('executeTransition', () => {
    it('executes valid submission and records audit history', () => {
      const item = { id: 'evt-1', status: WORKFLOW_STATUSES.DRAFT, history: [] };
      const user = { name: 'Abebe Bikila', role: 'coordinator' };
      const res = executeTransition(item, WORKFLOW_STATUSES.SUBMITTED, user, 'Ready for review');

      assert.equal(res.success, true);
      assert.equal(res.item.status, WORKFLOW_STATUSES.SUBMITTED);
      assert.equal(res.item.history.length, 1);
      assert.equal(res.item.history[0].from, WORKFLOW_STATUSES.DRAFT);
      assert.equal(res.item.history[0].to, WORKFLOW_STATUSES.SUBMITTED);
      assert.equal(res.item.history[0].by, 'Abebe Bikila');
    });

    it('blocks rejection without explanatory feedback notes', () => {
      const item = { id: 'evt-2', status: WORKFLOW_STATUSES.UNDER_REVIEW, history: [] };
      const user = { name: 'Manager Dave', role: 'manager' };
      const res = executeTransition(item, WORKFLOW_STATUSES.REJECTED, user, '');

      assert.equal(res.success, false);
      assert.match(res.error, /detailed feedback notes/);
    });

    it('permits rejection with valid explanatory notes', () => {
      const item = { id: 'evt-2', status: WORKFLOW_STATUSES.UNDER_REVIEW, history: [] };
      const user = { name: 'Manager Dave', role: 'manager' };
      const res = executeTransition(item, WORKFLOW_STATUSES.REJECTED, user, 'Budget exceeds allowable threshold');

      assert.equal(res.success, true);
      assert.equal(res.item.status, WORKFLOW_STATUSES.REJECTED);
    });
  });

  describe('isWorkflowTerminal', () => {
    it('identifies cancelled as terminal state', () => {
      assert.equal(isWorkflowTerminal(WORKFLOW_STATUSES.CANCELLED), true);
    });

    it('identifies draft and under_review as non-terminal', () => {
      assert.equal(isWorkflowTerminal(WORKFLOW_STATUSES.DRAFT), false);
      assert.equal(isWorkflowTerminal(WORKFLOW_STATUSES.UNDER_REVIEW), false);
    });
  });

  describe('requiresManagerApproval', () => {
    it('triggers requirement for budgets equal or over 100,000 ETB', () => {
      assert.equal(requiresManagerApproval(150000), true);
      assert.equal(requiresManagerApproval(100000), true);
    });

    it('waives manager requirement for small budgets below 100,000 ETB', () => {
      assert.equal(requiresManagerApproval(50000), false);
    });
  });

  describe('calculateApprovalProgress', () => {
    it('computes percentage of completed approval stages', () => {
      const stages = [
        { name: 'Finance Review', status: 'approved' },
        { name: 'Logistics Sign-off', status: 'approved' },
        { name: 'Executive Approval', status: 'pending' },
        { name: 'Legal Verification', status: 'pending' }
      ];
      assert.equal(calculateApprovalProgress(stages), 50);
    });

    it('returns 0 for empty or invalid stages', () => {
      assert.equal(calculateApprovalProgress([]), 0);
    });
  });
});
