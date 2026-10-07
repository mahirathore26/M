import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateQuote } from './pricingService.js';

describe('calculateQuote', () => {
  it('1. base rate only', () => {
    const result = calculateQuote({ baseRate: 10000 });
    assert.equal(result.baseRate, '10000.00');
    assert.equal(result.fuelSurcharge, '1000.00');
    assert.equal(result.accessorialCharges, '0.00');
    assert.equal(result.totalAmount, '11000.00');
  });

  it('2. base + 10% fuel surcharge', () => {
    const result = calculateQuote({ baseRate: 25000, fuelSurchargeRate: 0.10 });
    assert.equal(result.fuelSurcharge, '2500.00');
    assert.equal(result.totalAmount, '27500.00');
  });

  it('3. base + fuel + multiple accessorials', () => {
    const result = calculateQuote({
      baseRate: 41500,
      fuelSurchargeRate: 0.10,
      accessorialCharges: [
        { type: 'LOADING', amount: 1000 },
        { type: 'UNLOADING', amount: 1000 },
      ],
    });
    assert.equal(result.baseRate, '41500.00');
    assert.equal(result.fuelSurcharge, '4150.00');
    assert.equal(result.accessorialCharges, '2000.00');
    assert.equal(result.totalAmount, '47650.00');
  });

  it('4. zero accessorials (empty array)', () => {
    const result = calculateQuote({ baseRate: 5000, accessorialCharges: [] });
    assert.equal(result.accessorialCharges, '0.00');
    assert.equal(result.totalAmount, '5500.00');
  });

  it('5. zero fuel surcharge', () => {
    const result = calculateQuote({ baseRate: 8000, fuelSurchargeRate: 0 });
    assert.equal(result.fuelSurcharge, '0.00');
    assert.equal(result.totalAmount, '8000.00');
  });

  it('6. negative base rate rejected', () => {
    assert.throws(
      () => calculateQuote({ baseRate: -100 }),
      { message: 'baseRate must not be negative' },
    );
  });

  it('7. negative accessorial rejected', () => {
    assert.throws(
      () => calculateQuote({
        baseRate: 1000,
        accessorialCharges: [{ type: 'LOADING', amount: -50 }],
      }),
      { message: 'accessorial amount must not be negative' },
    );
  });

  it('8. negative surcharge rate rejected', () => {
    assert.throws(
      () => calculateQuote({ baseRate: 1000, fuelSurchargeRate: -0.05 }),
      { message: 'fuelSurchargeRate must not be negative' },
    );
  });

  it('9. invalid monetary input rejected', () => {
    assert.throws(
      () => calculateQuote({ baseRate: NaN }),
      { message: 'baseRate must be a finite number' },
    );
    assert.throws(
      () => calculateQuote({ baseRate: Infinity }),
      { message: 'baseRate must be a finite number' },
    );
    assert.throws(
      () => calculateQuote({ baseRate: '1000' }),
      { message: 'baseRate must be a finite number' },
    );
  });

  it('10. repeated calculation gives the same result', () => {
    const input = {
      baseRate: 33333.33,
      fuelSurchargeRate: 0.15,
      accessorialCharges: [{ type: 'TOLL', amount: 750.50 }],
    };
    const first = calculateQuote(input);
    const second = calculateQuote(input);
    assert.deepStrictEqual(first, second);
  });

  it('11. floating-point case demonstrating why integer paise matters', () => {
    // 0.1 + 0.2 !== 0.3 in IEEE-754, but paise arithmetic handles it correctly.
    const result = calculateQuote({
      baseRate: 0.1,
      fuelSurchargeRate: 0,
      accessorialCharges: [{ type: 'FEE', amount: 0.2 }],
    });
    assert.equal(result.totalAmount, '0.30');
  });

  it('rejects malformed accessorial objects', () => {
    assert.throws(
      () => calculateQuote({
        baseRate: 1000,
        accessorialCharges: [null],
      }),
      /Each accessorial must be an object/,
    );
    assert.throws(
      () => calculateQuote({
        baseRate: 1000,
        accessorialCharges: [{ amount: 100 }],
      }),
      /Each accessorial must have a non-empty string type/,
    );
    assert.throws(
      () => calculateQuote({
        baseRate: 1000,
        accessorialCharges: [{ type: '', amount: 100 }],
      }),
      /Each accessorial must have a non-empty string type/,
    );
  });
});
