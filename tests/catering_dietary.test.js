import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { aggregateDietaryRequirements } from '../frontend/src/store/cateringDietaryUtils.js';

describe('Catering & Dietary Suite', () => {
  it('aggregates dietary selections with safety buffer', () => {
    const guests = [{ dietary: 'halal' }, { dietary: 'vegan' }, { dietary: 'standard' }];
    const res = aggregateDietaryRequirements(guests, 0.1);
    assert.equal(res.halal, 1);
    assert.equal(res.vegan, 1);
    assert.equal(res.standard, 1);
    assert.equal(res.totalMeals, 4);
  });
});