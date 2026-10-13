import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import app from "../app.js";
import pool from "../db/pool.js";

function listen(expressApp) {
  return new Promise((resolve) => {
    const srv = http.createServer(expressApp);
    srv.listen(0, "127.0.0.1", () => resolve(srv));
  });
}

function close(srv) {
  return new Promise((resolve) => srv.close(resolve));
}

async function request(srv, method, path, data = null) {
  const { port } = srv.address();
  const options = {
    method,
    headers: {},
  };
  if (data !== null) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(data);
  }
  const res = await fetch(`http://127.0.0.1:${port}${path}`, options);
  const body = await res.json();
  return { status: res.status, body };
}

describe("REST API Integration Tests", () => {
  let server;
  const createdLoadIds = [];

  before(async () => {
    server = await listen(app);
  });

  after(async () => {
    // Clean up any created test records in reverse order of FK constraints
    for (const loadId of createdLoadIds) {
      await pool.query(
        "DELETE FROM bookings WHERE quote_id IN (SELECT quote_id FROM quotes WHERE load_id = $1)",
        [loadId]
      );
      await pool.query("DELETE FROM quotes WHERE load_id = $1", [loadId]);
      await pool.query("DELETE FROM load_capabilities WHERE load_id = $1", [loadId]);
      await pool.query("DELETE FROM loads WHERE load_id = $1", [loadId]);
    }
    await close(server);
  });

  describe("1. GET /api/lanes", () => {
    it("returns 200 and a list of active lanes", async () => {
      const { status, body } = await request(server, "GET", "/api/lanes");
      assert.equal(status, 200);
      assert.ok(Array.isArray(body));
      assert.ok(body.length > 0);
      const lane = body[0];
      assert.ok(lane.lane_id);
      assert.ok(lane.origin_city);
      assert.ok(lane.destination_city);
      assert.equal(lane.status, "ACTIVE");
    });
  });

  describe("2. POST /api/loads", () => {
    it("rejects invalid laneId with 400", async () => {
      const { status, body } = await request(server, "POST", "/api/loads", {
        laneId: -1,
        pickupDate: "2026-10-15",
        deliveryDate: "2026-10-16",
        weightKg: 18000,
      });
      assert.equal(status, 400);
      assert.ok(body.error);
    });

    it("rejects non-existent laneId with 400", async () => {
      const { status, body } = await request(server, "POST", "/api/loads", {
        laneId: 999999,
        pickupDate: "2026-10-15",
        deliveryDate: "2026-10-16",
        weightKg: 18000,
      });
      assert.equal(status, 400);
      assert.ok(body.error);
    });

    it("rejects invalid calendar dates with 400", async () => {
      const { status, body } = await request(server, "POST", "/api/loads", {
        laneId: 1,
        pickupDate: "2026-02-31", // invalid date
        deliveryDate: "2026-03-01",
        weightKg: 18000,
      });
      assert.equal(status, 400);
      assert.ok(body.error);
    });

    it("rejects inverted date ordering with 400", async () => {
      const { status, body } = await request(server, "POST", "/api/loads", {
        laneId: 1,
        pickupDate: "2026-10-20",
        deliveryDate: "2026-10-15",
        weightKg: 18000,
      });
      assert.equal(status, 400);
      assert.ok(body.error);
    });

    it("rejects non-positive weight with 400", async () => {
      const { status, body } = await request(server, "POST", "/api/loads", {
        laneId: 1,
        pickupDate: "2026-10-15",
        deliveryDate: "2026-10-16",
        weightKg: 0,
      });
      assert.equal(status, 400);
      assert.ok(body.error);
    });

    it("rejects non-existent capability IDs with 400", async () => {
      const { status, body } = await request(server, "POST", "/api/loads", {
        laneId: 1,
        pickupDate: "2026-10-15",
        deliveryDate: "2026-10-16",
        weightKg: 18000,
        capabilityIds: [999999],
      });
      assert.equal(status, 400);
      assert.ok(body.error);
    });

    it("creates a load atomically with OPEN status and returns 201", async () => {
      // Find Indore -> Mumbai lane (lane 1 in seed) and capabilities
      const res = await request(server, "POST", "/api/loads", {
        laneId: 1,
        pickupDate: "2026-10-15",
        deliveryDate: "2026-10-16",
        weightKg: 18000,
        capabilityIds: [2, 3, 5, 6, 7, 8], // 32FT, CONTAINER, WATERPROOF, REFRIGERATED, GENERAL, FRAGILE (or PERISHABLE)
      });
      assert.equal(res.status, 201);
      assert.ok(res.body.load_id);
      assert.equal(res.body.status, "OPEN");
      assert.equal(res.body.lane_id, 1);
      assert.equal(res.body.origin_city, "Indore");
      assert.equal(res.body.destination_city, "Mumbai");
      assert.ok(Array.isArray(res.body.capabilities));
      assert.equal(res.body.capabilities.length, 6);

      createdLoadIds.push(res.body.load_id);
    });
  });

  describe("3. GET /api/loads/:loadId", () => {
    it("returns 400 for invalid loadId", async () => {
      const { status, body } = await request(server, "GET", "/api/loads/not-an-id");
      assert.equal(status, 400);
      assert.ok(body.error);
    });

    it("returns 404 for non-existent loadId", async () => {
      const { status, body } = await request(server, "GET", "/api/loads/999999");
      assert.equal(status, 404);
      assert.equal(body.error, "Not found");
    });

    it("returns 200 with load details and capabilities for an existing load", async () => {
      const loadId = createdLoadIds[0];
      const { status, body } = await request(server, "GET", `/api/loads/${loadId}`);
      assert.equal(status, 200);
      assert.equal(body.load_id, loadId);
      assert.equal(body.status, "OPEN");
      assert.equal(body.origin_city, "Indore");
      assert.equal(body.destination_city, "Mumbai");
      assert.ok(Array.isArray(body.capabilities));
    });
  });

  describe("4. POST /api/loads/:loadId/quotes", () => {
    it("returns 400 for invalid loadId", async () => {
      const { status, body } = await request(server, "POST", "/api/loads/abc/quotes");
      assert.equal(status, 400);
      assert.ok(body.error);
    });

    it("returns 404 for non-existent loadId", async () => {
      const { status, body } = await request(server, "POST", "/api/loads/999999/quotes");
      assert.equal(status, 404);
      assert.equal(body.error, "Not found");
    });

    it("generates quotes with server-controlled 15-minute expiration", async () => {
      // Use Seed Load 1 (already OPEN, has 2 matching trucks: MP09-CM-3422 and MH12-AX-7742)
      // or our created load
      // Let's create a dedicated test load with seed 1's exact capabilities:
      // capabilities: 32FT(2), CONTAINER(3), WATERPROOF(5), REFRIGERATED(6), PERISHABLE(9), FRAGILE(8)
      const loadRes = await request(server, "POST", "/api/loads", {
        laneId: 1,
        pickupDate: "2026-10-15",
        deliveryDate: "2026-10-16",
        weightKg: 18000,
        capabilityIds: [2, 3, 5, 6, 8, 9],
      });
      assert.equal(loadRes.status, 201);
      const testLoadId = loadRes.body.load_id;
      createdLoadIds.push(testLoadId);

      const beforeTime = Date.now();
      const { status, body } = await request(
        server,
        "POST",
        `/api/loads/${testLoadId}/quotes`,
        {
          // Client attempting to override expiry or rate should be ignored
          validUntil: "2099-01-01T00:00:00Z",
          baseRate: 10,
        }
      );
      assert.equal(status, 201);
      assert.ok(Array.isArray(body));
      assert.ok(body.length > 0);

      const quote = body[0];
      assert.ok(quote.quote_id);
      assert.equal(quote.load_id, testLoadId);
      assert.equal(quote.status, "ACTIVE");
      assert.ok(Number(quote.total_amount) > 0);
      assert.ok(Number(quote.base_rate) > 0);

      // Verify server-side 15-minute validity window
      const validUntilDate = new Date(quote.valid_until);
      const expectedMin = beforeTime + 14 * 60 * 1000;
      const expectedMax = beforeTime + 16 * 60 * 1000;
      assert.ok(
        validUntilDate.getTime() >= expectedMin && validUntilDate.getTime() <= expectedMax,
        `Expected valid_until to be ~15m in future, got ${quote.valid_until}`
      );
    });
  });

  describe("5. GET /api/loads/:loadId/quotes", () => {
    it("returns 400 for invalid loadId", async () => {
      const { status, body } = await request(server, "GET", "/api/loads/0/quotes");
      assert.equal(status, 400);
      assert.ok(body.error);
    });

    it("returns 404 for non-existent loadId", async () => {
      const { status, body } = await request(server, "GET", "/api/loads/999999/quotes");
      assert.equal(status, 404);
      assert.equal(body.error, "Not found");
    });

    it("returns 200 with list of available quotes for load", async () => {
      const testLoadId = createdLoadIds[createdLoadIds.length - 1];
      const { status, body } = await request(server, "GET", `/api/loads/${testLoadId}/quotes`);
      assert.equal(status, 200);
      assert.ok(Array.isArray(body));
      assert.ok(body.length > 0);
      assert.equal(body[0].status, "ACTIVE");
    });
  });

  describe("6. GET /api/quotes/:quoteId", () => {
    it("returns 400 for invalid quoteId", async () => {
      const { status, body } = await request(server, "GET", "/api/quotes/invalid");
      assert.equal(status, 400);
      assert.ok(body.error);
    });

    it("returns 404 for non-existent quoteId", async () => {
      const { status, body } = await request(server, "GET", "/api/quotes/999999");
      assert.equal(status, 404);
      assert.equal(body.error, "Not found");
    });

    it("returns 200 with fully-joined quote and preserved calculation_snapshot", async () => {
      const testLoadId = createdLoadIds[createdLoadIds.length - 1];
      const quotesRes = await request(server, "GET", `/api/loads/${testLoadId}/quotes`);
      const targetQuoteId = quotesRes.body[0].quote_id;

      const { status, body } = await request(server, "GET", `/api/quotes/${targetQuoteId}`);
      assert.equal(status, 200);
      assert.equal(body.quote_id, targetQuoteId);
      assert.ok(body.calculation_snapshot);
      assert.ok(body.calculation_snapshot.baseRate);
      assert.ok(body.carrier_name);
      assert.ok(body.registration_number);
    });
  });

  describe("7. POST /api/quotes/:quoteId/book", () => {
    it("returns 400 for invalid quoteId", async () => {
      const { status, body } = await request(server, "POST", "/api/quotes/bad/book");
      assert.equal(status, 400);
      assert.ok(body.error);
    });

    it("returns 404 for non-existent quoteId", async () => {
      const { status, body } = await request(server, "POST", "/api/quotes/999999/book");
      assert.equal(status, 404);
      assert.equal(body.error, "Not found");
    });

    it("books an active quote returning 201, updates quote and load statuses", async () => {
      const testLoadId = createdLoadIds[createdLoadIds.length - 1];
      const quotesRes = await request(server, "GET", `/api/loads/${testLoadId}/quotes`);
      const targetQuote = quotesRes.body[0];

      const { status, body } = await request(server, "POST", `/api/quotes/${targetQuote.quote_id}/book`);
      assert.equal(status, 201);
      assert.ok(body.booking_id);
      assert.equal(body.quote_id, targetQuote.quote_id);
      assert.equal(body.booking_status, "CONFIRMED");

      // Verify quote is now ACCEPTED
      const quoteCheck = await request(server, "GET", `/api/quotes/${targetQuote.quote_id}`);
      assert.equal(quoteCheck.body.status, "ACCEPTED");

      // Verify load is now BOOKED
      const loadCheck = await request(server, "GET", `/api/loads/${testLoadId}`);
      assert.equal(loadCheck.body.status, "BOOKED");
    });

    it("rejects booking an already accepted/inactive quote with 409 conflict", async () => {
      const testLoadId = createdLoadIds[createdLoadIds.length - 1];
      const quotesRes = await request(server, "GET", `/api/loads/${testLoadId}/quotes`);
      // Quotes for booked load or previously accepted quote
      const targetQuoteId = quotesRes.body[0].quote_id;

      const { status, body } = await request(server, "POST", `/api/quotes/${targetQuoteId}/book`);
      assert.equal(status, 409);
      assert.ok(body.error);
    });
  });

  describe("8. GET /api/bookings/:bookingId", () => {
    it("returns 400 for invalid bookingId", async () => {
      const { status, body } = await request(server, "GET", "/api/bookings/null");
      assert.equal(status, 400);
      assert.ok(body.error);
    });

    it("returns 404 for non-existent bookingId", async () => {
      const { status, body } = await request(server, "GET", "/api/bookings/999999");
      assert.equal(status, 404);
      assert.equal(body.error, "Not found");
    });

    it("returns 200 with fully-joined booking view", async () => {
      // Find the booking just created
      const testLoadId = createdLoadIds[createdLoadIds.length - 1];
      const result = await pool.query(
        "SELECT b.booking_id FROM bookings b JOIN quotes q ON q.quote_id = b.quote_id WHERE q.load_id = $1",
        [testLoadId]
      );
      assert.ok(result.rows.length > 0);
      const bookingId = Number(result.rows[0].booking_id);

      const { status, body } = await request(server, "GET", `/api/bookings/${bookingId}`);
      assert.equal(status, 200);
      assert.equal(body.booking_id, bookingId);
      assert.equal(body.booking_status, "CONFIRMED");
      assert.ok(body.carrier_name);
      assert.ok(body.registration_number);
      assert.ok(body.origin_city);
      assert.ok(body.destination_city);
    });
  });
});
