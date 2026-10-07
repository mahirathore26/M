import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateQuotesForLoad } from './quoteService.js';

function makeTruck(overrides = {}) {
  return {
    load_id: 1,
    truck_id: 10,
    registration_number: 'MP-09-AB-1234',
    carrier_id: 100,
    carrier_name: 'Test Carrier',
    capacity_kg: 15000,
    applicable_rate_card_id: 200,
    base_rate: '38000.00',
    ...overrides,
  };
}

function makeQuoteInputs(overrides = {}) {
  return {
    load_id: 1,
    lane_id: 5,
    pickup_date: '2026-10-15',
    delivery_date: '2026-10-17',
    weight_kg: 8000,
    origin_city: 'Indore',
    destination_city: 'Mumbai',
    distance_km: '580.00',
    truck_id: 10,
    registration_number: 'MP-09-AB-1234',
    capacity_kg: 15000,
    truck_status: 'ACTIVE',
    carrier_id: 100,
    carrier_name: 'Test Carrier',
    rate_card_id: 200,
    vehicle_capability_id: 3,
    base_rate: '38000.00',
    valid_from: '2026-10-01',
    valid_until: '2026-12-31',
    ...overrides,
  };
}

function makeDeps(overrides = {}) {
  return {
    findEligibleTrucks: async () => [],
    getQuoteInputs: async () => [makeQuoteInputs()],
    createQuote: async (params) => ({ quote_id: 1, ...params }),
    calculateQuote: ({ baseRate, fuelSurchargeRate = 0.10, accessorialCharges = [] }) => {
      const fuel = +(baseRate * fuelSurchargeRate).toFixed(2);
      const acc = accessorialCharges.reduce((s, a) => s + a.amount, 0);
      const total = +(baseRate + fuel + acc).toFixed(2);
      return {
        baseRate: baseRate.toFixed(2),
        fuelSurcharge: fuel.toFixed(2),
        accessorialCharges: acc.toFixed(2),
        totalAmount: total.toFixed(2),
      };
    },
    ...overrides,
  };
}

const VALID_UNTIL = '2026-10-20T23:59:59Z';

