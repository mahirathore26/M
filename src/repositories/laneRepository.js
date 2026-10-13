import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pool from "../db/pool.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SQL_DIR = path.resolve(__dirname, "../../db/queries");

const SQL_GET_ACTIVE_LANES = path.join(SQL_DIR, "014_get_active_lanes.sql");
const SQL_GET_LANE_BY_ID = path.join(SQL_DIR, "018_get_lane_by_id.sql");

function requirePositiveInt(value, name) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
}

export async function getActiveLanes(db = pool) {
  const sql = await fs.readFile(SQL_GET_ACTIVE_LANES, "utf8");
  const result = await db.query(sql);
  return result.rows.map((r) => ({
    ...r,
    lane_id: Number(r.lane_id),
  }));
}

export async function getLaneById(laneId, db = pool) {
  requirePositiveInt(laneId, "laneId");
  const sql = await fs.readFile(SQL_GET_LANE_BY_ID, "utf8");
  const result = await db.query(sql, [laneId]);
  const row = result.rows[0];
  if (!row) return null;
  return {
    ...row,
    lane_id: Number(row.lane_id),
  };
}
