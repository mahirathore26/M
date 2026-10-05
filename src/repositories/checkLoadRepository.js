import "dotenv/config";
import pool from "../db/pool.js";
import { findEligibleTrucks } from "./loadRepository.js";

async function checkLoadRepository() {
  try {
    const rows = await findEligibleTrucks(1);
    console.log("Eligible trucks found for load_id = 1:");
    console.log(JSON.stringify(rows, null, 2));
  } catch (error) {
    console.error("✖  Check load repository failed");
    console.error(`   ${error.message}`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

checkLoadRepository();
