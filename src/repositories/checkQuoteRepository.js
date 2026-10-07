/**
 * Verification script for quoteRepository functions.
 *
 * Run via:  npm run quote:check
 *
 * Tests against development seed data:
 *   A. getQuoteInputs(1, 2, 2) — coherent triple  → exactly 1 row
 *   B. getQuoteInputs(1, 5, 5) — coherent triple  → exactly 1 row
 *   C. getQuoteInputs(1, 2, 5) — mismatched carrier → 0 rows
 *   D. getQuoteById — structural only (no seed quotes exist yet)
 *   E. listQuotesForLoad(1) — 0 rows (no quotes created yet)
 */

import pool from "../db/pool.js";
import {
  getQuoteInputs,
  getQuoteById,
  listQuotesForLoad,
} from "./quoteRepository.js";

async function checkQuoteRepository() {
  try {
    // ---- A. Coherent triple: load 1, truck 2, rate card 2 ----

    console.log("A. getQuoteInputs(1, 2, 2) — coherent triple");
    const rowsA = await getQuoteInputs(1, 2, 2);
    console.log(`   Returned ${rowsA.length} row(s).`);

    if (rowsA.length !== 1) {
      throw new Error(
        `A: Expected exactly 1 pricing-input row, got ${rowsA.length}.`
      );
    }

    const inputA = rowsA[0];

    // Sanity: the row should contain key pricing-input fields.
    if (!inputA.load_id || !inputA.truck_id || !inputA.rate_card_id) {
      throw new Error("A: Row is missing expected pricing-input columns.");
    }
    if (Number(inputA.load_id) !== 1) {
      throw new Error(`A: Expected load_id 1, got ${inputA.load_id}.`);
    }
    if (Number(inputA.truck_id) !== 2) {
      throw new Error(`A: Expected truck_id 2, got ${inputA.truck_id}.`);
    }
    if (Number(inputA.rate_card_id) !== 2) {
      throw new Error(`A: Expected rate_card_id 2, got ${inputA.rate_card_id}.`);
    }
    // Carrier of truck 2 and rate card 2 must agree.
    if (!inputA.carrier_id) {
      throw new Error("A: Row is missing carrier_id.");
    }

    console.log(`   carrier_id  = ${inputA.carrier_id}`);
    console.log(`   base_rate   = ${inputA.base_rate}`);
    console.log(`   distance_km = ${inputA.distance_km}`);
    console.log("   ✔  Passed\n");

    // ---- B. Coherent triple: load 1, truck 5, rate card 5 ----

    console.log("B. getQuoteInputs(1, 5, 5) — coherent triple");
    const rowsB = await getQuoteInputs(1, 5, 5);
    console.log(`   Returned ${rowsB.length} row(s).`);

    if (rowsB.length !== 1) {
      throw new Error(
        `B: Expected exactly 1 pricing-input row, got ${rowsB.length}.`
      );
    }

    const inputB = rowsB[0];
    if (Number(inputB.load_id) !== 1) {
      throw new Error(`B: Expected load_id 1, got ${inputB.load_id}.`);
    }
    if (Number(inputB.truck_id) !== 5) {
      throw new Error(`B: Expected truck_id 5, got ${inputB.truck_id}.`);
    }
    if (Number(inputB.rate_card_id) !== 5) {
      throw new Error(`B: Expected rate_card_id 5, got ${inputB.rate_card_id}.`);
    }

    console.log(`   carrier_id  = ${inputB.carrier_id}`);
    console.log(`   base_rate   = ${inputB.base_rate}`);
    console.log(`   distance_km = ${inputB.distance_km}`);
    console.log("   ✔  Passed\n");

    // ---- C. Incoherent triple: truck 2 and rate card 5 belong to different carriers ----

    console.log("C. getQuoteInputs(1, 2, 5) — mismatched carrier");
    const rowsC = await getQuoteInputs(1, 2, 5);
    console.log(`   Returned ${rowsC.length} row(s).`);

    if (rowsC.length !== 0) {
      throw new Error(
        `C: Expected 0 rows for mismatched carrier, got ${rowsC.length}.`
      );
    }

    console.log("   ✔  Passed (zero rows as expected)\n");

    // ---- D. getQuoteById — structural verification ----

    console.log("D. getQuoteById(999999) — non-existent quote");
    const rowsD = await getQuoteById(999999);
    console.log(`   Returned ${rowsD.length} row(s).`);

    if (rowsD.length !== 0) {
      throw new Error(
        `D: Expected 0 rows for non-existent quote_id, got ${rowsD.length}.`
      );
    }

    console.log("   ✔  Passed (zero rows for non-existent ID)\n");

    // ---- E. listQuotesForLoad(1) — no quotes created yet ----

    console.log("E. listQuotesForLoad(1) — no quotes yet");
    const rowsE = await listQuotesForLoad(1);
    console.log(`   Returned ${rowsE.length} row(s).`);

    if (rowsE.length !== 0) {
      throw new Error(
        `E: Expected 0 rows (no quotes created yet), got ${rowsE.length}.`
      );
    }

    console.log("   ✔  Passed (zero rows as expected)\n");

    // ---- Summary ----
    console.log("✔  All quote repository checks passed.");
  } catch (error) {
    console.error("✖  Check quote repository failed");
    console.error(`   ${error.message}`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

checkQuoteRepository();
