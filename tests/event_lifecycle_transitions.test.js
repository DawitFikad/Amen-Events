import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isValidStageAdvance } from '../frontend/src/store/eventLifecycleTransitionUtils.js';

describe('Event Lifecycle Progression Suite', () => {
  it('allows advancing sequentially through phases', () => {
    assert.equal(isValidStageAdvance('planning', 'ready'), true);
    assert.equal(isValidStageAdvance('planning', 'completed'), false);
  });
});