import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pool from "../db/pool.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SQL_FIND_ELIGIBLE_TRUCKS = path.resolve(__dirname, "../../db/queries/001_find_eligible_trucks.sql");
const SQL_CREATE_LOAD = path.resolve(__dirname, "../../db/queries/015_create_load.sql");
const SQL_CREATE_LOAD_CAPABILITY = path.resolve(__dirname, "../../db/queries/016_create_load_capability.sql");
const SQL_GET_LOAD_BY_ID = path.resolve(__dirname, "../../db/queries/017_get_load_by_id.sql");

function requirePositiveInt(value, name) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
}

export async function findEligibleTrucks(loadId, db = pool) {
  requirePositiveInt(loadId, "loadId");

  const sql = await fs.readFile(SQL_FIND_ELIGIBLE_TRUCKS, "utf8");
  const result = await db.query(sql, [loadId]);

  return result.rows;
}

export async function getLoadById(loadId, db = pool) {
  requirePositiveInt(loadId, "loadId");

  const sql = await fs.readFile(SQL_GET_LOAD_BY_ID, "utf8");
  const result = await db.query(sql, [loadId]);
  const row = result.rows[0];
  if (!row) return null;

  return {
    ...row,
    load_id: Number(row.load_id),
    lane_id: Number(row.lane_id),
  };
}

export async function createLoad({
  laneId,
  pickupDate,
  deliveryDate = null,
  weightKg,
}, db = pool) {
  requirePositiveInt(laneId, "laneId");
  requirePositiveInt(weightKg, "weightKg");

  const sql = await fs.readFile(SQL_CREATE_LOAD, "utf8");
  const result = await db.query(sql, [
    laneId,
    pickupDate,
    deliveryDate,
    weightKg,
  ]);

  return result.rows[0];
}

export async function createLoadCapability(loadId, capabilityId, db = pool) {
  requirePositiveInt(loadId, "loadId");
  requirePositiveInt(capabilityId, "capabilityId");

  const sql = await fs.readFile(SQL_CREATE_LOAD_CAPABILITY, "utf8");
  const result = await db.query(sql, [loadId, capabilityId]);

  return result.rows[0];
}

