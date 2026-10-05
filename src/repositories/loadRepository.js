import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pool from "../db/pool.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SQL_PATH = path.resolve(__dirname, "../../db/queries/001_find_eligible_trucks.sql");

/**
 * Finds all eligible trucks for a given load and resolves their base rates.
 *
 * @param {number} loadId - Positive integer load identifier
 * @returns {Promise<Array>} Array of eligible truck objects with carrier and rate details
 */
export async function findEligibleTrucks(loadId) {
  if (!Number.isInteger(loadId) || loadId <= 0) {
    throw new Error("loadId must be a positive integer.");
  }

  const sql = await fs.readFile(SQL_PATH, "utf8");
  const result = await pool.query(sql, [loadId]);

  return result.rows;
}
