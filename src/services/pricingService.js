// Calculations use integer paise internally to avoid floating-point errors.

/**
 * @param {number} rupees
 * @returns {number} paise (integer)
 */
function toPaise(rupees) {
  return Math.round(rupees * 100);
}

/**
 * @param {number} paise
 * @returns {string} rupees formatted to two decimals
 */
function toRupees(paise) {
  return (paise / 100).toFixed(2);
}

function assertFiniteNonNegative(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  if (value < 0) {
    throw new Error(`${label} must not be negative`);
  }
}

export const DEFAULT_FUEL_SURCHARGE_RATE = 0.10;

/**
 * @param {object} params
 * @param {number} params.baseRate
 * @param {number} [params.fuelSurchargeRate=0.10]
 * @param {Array<{type: string, amount: number}>} [params.accessorialCharges=[]]
 * @returns {{ baseRate: string, fuelSurcharge: string, accessorialCharges: string, totalAmount: string }}
 */
export function calculateQuote({
  baseRate,
  fuelSurchargeRate = DEFAULT_FUEL_SURCHARGE_RATE,
  accessorialCharges = [],
}) {
  assertFiniteNonNegative(baseRate, 'baseRate');
  assertFiniteNonNegative(fuelSurchargeRate, 'fuelSurchargeRate');

  if (!Array.isArray(accessorialCharges)) {
    throw new Error('accessorialCharges must be an array');
  }

  for (const item of accessorialCharges) {
    if (
      item === null ||
      item === undefined ||
      typeof item !== 'object' ||
      Array.isArray(item)
    ) {
      throw new Error('Each accessorial must be an object with type and amount');
    }
    if (typeof item.type !== 'string' || item.type.trim() === '') {
      throw new Error('Each accessorial must have a non-empty string type');
    }
    assertFiniteNonNegative(item.amount, 'accessorial amount');
  }

  const baseRatePaise = toPaise(baseRate);
  const fuelSurchargePaise = Math.round(baseRatePaise * fuelSurchargeRate);

  let accessorialTotalPaise = 0;
  for (const item of accessorialCharges) {
    accessorialTotalPaise += toPaise(item.amount);
  }

  const totalPaise = baseRatePaise + fuelSurchargePaise + accessorialTotalPaise;

  return {
    baseRate: toRupees(baseRatePaise),
    fuelSurcharge: toRupees(fuelSurchargePaise),
    accessorialCharges: toRupees(accessorialTotalPaise),
    totalAmount: toRupees(totalPaise),
  };
}
