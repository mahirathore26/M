import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pool from "../db/pool.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SQL_PATH = path.resolve(__dirname, "../../db/queries/001_find_eligible_trucks.sql");

export async function findEligibleTrucks(loadId, db = pool) {
  if (!Number.isInteger(loadId) || loadId <= 0) {
    throw new Error("loadId must be a positive integer.");
  }

  const sql = await fs.readFile(SQL_PATH, "utf8");
  const result = await db.query(sql, [loadId]);

  return result.rows;
}
