import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pool from "../db/pool.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SQL_PATH = path.resolve(
  __dirname,
  "../../db/queries/002_resolve_rate_card.sql"
);

/**
 * Resolves the applicable ACTIVE rate card for a given carrier, lane,
 * vehicle-type capability, and requested date.
 *
 * @param {number} carrierId            - Positive integer carrier identifier
 * @param {number} laneId               - Positive integer lane identifier
 * @param {number} vehicleCapabilityId  - Positive integer capability identifier (VEHICLE_TYPE)
 * @param {string} requestedDate        - Business date in exact YYYY-MM-DD format (e.g. "2026-03-15")
 * @returns {Promise<Array>} Matching rate-card rows (at most one under V1 assumptions)
 */
export async function resolveRateCard(
  carrierId,
  laneId,
  vehicleCapabilityId,
  requestedDate
) {
  // --- Input validation ---------------------------------------------------
  if (!Number.isInteger(carrierId) || carrierId <= 0) {
    throw new Error("carrierId must be a positive integer.");
  }
  if (!Number.isInteger(laneId) || laneId <= 0) {
    throw new Error("laneId must be a positive integer.");
  }
  if (!Number.isInteger(vehicleCapabilityId) || vehicleCapabilityId <= 0) {
    throw new Error("vehicleCapabilityId must be a positive integer.");
  }

  // requestedDate must be a plain string in YYYY-MM-DD format (business date).
  if (typeof requestedDate !== "string" || !/^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/.test(requestedDate)) {
    throw new Error(
      'requestedDate must be a string in YYYY-MM-DD format (e.g. "2026-03-15").'
    );
  }

  // --- Execute the SQL query from disk ------------------------------------
  const sql = await fs.readFile(SQL_PATH, "utf8");
  const result = await pool.query(sql, [
    carrierId,
    laneId,
    vehicleCapabilityId,
    requestedDate,
  ]);

  return result.rows;
}
