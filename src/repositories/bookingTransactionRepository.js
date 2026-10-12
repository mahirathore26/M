import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pool from "../db/pool.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SQL_DIR = path.resolve(__dirname, "../../db/queries");

const SQL_LOCK_BOOKING_RESOURCES = path.join(SQL_DIR, "011_lock_booking_resources.sql");
const SQL_UPDATE_QUOTE_STATUS = path.join(SQL_DIR, "012_update_quote_status.sql");
const SQL_UPDATE_LOAD_STATUS = path.join(SQL_DIR, "013_update_load_status.sql");

function requirePositiveInt(value, name) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
}

export async function lockBookingResources(loadId, truckId, db = pool) {
  requirePositiveInt(loadId, "loadId");
  requirePositiveInt(truckId, "truckId");

  const sql = await fs.readFile(SQL_LOCK_BOOKING_RESOURCES, "utf8");
  const result = await db.query(sql, [loadId, truckId]);
  return result.rows;
}

export async function updateQuoteStatus(quoteId, status = "ACCEPTED", db = pool) {
  requirePositiveInt(quoteId, "quoteId");

  const sql = await fs.readFile(SQL_UPDATE_QUOTE_STATUS, "utf8");
  const result = await db.query(sql, [quoteId, status]);
  return result.rows[0] ?? null;
}

export async function updateLoadStatus(loadId, status = "BOOKED", db = pool) {
  requirePositiveInt(loadId, "loadId");

  const sql = await fs.readFile(SQL_UPDATE_LOAD_STATUS, "utf8");
  const result = await db.query(sql, [loadId, status]);
  return result.rows[0] ?? null;
}
