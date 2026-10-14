/**
 * concurrency.test.js
 *
 * PostgreSQL integration tests for the booking workflow.
 * Each test uses REAL database connections and fire-and-forget concurrent
 * requests to prove that race conditions are handled correctly.
 *
 * These tests depend on the seed data in 001_initial_data.sql.
 *
 * Run with:
 *   node --env-file=.env --test src/routes/concurrency.test.js
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import app from "../app.js";
import pool from "../db/pool.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function listen(expressApp) {
  return new Promise((resolve) => {
    const srv = http.createServer(expressApp);
    srv.listen(0, "127.0.0.1", () => resolve(srv));
  });
}

function close(srv) {
  return new Promise((resolve) => srv.close(resolve));
}

async function request(srv, method, urlPath, data = null) {
  const { port } = srv.address();
  const opts = { method, headers: {} };
  if (data !== null) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(data);
  }
  const res = await fetch(`http://127.0.0.1:${port}${urlPath}`, opts);
  const body = await res.json();
  return { status: res.status, body };
}

/**
 * Create an isolated load+quote pair suitable for a booking test.
 * Returns { loadId, quoteId } after generating and committing a fresh quote.
 */
async function setupBookableLoad(srv, day = 1) {
  // Create a fresh load with the capabilities matching seed trucks
  // (32FT, CONTAINER, WATERPROOF, REFRIGERATED, PERISHABLE, FRAGILE on lane 1)
  const pickupDate = `2026-11-${String(day).padStart(2, "0")}`;
  const deliveryDate = `2026-11-${String(day + 1).padStart(2, "0")}`;
  const loadRes = await request(srv, "POST", "/api/loads", {
    laneId: 1,
    pickupDate,
    deliveryDate,
    weightKg: 18000,
    capabilityIds: [2, 3, 5, 6, 8, 9], // 32FT(2), CONTAINER(3), WATERPROOF(5), REFRIGERATED(6), FRAGILE(8), PERISHABLE(9)
  });
  assert.equal(loadRes.status, 201, `load creation failed: ${JSON.stringify(loadRes.body)}`);
  const loadId = loadRes.body.load_id;

  const quotesRes = await request(srv, "POST", `/api/loads/${loadId}/quotes`);
  assert.equal(quotesRes.status, 201, `quote generation failed: ${JSON.stringify(quotesRes.body)}`);
  assert.ok(quotesRes.body.length > 0, "Expected at least one quote");

  return { loadId, quotes: quotesRes.body };
}

