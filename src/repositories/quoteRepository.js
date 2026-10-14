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

function requirePositiveInt(value, name) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
}

export async function getQuoteInputs(loadId, truckId, rateCardId, db = pool) {
  requirePositiveInt(loadId, "loadId");
  requirePositiveInt(truckId, "truckId");
  requirePositiveInt(rateCardId, "rateCardId");

  const sql = await fs.readFile(SQL_GET_QUOTE_INPUTS, "utf8");
  const result = await db.query(sql, [loadId, truckId, rateCardId]);

  return result.rows;
}

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
}, db = pool) {
  requirePositiveInt(loadId, "loadId");
  requirePositiveInt(carrierId, "carrierId");
  requirePositiveInt(truckId, "truckId");
  requirePositiveInt(rateCardId, "rateCardId");

  const sql = await fs.readFile(SQL_CREATE_QUOTE, "utf8");
  const result = await db.query(sql, [
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

  const row = result.rows[0];
  if (!row) return null;
  return {
    ...row,
    quote_id: Number(row.quote_id),
    load_id: Number(row.load_id),
    carrier_id: Number(row.carrier_id),
    truck_id: Number(row.truck_id),
    rate_card_id: Number(row.rate_card_id),
  };
}

export async function getQuoteById(quoteId, db = pool) {
  requirePositiveInt(quoteId, "quoteId");

  const sql = await fs.readFile(SQL_GET_QUOTE_BY_ID, "utf8");
  const result = await db.query(sql, [quoteId]);
  const row = result.rows[0];
  if (!row) return null;

  return {
    ...row,
    quote_id: Number(row.quote_id),
    load_id: Number(row.load_id),
    carrier_id: Number(row.carrier_id),
    truck_id: Number(row.truck_id),
    rate_card_id: Number(row.rate_card_id),
    ...(row.lane_id ? { lane_id: Number(row.lane_id) } : {}),
  };
}

export async function listQuotesForLoad(loadId, db = pool) {
  requirePositiveInt(loadId, "loadId");

  const sql = await fs.readFile(SQL_LIST_QUOTES_FOR_LOAD, "utf8");
  const result = await db.query(sql, [loadId]);

  return result.rows.map((row) => ({
    ...row,
    quote_id: Number(row.quote_id),
    load_id: Number(row.load_id),
    carrier_id: Number(row.carrier_id),
    truck_id: Number(row.truck_id),
    rate_card_id: Number(row.rate_card_id),
  }));
}

