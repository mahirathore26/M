import { findEligibleTrucks as defaultFindEligibleTrucks } from '../repositories/loadRepository.js';
import { getQuoteInputs as defaultGetQuoteInputs, createQuote as defaultCreateQuote } from '../repositories/quoteRepository.js';
import { calculateQuote as defaultCalculateQuote, DEFAULT_FUEL_SURCHARGE_RATE } from './pricingService.js';

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
    throw new Error('loadId must be a positive integer');
  }
  if (validUntil == null) {
    throw new Error('validUntil is required');
  }

  const findEligibleTrucks = deps.findEligibleTrucks ?? defaultFindEligibleTrucks;
  const getQuoteInputs = deps.getQuoteInputs ?? defaultGetQuoteInputs;
  const createQuote = deps.createQuote ?? defaultCreateQuote;
  const calculateQuote = deps.calculateQuote ?? defaultCalculateQuote;

  const eligibleTrucks = await findEligibleTrucks(loadId);

  if (eligibleTrucks.length === 0) {
    return [];
  }

  const quotes = [];

  for (const truck of eligibleTrucks) {
    const [inputs] = await getQuoteInputs(
      loadId,
      truck.truck_id,
      truck.applicable_rate_card_id,
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
      carrierId: truck.carrier_id,
      truckId: truck.truck_id,
      rateCardId: truck.applicable_rate_card_id,
      baseRate: pricing.baseRate,
      fuelSurcharge: pricing.fuelSurcharge,
      accessorialCharges: pricing.accessorialCharges,
      totalAmount: pricing.totalAmount,
      validUntil,
      calculationSnapshot,
    });

    quotes.push(quote);
  }

  return quotes;
}
