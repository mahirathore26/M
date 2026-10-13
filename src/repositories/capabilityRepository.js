import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pool from "../db/pool.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SQL_DIR = path.resolve(__dirname, "../../db/queries");

const SQL_GET_CAPABILITIES_BY_IDS = path.join(SQL_DIR, "019_get_capabilities_by_ids.sql");

export async function getCapabilitiesByIds(capabilityIds, db = pool) {
  if (!Array.isArray(capabilityIds)) {
    throw new Error("capabilityIds must be an array.");
  }
  if (capabilityIds.length === 0) {
    return [];
  }
  for (const id of capabilityIds) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("Each capability ID must be a positive integer.");
    }
  }

  const sql = await fs.readFile(SQL_GET_CAPABILITIES_BY_IDS, "utf8");
  const result = await db.query(sql, [capabilityIds]);
  return result.rows;
}
