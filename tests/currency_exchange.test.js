import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { convertToETB, convertFromETB } from '../frontend/src/store/currencyExchangeUtils.js';

describe('Currency Exchange Suite', () => {
  it('converts USD to ETB', () => {
    assert.equal(convertToETB(100, 'USD', { USD: 145.0 }), 14500);
  });
  it('converts ETB to USD', () => {
    assert.equal(convertFromETB(14500, 'USD', { USD: 145.0 }), 100);
  });
});
