import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { allocateVolunteerResources } from '../frontend/src/store/volunteerShiftUtils.js';

describe('Volunteer Management Suite', () => {
  it('allocates meal tokens matching volunteer count', () => {
    const res = allocateVolunteerResources(25, 4);
    assert.equal(res.mealTokens, 25);
    assert.equal(res.totalVolunteerHours, 100);
  });
});