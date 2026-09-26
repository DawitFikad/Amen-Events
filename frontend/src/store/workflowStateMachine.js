/**
 * Workflow and Approval State Machine Engine for Amen Events ERP
 * Regulates status transitions, role authorizations, audit history, and budget thresholds.
 */

export const WORKFLOW_STATUSES = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
};

const ALLOWED_TRANSITIONS = {
  [WORKFLOW_STATUSES.DRAFT]: [WORKFLOW_STATUSES.SUBMITTED, WORKFLOW_STATUSES.CANCELLED],
  [WORKFLOW_STATUSES.SUBMITTED]: [WORKFLOW_STATUSES.UNDER_REVIEW, WORKFLOW_STATUSES.REJECTED, WORKFLOW_STATUSES.CANCELLED],
  [WORKFLOW_STATUSES.UNDER_REVIEW]: [WORKFLOW_STATUSES.APPROVED, WORKFLOW_STATUSES.REJECTED, WORKFLOW_STATUSES.CANCELLED],
  [WORKFLOW_STATUSES.APPROVED]: [WORKFLOW_STATUSES.CANCELLED],
  [WORKFLOW_STATUSES.REJECTED]: [WORKFLOW_STATUSES.DRAFT], // Allows resubmission after corrections
  [WORKFLOW_STATUSES.CANCELLED]: [] // Terminal
};

const ROLE_PERMISSIONS = {
  [WORKFLOW_STATUSES.SUBMITTED]: ['admin', 'manager', 'coordinator', 'staff'],
  [WORKFLOW_STATUSES.UNDER_REVIEW]: ['admin', 'manager'],
  [WORKFLOW_STATUSES.APPROVED]: ['admin', 'manager'],
  [WORKFLOW_STATUSES.REJECTED]: ['admin', 'manager'],
  [WORKFLOW_STATUSES.CANCELLED]: ['admin', 'manager', 'coordinator'],
  [WORKFLOW_STATUSES.DRAFT]: ['admin', 'manager', 'coordinator', 'staff']
};

export function canTransition(currentStatus, targetStatus, userRole = 'staff') {
  if (!currentStatus || !targetStatus) return false;
  const curr = currentStatus.toLowerCase();
  const target = targetStatus.toLowerCase();
  const role = userRole.toLowerCase();

  const allowedTargets = ALLOWED_TRANSITIONS[curr] || [];
  if (!allowedTargets.includes(target)) return false;

  const allowedRoles = ROLE_PERMISSIONS[target] || [];
  return allowedRoles.includes(role);
}

export function executeTransition(item, targetStatus, user, notes = '') {
  if (!item) return { success: false, error: 'Workflow item is required' };
  const currentStatus = item.status || WORKFLOW_STATUSES.DRAFT;
  const userRole = user?.role || 'staff';

  if (!canTransition(currentStatus, targetStatus, userRole)) {
    return {
      success: false,
      error: `Unauthorized or invalid transition from '${currentStatus}' to '${targetStatus}' for role '${userRole}'`
    };
  }

  if (targetStatus === WORKFLOW_STATUSES.REJECTED && (!notes || notes.trim().length < 5)) {
    return {
      success: false,
      error: 'Rejection requires detailed feedback notes (min 5 chars)'
    };
  }

  const timestamp = new Date().toISOString();
  const historyEntry = {
    from: currentStatus,
    to: targetStatus,
    by: user?.name || user?.email || 'System',
    role: userRole,
    notes: notes.trim(),
    timestamp
  };

  const updatedItem = {
    ...item,
    status: targetStatus,
    updatedAt: timestamp,
    history: [...(item.history || []), historyEntry]
  };

  return { success: true, item: updatedItem };
}

export function isWorkflowTerminal(status) {
  if (!status) return false;
  const s = status.toLowerCase();
  return (ALLOWED_TRANSITIONS[s] || []).length === 0;
}

export function requiresManagerApproval(budgetAmount, threshold = 100000) {
  const amt = Number(budgetAmount) || 0;
  return amt >= threshold;
}

export function calculateApprovalProgress(stages = []) {
  if (!Array.isArray(stages) || stages.length === 0) return 0;
  const approvedCount = stages.filter(s => s.status === 'approved').length;
  return Math.round((approvedCount / stages.length) * 100);
}
