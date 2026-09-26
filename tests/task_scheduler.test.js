import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sortTasksByUrgency, isTaskOverdue } from '../frontend/src/store/taskSchedulerUtils.js';

describe('Task Scheduler Suite', () => {
  it('sorts tasks by critical priority first', () => {
    const tasks = [
      { id: 1, priority: 'low' },
      { id: 2, priority: 'critical' },
      { id: 3, priority: 'high' }
    ];
    const sorted = sortTasksByUrgency(tasks);
    assert.equal(sorted[0].id, 2);
    assert.equal(sorted[1].id, 3);
  });
  it('detects overdue task', () => {
    assert.equal(isTaskOverdue('2020-01-01', 'pending'), true);
    assert.equal(isTaskOverdue('2020-01-01', 'completed'), false);
  });
});