describe('generateQuotesForLoad', () => {
  it('rejects non-positive-integer loadId', async () => {
    await assert.rejects(
      () => generateQuotesForLoad(0, VALID_UNTIL, {}, makeDeps()),
      { message: 'loadId must be a positive integer' },
    );
    await assert.rejects(
      () => generateQuotesForLoad(-1, VALID_UNTIL, {}, makeDeps()),
      { message: 'loadId must be a positive integer' },
    );
    await assert.rejects(
      () => generateQuotesForLoad(1.5, VALID_UNTIL, {}, makeDeps()),
      { message: 'loadId must be a positive integer' },
    );
    await assert.rejects(
      () => generateQuotesForLoad('abc', VALID_UNTIL, {}, makeDeps()),
      { message: 'loadId must be a positive integer' },
    );
  });

  it('rejects missing validUntil', async () => {
    await assert.rejects(
      () => generateQuotesForLoad(1, undefined, {}, makeDeps()),
      { message: 'validUntil is required' },
    );
    await assert.rejects(
      () => generateQuotesForLoad(1, null, {}, makeDeps()),
      { message: 'validUntil is required' },
    );
  });

  it('returns empty array when no eligible trucks', async () => {
    const deps = makeDeps({ findEligibleTrucks: async () => [] });
    const result = await generateQuotesForLoad(1, VALID_UNTIL, {}, deps);
    assert.deepStrictEqual(result, []);
  });

  it('produces one quote for one eligible truck', async () => {
    const truck = makeTruck();
    const deps = makeDeps({ findEligibleTrucks: async () => [truck] });

    const result = await generateQuotesForLoad(1, VALID_UNTIL, {}, deps);
    assert.equal(result.length, 1);
  });

  it('produces multiple quotes for multiple eligible trucks', async () => {
    const trucks = [
      makeTruck({ truck_id: 10, applicable_rate_card_id: 200, base_rate: '38000.00' }),
      makeTruck({ truck_id: 20, applicable_rate_card_id: 201, base_rate: '42000.00' }),
    ];
    const deps = makeDeps({
      findEligibleTrucks: async () => trucks,
      getQuoteInputs: async (_loadId, truckId, rateCardId) => {
        const t = trucks.find((t) => t.truck_id === truckId);
        return [makeQuoteInputs({ truck_id: truckId, rate_card_id: rateCardId, base_rate: t.base_rate })];
      },
    });

    const result = await generateQuotesForLoad(1, VALID_UNTIL, {}, deps);
    assert.equal(result.length, 2);
  });

  it('passes repository values correctly into pricing', async () => {
    const truck = makeTruck({ base_rate: '41500.00' });
    let capturedPricingInput;

    const deps = makeDeps({
      findEligibleTrucks: async () => [truck],
      getQuoteInputs: async () => [makeQuoteInputs({ base_rate: '41500.00' })],
      calculateQuote: (input) => {
        capturedPricingInput = input;
        return {
          baseRate: '41500.00',
          fuelSurcharge: '4150.00',
          accessorialCharges: '0.00',
          totalAmount: '45650.00',
        };
      },
    });

    await generateQuotesForLoad(1, VALID_UNTIL, {}, deps);

    assert.equal(capturedPricingInput.baseRate, 41500);
    assert.equal(capturedPricingInput.fuelSurchargeRate, 0.10);
  });

  it('passes calculated amounts correctly into createQuote', async () => {
    const truck = makeTruck();
    let capturedCreateArgs;

    const deps = makeDeps({
      findEligibleTrucks: async () => [truck],
      calculateQuote: () => ({
        baseRate: '38000.00',
        fuelSurcharge: '3800.00',
        accessorialCharges: '0.00',
        totalAmount: '41800.00',
      }),
      createQuote: async (params) => {
        capturedCreateArgs = params;
        return { quote_id: 99, ...params };
      },
    });

    await generateQuotesForLoad(1, VALID_UNTIL, {}, deps);

    assert.equal(capturedCreateArgs.loadId, 1);
    assert.equal(capturedCreateArgs.carrierId, truck.carrier_id);
    assert.equal(capturedCreateArgs.truckId, truck.truck_id);
    assert.equal(capturedCreateArgs.rateCardId, truck.applicable_rate_card_id);
    assert.equal(capturedCreateArgs.baseRate, '38000.00');
    assert.equal(capturedCreateArgs.fuelSurcharge, '3800.00');
    assert.equal(capturedCreateArgs.accessorialCharges, '0.00');
    assert.equal(capturedCreateArgs.totalAmount, '41800.00');
    assert.equal(capturedCreateArgs.validUntil, VALID_UNTIL);
  });

  it('calculationSnapshot contains expected pricing information', async () => {
    const truck = makeTruck();
    let capturedSnapshot;

    const deps = makeDeps({
      findEligibleTrucks: async () => [truck],
      calculateQuote: () => ({
        baseRate: '38000.00',
        fuelSurcharge: '3800.00',
        accessorialCharges: '0.00',
        totalAmount: '41800.00',
      }),
      createQuote: async (params) => {
        capturedSnapshot = params.calculationSnapshot;
        return { quote_id: 1, ...params };
      },
    });

    await generateQuotesForLoad(1, VALID_UNTIL, {}, deps);

    assert.equal(capturedSnapshot.baseRate, '38000.00');
    assert.equal(capturedSnapshot.fuelSurchargeRate, 0.10);
    assert.equal(capturedSnapshot.fuelSurcharge, '3800.00');
    assert.equal(capturedSnapshot.accessorialCharges, '0.00');
    assert.equal(capturedSnapshot.totalAmount, '41800.00');
  });
});
