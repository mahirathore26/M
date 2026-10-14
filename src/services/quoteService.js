import pool from '../db/pool.js';
import {
  findEligibleTrucks as defaultFindEligibleTrucks,
  getLoadById as defaultGetLoadById,
} from '../repositories/loadRepository.js';
import { getQuoteInputs as defaultGetQuoteInputs, createQuote as defaultCreateQuote } from '../repositories/quoteRepository.js';
import { calculateQuote as defaultCalculateQuote, DEFAULT_FUEL_SURCHARGE_RATE } from './pricingService.js';
import { BadRequestError, NotFoundError } from '../errors/AppError.js';

/**
 * Generates quotes for all eligible trucks on a load.
 *
 * @param {number} loadId
 * @param {string|Date} validUntil
 * @param {Object} [options]
 * @param {Array}  [options.accessorialCharges]
 * @param {Object} [deps] - injectable dependencies for testing
 */
export async function generateQuotesForLoad(
  loadId,
  validUntil,
  { accessorialCharges } = {},
  deps = {},
) {
  if (!Number.isInteger(loadId) || loadId <= 0) {
    throw new BadRequestError('loadId must be a positive integer');
  }
  if (validUntil == null) {
    throw new BadRequestError('validUntil is required');
  }

  const findEligibleTrucks = deps.findEligibleTrucks ?? defaultFindEligibleTrucks;
  const getQuoteInputs = deps.getQuoteInputs ?? defaultGetQuoteInputs;
  const createQuote = deps.createQuote ?? defaultCreateQuote;
  const calculateQuote = deps.calculateQuote ?? defaultCalculateQuote;
  const dbPool = deps.pool ?? pool;

  const eligibleTrucks = await findEligibleTrucks(loadId);

  if (eligibleTrucks.length === 0) {
    return [];
  }

  const client = await dbPool.connect();

  try {
    await client.query('BEGIN');

    const quotes = [];

    for (const truck of eligibleTrucks) {
      const truckId = Number(truck.truck_id);
      const rateCardId = Number(truck.applicable_rate_card_id);
      const carrierId = Number(truck.carrier_id);

      const [inputs] = await getQuoteInputs(
        loadId,
        truckId,
        rateCardId,
        client,
      );

      if (!inputs) {
        throw new Error(`Quote inputs missing for load ${loadId}, truck ${truck.truck_id}, rate card ${truck.applicable_rate_card_id}`);
      }

      const baseRate = Number(inputs.base_rate);
      const fuelSurchargeRate = DEFAULT_FUEL_SURCHARGE_RATE;

      const pricingInput = { baseRate, fuelSurchargeRate };
      if (accessorialCharges) {
        pricingInput.accessorialCharges = accessorialCharges;
      }

      const pricing = calculateQuote(pricingInput);

      const calculationSnapshot = {
        baseRate: pricing.baseRate,
        fuelSurchargeRate,
        fuelSurcharge: pricing.fuelSurcharge,
        accessorialCharges: pricing.accessorialCharges,
        totalAmount: pricing.totalAmount,
      };

      const quote = await createQuote({
        loadId,
        carrierId,
        truckId,
        rateCardId,
        baseRate: pricing.baseRate,
        fuelSurcharge: pricing.fuelSurcharge,
        accessorialCharges: pricing.accessorialCharges,
        totalAmount: pricing.totalAmount,
        validUntil,
        calculationSnapshot,
      }, client);

      quotes.push(quote);
    }

    await client.query('COMMIT');
    return quotes;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch { /* ignore rollback failure */ }
    throw err;
  } finally {
    client.release();
  }
}

export async function requestQuotesForLoad(loadId, deps = {}) {
  if (!Number.isInteger(loadId) || loadId <= 0) {
    throw new BadRequestError('loadId must be a positive integer.');
  }

  const getLoadById = deps.getLoadById ?? defaultGetLoadById;
  const load = await getLoadById(loadId);
  if (!load) {
    throw new NotFoundError(`Load ${loadId} not found.`);
  }

  const now = deps.now ? new Date(deps.now) : new Date();
  const validUntil = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

  return await generateQuotesForLoad(loadId, validUntil, {}, deps);
}

