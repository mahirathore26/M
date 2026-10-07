import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pool from "../db/pool.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SQL_DIR = path.resolve(__dirname, "../../db/queries");

const SQL_GET_QUOTE_INPUTS = path.join(SQL_DIR, "003_get_quote_inputs.sql");
const SQL_CREATE_QUOTE = path.join(SQL_DIR, "004_create_quote.sql");
const SQL_GET_QUOTE_BY_ID = path.join(SQL_DIR, "005_get_quote_by_id.sql");
const SQL_LIST_QUOTES_FOR_LOAD = path.join(SQL_DIR, "006_list_quotes_for_load.sql");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Throws if `value` is not a positive integer.
 * @param {*} value
 * @param {string} name - parameter name for the error message
 */
function requirePositiveInt(value, name) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
}

// ---------------------------------------------------------------------------
// Repository functions
// ---------------------------------------------------------------------------

/**
 * Retrieves all normalized inputs the pricing engine needs to calculate a
 * quote for a specific (load, truck, rate card) triple.
 *
 * Returns zero rows when the combination is incoherent (e.g. truck and rate
 * card belong to different carriers).
 *
 * @param {number} loadId      - Positive integer load identifier
 * @param {number} truckId     - Positive integer truck identifier
 * @param {number} rateCardId  - Positive integer rate-card identifier
 * @returns {Promise<Array>} Pricing-input rows (at most one for a valid triple)
 */
export async function getQuoteInputs(loadId, truckId, rateCardId) {
  requirePositiveInt(loadId, "loadId");
  requirePositiveInt(truckId, "truckId");
  requirePositiveInt(rateCardId, "rateCardId");

  const sql = await fs.readFile(SQL_GET_QUOTE_INPUTS, "utf8");
  const result = await pool.query(sql, [loadId, truckId, rateCardId]);

  return result.rows;
}

/**
 * Persists a fully pre-calculated quote produced by the pricing service.
 *
 * This function performs NO pricing calculations; it is a pure persistence
 * layer.  All monetary values and the calculation snapshot must be supplied
 * by the caller.
 *
 * @param {Object}  params
 * @param {number}  params.loadId               - Positive integer load identifier
 * @param {number}  params.carrierId            - Positive integer carrier identifier
 * @param {number}  params.truckId              - Positive integer truck identifier
 * @param {number}  params.rateCardId           - Positive integer rate-card identifier
 * @param {string|number} params.baseRate       - Base rate from rate card (NUMERIC)
 * @param {string|number} params.fuelSurcharge  - Fuel surcharge calculated by pricing service (NUMERIC)
 * @param {string|number} params.accessorialCharges - Accessorial charges calculated by pricing service (NUMERIC)
 * @param {string|number} params.totalAmount    - Total amount calculated by pricing service (NUMERIC)
 * @param {string|Date}   params.validUntil     - Quote expiry timestamp (TIMESTAMPTZ)
 * @param {Object}  params.calculationSnapshot  - Immutable JSONB audit snapshot from pricing service
 * @returns {Promise<Object>} The inserted quote row (via RETURNING)
 */
export async function createQuote({
  loadId,
  carrierId,
  truckId,
  rateCardId,
  baseRate,
  fuelSurcharge,
  accessorialCharges,
  totalAmount,
  validUntil,
  calculationSnapshot,
}) {
  requirePositiveInt(loadId, "loadId");
  requirePositiveInt(carrierId, "carrierId");
  requirePositiveInt(truckId, "truckId");
  requirePositiveInt(rateCardId, "rateCardId");

  const sql = await fs.readFile(SQL_CREATE_QUOTE, "utf8");
  const result = await pool.query(sql, [
    loadId,
    carrierId,
    truckId,
    rateCardId,
    baseRate,
    fuelSurcharge,
    accessorialCharges,
    totalAmount,
    validUntil,
    calculationSnapshot,
  ]);

  return result.rows[0];
}

/**
 * Retrieves a single fully-joined quote by its ID.
 *
 * Returns zero rows when the quote_id does not exist, exactly one row when
 * it does.
 *
 * @param {number} quoteId - Positive integer quote identifier
 * @returns {Promise<Array>} Quote rows (zero or one)
 */
export async function getQuoteById(quoteId) {
  requirePositiveInt(quoteId, "quoteId");

  const sql = await fs.readFile(SQL_GET_QUOTE_BY_ID, "utf8");
  const result = await pool.query(sql, [quoteId]);

  return result.rows;
}

/**
 * Lists all currently usable quotes (ACTIVE or ACCEPTED) for a given load,
 * ordered by total_amount ASC then quote_id ASC.
 *
 * @param {number} loadId - Positive integer load identifier
 * @returns {Promise<Array>} Quote rows ordered cheapest-first
 */
export async function listQuotesForLoad(loadId) {
  requirePositiveInt(loadId, "loadId");

  const sql = await fs.readFile(SQL_LIST_QUOTES_FOR_LOAD, "utf8");
  const result = await pool.query(sql, [loadId]);

  return result.rows;
}
