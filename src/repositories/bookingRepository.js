import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pool from "../db/pool.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SQL_DIR = path.resolve(__dirname, "../../db/queries");

const SQL_GET_ACTIVE_BOOKING_FOR_LOAD = path.join(SQL_DIR, "007_get_active_booking_for_load.sql");
const SQL_GET_TRUCK_BOOKING_CONFLICTS = path.join(SQL_DIR, "008_get_truck_booking_conflicts.sql");
const SQL_CREATE_BOOKING = path.join(SQL_DIR, "009_create_booking.sql");
const SQL_GET_BOOKING_BY_ID = path.join(SQL_DIR, "010_get_booking_by_id.sql");

function requirePositiveInt(value, name) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
}

function requireYYYYMMDD(value, name) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${name} must be a YYYY-MM-DD string.`);
  }
}

export async function getActiveBookingForLoad(loadId, db = pool) {
  requirePositiveInt(loadId, "loadId");
  const sql = await fs.readFile(SQL_GET_ACTIVE_BOOKING_FOR_LOAD, "utf8");
  const result = await db.query(sql, [loadId]);
  return result.rows;
}

export async function getTruckBookingConflicts(
  truckId,
  requestedPickupDate,
  requestedDeliveryDate,
  db = pool
) {
  requirePositiveInt(truckId, "truckId");
  requireYYYYMMDD(requestedPickupDate, "requestedPickupDate");
  requireYYYYMMDD(requestedDeliveryDate, "requestedDeliveryDate");

  const sql = await fs.readFile(SQL_GET_TRUCK_BOOKING_CONFLICTS, "utf8");
  const result = await db.query(sql, [
    truckId,
    requestedPickupDate,
    requestedDeliveryDate,
  ]);
  return result.rows;
}

export async function createBooking({ quoteId }, db = pool) {
  requirePositiveInt(quoteId, "quoteId");
  const sql = await fs.readFile(SQL_CREATE_BOOKING, "utf8");
  const result = await db.query(sql, [quoteId]);
  return result.rows[0];
}

export async function getBookingById(bookingId, db = pool) {
  requirePositiveInt(bookingId, "bookingId");
  const sql = await fs.readFile(SQL_GET_BOOKING_BY_ID, "utf8");
  const result = await db.query(sql, [bookingId]);
  return result.rows[0] ?? null;
}
