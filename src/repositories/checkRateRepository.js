/**
 * Verification script for rateRepository.resolveRateCard.
 *
 * Run via:  npm run rate:check
 *
 * Uses the development seed fixture:
 *   carrier  = "Malwa Express Logistics Pvt Ltd"  (carrier_id looked up by name)
 *   lane     = Indore → Mumbai                    (lane_id looked up by cities)
 *   vehicle  = 32FT / VEHICLE_TYPE                (capability_id looked up by name+category)
 *   date     = 2026-10-15
 *
 * IDs are resolved from the database rather than hard-coded so that the script
 * remains correct even if identity sequences are reset or re-seeded.
 */

import pool from "../db/pool.js";
import { resolveRateCard } from "./rateRepository.js";

async function checkRateRepository() {
  try {
    // ---- Resolve fixture IDs from stable business attributes ----

    const { rows: carrierRows } = await pool.query(
      "SELECT carrier_id FROM carriers WHERE name = $1",
      ["Malwa Express Logistics Pvt Ltd"]
    );
    if (carrierRows.length === 0) {
      throw new Error("Seed carrier 'Malwa Express Logistics Pvt Ltd' not found.");
    }
    const carrierId = Number(carrierRows[0].carrier_id);

    const { rows: laneRows } = await pool.query(
      "SELECT lane_id FROM lanes WHERE origin_city = $1 AND destination_city = $2",
      ["Indore", "Mumbai"]
    );
    if (laneRows.length === 0) {
      throw new Error("Seed lane Indore → Mumbai not found.");
    }
    const laneId = Number(laneRows[0].lane_id);

    const { rows: capRows } = await pool.query(
      "SELECT capability_id FROM capabilities WHERE name = $1 AND category = $2",
      ["32FT", "VEHICLE_TYPE"]
    );
    if (capRows.length === 0) {
      throw new Error("Seed capability '32FT' (VEHICLE_TYPE) not found.");
    }
    const vehicleCapabilityId = Number(capRows[0].capability_id);

    const requestedDate = "2026-10-15";

    // ---- Call the repository function ----

    console.log("Resolving rate card with:");
    console.log(`  carrier_id            = ${carrierId}`);
    console.log(`  lane_id               = ${laneId}  (Indore → Mumbai)`);
    console.log(`  vehicle_capability_id = ${vehicleCapabilityId}  (32FT)`);
    console.log(`  requested_date        = ${requestedDate}`);
    console.log();

    const rows = await resolveRateCard(
      carrierId,
      laneId,
      vehicleCapabilityId,
      requestedDate
    );

    console.log(`Returned ${rows.length} rate card(s):`);
    console.log(JSON.stringify(rows, null, 2));

    // ---- Development assertions ----

    if (rows.length !== 1) {
      throw new Error(
        `Expected exactly 1 applicable rate card, got ${rows.length}.`
      );
    }

    const card = rows[0];

    if (card.base_rate !== "41500.00") {
      throw new Error(
        `Expected base_rate 41500.00, got ${card.base_rate}.`
      );
    }

    if (card.status !== "ACTIVE") {
      throw new Error(
        `Expected status ACTIVE, got ${card.status}.`
      );
    }

    // Verify the temporal period: 2026-10-01 → 2027-01-01
    // The pg driver parses DATE columns into JS Date at local midnight,
    // so local getters return the correct calendar date.
    const vf = new Date(card.valid_from);
    const vu = new Date(card.valid_until);
    const validFrom = `${vf.getFullYear()}-${String(vf.getMonth() + 1).padStart(2, "0")}-${String(vf.getDate()).padStart(2, "0")}`;
    const validUntil = `${vu.getFullYear()}-${String(vu.getMonth() + 1).padStart(2, "0")}-${String(vu.getDate()).padStart(2, "0")}`;

    if (validFrom !== "2026-10-01" || validUntil !== "2027-01-01") {
      throw new Error(
        `Expected validity [2026-10-01, 2027-01-01), got [${validFrom}, ${validUntil}).`
      );
    }

    console.log("\n✔  Rate card resolution verified successfully.");
  } catch (error) {
    console.error("✖  Check rate repository failed");
    console.error(`   ${error.message}`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

checkRateRepository();
