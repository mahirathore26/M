import "dotenv/config";
import pool from "../db/pool.js";
import { findEligibleTrucks } from "./loadRepository.js";

async function checkLoadRepository() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const openTrucks = await findEligibleTrucks(1, client);
    if (!Array.isArray(openTrucks) || openTrucks.length === 0) {
      throw new Error(`Expected OPEN load to return trucks, got ${openTrucks?.length}`);
    }

    await client.query("UPDATE loads SET status = 'QUOTED' WHERE load_id = 1");
    const quotedTrucks = await findEligibleTrucks(1, client);
    if (!Array.isArray(quotedTrucks) || quotedTrucks.length === 0) {
      throw new Error(`Expected QUOTED load to return trucks, got ${quotedTrucks?.length}`);
    }

    const draftTrucks = await findEligibleTrucks(2, client);
    if (!Array.isArray(draftTrucks) || draftTrucks.length !== 0) {
      throw new Error(`Expected DRAFT load to return 0 trucks, got ${draftTrucks.length}`);
    }

    await client.query("UPDATE loads SET status = 'BOOKED' WHERE load_id = 1");
    const bookedTrucks = await findEligibleTrucks(1, client);
    if (!Array.isArray(bookedTrucks) || bookedTrucks.length !== 0) {
      throw new Error(`Expected BOOKED load to return 0 trucks, got ${bookedTrucks.length}`);
    }

    await client.query("UPDATE loads SET status = 'CANCELLED' WHERE load_id = 1");
    const cancelledTrucks = await findEligibleTrucks(1, client);
    if (!Array.isArray(cancelledTrucks) || cancelledTrucks.length !== 0) {
      throw new Error(`Expected CANCELLED load to return 0 trucks, got ${cancelledTrucks.length}`);
    }

    console.log("✔ Load repository status check passed cleanly.");
  } catch (error) {
    console.error("✖ Check load repository failed:", error.message);
    process.exitCode = 1;
  } finally {
    await client.query("ROLLBACK");
    client.release();
    await pool.end();
  }
}

checkLoadRepository();