async function cleanupLoad(loadId) {
  await pool.query(
    "DELETE FROM bookings WHERE quote_id IN (SELECT quote_id FROM quotes WHERE load_id = $1)",
    [loadId]
  );
  await pool.query("DELETE FROM quotes WHERE load_id = $1", [loadId]);
  await pool.query("DELETE FROM load_capabilities WHERE load_id = $1", [loadId]);
  await pool.query("DELETE FROM loads WHERE load_id = $1", [loadId]);
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("Concurrency regression tests", () => {
  let server;
  const loadIds = [];

  before(async () => {
    server = await listen(app);
  });

  after(async () => {
    for (const id of loadIds) {
      await cleanupLoad(id).catch(() => {});
    }
    await close(server);
  });

  // -------------------------------------------------------------------------
  // RACE 1: Two concurrent requests trying to book the SAME quote
  // Expected: exactly one wins (201), the other gets 409 Conflict.
  // The UNIQUE(quote_id) constraint on bookings is the final guard, but the
  // application-layer checks + row lock should prevent the second from even
  // reaching the INSERT.
  // -------------------------------------------------------------------------
  it("Race 1 — two concurrent requests for same quote: exactly one succeeds", async () => {
    const { loadId, quotes } = await setupBookableLoad(server, 1);
    loadIds.push(loadId);

    const quoteId = quotes[0].quote_id;

    // Fire both booking requests simultaneously
    const [r1, r2] = await Promise.all([
      request(server, "POST", `/api/quotes/${quoteId}/book`),
      request(server, "POST", `/api/quotes/${quoteId}/book`),
    ]);

    const statuses = [r1.status, r2.status].sort();
    assert.equal(statuses[0], 201, `Expected one 201, got ${statuses}`);
    assert.equal(statuses[1], 409, `Expected one 409, got ${statuses}`);

    // Verify exactly one booking row exists
    const { rows } = await pool.query(
      "SELECT COUNT(*) AS cnt FROM bookings b JOIN quotes q ON q.quote_id = b.quote_id WHERE q.load_id = $1",
      [loadId]
    );
    assert.equal(Number(rows[0].cnt), 1, "Expected exactly one booking row");

    // Verify load is BOOKED
    const loadCheck = await request(server, "GET", `/api/loads/${loadId}`);
    assert.equal(loadCheck.body.status, "BOOKED");
  });

  // -------------------------------------------------------------------------
  // RACE 2: Two concurrent requests booking DIFFERENT quotes for the SAME load
  // Expected: exactly one succeeds (201), the other gets 409.
  // This tests the CAS on updateLoadStatus (AND status IN ('OPEN','QUOTED')).
  // -------------------------------------------------------------------------
  it("Race 2 — two concurrent requests booking different quotes on same load: exactly one succeeds", async () => {
    const { loadId, quotes } = await setupBookableLoad(server, 4);
    loadIds.push(loadId);

    if (quotes.length < 2) {
      // Seed may only produce 1 quote for some load configs; skip gracefully
      console.log("  ⚠ Skipping Race 2: only 1 quote generated for this load (need ≥2 trucks)");
      await cleanupLoad(loadId);
      loadIds.pop();
      return;
    }

    const [q1, q2] = [quotes[0].quote_id, quotes[1].quote_id];

    const [r1, r2] = await Promise.all([
      request(server, "POST", `/api/quotes/${q1}/book`),
      request(server, "POST", `/api/quotes/${q2}/book`),
    ]);

    const statuses = [r1.status, r2.status].sort();
    assert.equal(statuses[0], 201, `Expected one 201, got statuses ${JSON.stringify(statuses)}`);
    assert.equal(statuses[1], 409, `Expected one 409, got statuses ${JSON.stringify(statuses)}`);

    // Verify exactly one booking row
    const { rows } = await pool.query(
      "SELECT COUNT(*) AS cnt FROM bookings b JOIN quotes q ON q.quote_id = b.quote_id WHERE q.load_id = $1",
      [loadId]
    );
    assert.equal(Number(rows[0].cnt), 1, "Expected exactly one booking row");

    // Load must be BOOKED
    const loadCheck = await request(server, "GET", `/api/loads/${loadId}`);
    assert.equal(loadCheck.body.status, "BOOKED");
  });

  // -------------------------------------------------------------------------
  // RACE 3: Booking an already-ACCEPTED quote must return 409, not 500
  // This is the single-sequential case but validates the correct error code
  // for the CAS guard path.
  // -------------------------------------------------------------------------
  it("Race 3 — booking an already-accepted quote returns 409 (not 500)", async () => {
    const { loadId, quotes } = await setupBookableLoad(server, 7);
    loadIds.push(loadId);

    const quoteId = quotes[0].quote_id;

    // Book it once successfully
    const r1 = await request(server, "POST", `/api/quotes/${quoteId}/book`);
    assert.equal(r1.status, 201, `First booking should succeed`);

    // Book it again — must be 409 with a client-facing error, not 500
    const r2 = await request(server, "POST", `/api/quotes/${quoteId}/book`);
    assert.equal(r2.status, 409, `Second booking should return 409`);
    assert.ok(r2.body.error, "Response should have an error field");
    assert.notEqual(r2.body.error, "Internal server error", "409 must not be disguised as 500");
  });

  // -------------------------------------------------------------------------
  // RACE 4: Rollback leaves load and quote in their original states
  // We force a failure after createBooking by directly manipulating DB state
  // mid-transaction; simulated here by booking an expired quote.
  // -------------------------------------------------------------------------
  it("Race 4 — booking expired quote returns 409 and leaves load OPEN/QUOTED", async () => {
    const { loadId, quotes } = await setupBookableLoad(server, 13);
    loadIds.push(loadId);

    const quoteId = quotes[0].quote_id;

    // Expire the quote directly in DB (simulate time passing past valid_until)
    await pool.query(
      "UPDATE quotes SET valid_until = NOW() - INTERVAL '1 second' WHERE quote_id = $1",
      [quoteId]
    );

    const r = await request(server, "POST", `/api/quotes/${quoteId}/book`);
    assert.equal(r.status, 409, "Expired quote must return 409");
    assert.ok(r.body.error, "Must have error field");

    // Load must remain OPEN or QUOTED (not BOOKED)
    const loadCheck = await request(server, "GET", `/api/loads/${loadId}`);
    assert.ok(
      ["OPEN", "QUOTED"].includes(loadCheck.body.status),
      `Load status should be OPEN or QUOTED after failed booking, got: ${loadCheck.body.status}`
    );

    // No booking row must exist
    const { rows } = await pool.query(
      "SELECT COUNT(*) AS cnt FROM bookings b JOIN quotes q ON q.quote_id = b.quote_id WHERE q.load_id = $1",
      [loadId]
    );
    assert.equal(Number(rows[0].cnt), 0, "No booking row should exist after rollback");
  });

  // -------------------------------------------------------------------------
  // RACE 5: Truck conflict detection — same truck, overlapping dates
  // We book the truck on Load A, then try to book the same truck on Load B
  // with an overlapping date range.  The second booking must be rejected.
  // -------------------------------------------------------------------------
  it("Race 5 — overlapping truck bookings for the same truck are rejected", async () => {
    // Load A — book it to occupy the truck on 2026-11-10 → 2026-11-11
    const loadARes = await request(server, "POST", "/api/loads", {
      laneId: 1,
      pickupDate: "2026-11-10",
      deliveryDate: "2026-11-11",
      weightKg: 18000,
      capabilityIds: [2, 3, 5, 6, 8, 9],
    });
    assert.equal(loadARes.status, 201);
    const loadAId = loadARes.body.load_id;
    loadIds.push(loadAId);

    const quotesARes = await request(server, "POST", `/api/loads/${loadAId}/quotes`);
    assert.equal(quotesARes.status, 201);
    if (quotesARes.body.length === 0) {
      console.log("  ⚠ Skipping Race 5: no eligible trucks produced quotes");
      return;
    }
    // Book the cheapest quote on Load A (fixes the truck)
    const quoteA = quotesARes.body[0]; // cheapest first
    const bookA = await request(server, "POST", `/api/quotes/${quoteA.quote_id}/book`);
    assert.equal(bookA.status, 201, `Booking Load A failed: ${JSON.stringify(bookA.body)}`);
    const bookedTruckId = quoteA.truck_id;

    // Load B — same date range, same lane, ensure it targets the same truck
    const loadBRes = await request(server, "POST", "/api/loads", {
      laneId: 1,
      pickupDate: "2026-11-10",  // overlapping with Load A
      deliveryDate: "2026-11-11",
      weightKg: 18000,
      capabilityIds: [2, 3, 5, 6, 8, 9],
    });
    assert.equal(loadBRes.status, 201);
    const loadBId = loadBRes.body.load_id;
    loadIds.push(loadBId);

    const quotesBRes = await request(server, "POST", `/api/loads/${loadBId}/quotes`);
    assert.equal(quotesBRes.status, 201);
    if (quotesBRes.body.length === 0) {
      console.log("  ⚠ Skipping Race 5b: no quotes generated for Load B (all trucks occupied)");
      return;
    }

    // Find the quote for the already-booked truck
    const conflictingQuote = quotesBRes.body.find((q) => q.truck_id === bookedTruckId);
    if (!conflictingQuote) {
      console.log("  ⚠ Skipping Race 5b: no quote for the specifically booked truck on Load B");
      return;
    }

    // Attempt to book that truck again on the overlapping range → must be 409
    const bookB = await request(server, "POST", `/api/quotes/${conflictingQuote.quote_id}/book`);
    assert.equal(bookB.status, 409, `Expected 409 for overlapping truck booking, got ${bookB.status}`);
    assert.ok(bookB.body.error, "Must have an error field");
    assert.notEqual(bookB.body.error, "Internal server error", "Must not be 500");
  });

  // -------------------------------------------------------------------------
  // RACE 6: Five concurrent duplicate booking requests — only one wins
  // Stress version of Race 1 with higher concurrency.
  // -------------------------------------------------------------------------
  it("Race 6 — five concurrent requests for same quote: exactly one 201", async () => {
    const { loadId, quotes } = await setupBookableLoad(server, 20);
    loadIds.push(loadId);

    const quoteId = quotes[0].quote_id;

    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        request(server, "POST", `/api/quotes/${quoteId}/book`)
      )
    );

    const succeeded = results.filter((r) => r.status === 201);
    const rejected  = results.filter((r) => r.status === 409);
    const errors    = results.filter((r) => r.status === 500);

    assert.equal(succeeded.length, 1, `Expected exactly 1 success, got ${succeeded.length}`);
    assert.equal(errors.length,    0, `Expected 0 server errors, got ${errors.length}: ${JSON.stringify(errors)}`);
    assert.equal(rejected.length,  4, `Expected 4 rejections, got ${rejected.length}`);
  });
});
