import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { bookQuote } from "./bookingService.js";

function createMockClient() {
  const queries = [];
  let released = false;
  return {
    queries,
    get released() {
      return released;
    },
    async query(sql, params) {
      queries.push({ sql, params });
      return { rows: [] };
    },
    release() {
      released = true;
    },
  };
}

function createMockPool(client) {
  return {
    async connect() {
      return client;
    },
  };
}

describe("bookingService - bookQuote", () => {
  test("rejects invalid quoteId", async () => {
    await assert.rejects(bookQuote(0), {
      message: /quoteId must be a positive integer/,
    });
    await assert.rejects(bookQuote("abc"), {
      message: /quoteId must be a positive integer/,
    });
    await assert.rejects(bookQuote(null), {
      message: /quoteId must be a positive integer/,
    });
  });

  test("rejects if quote is not found", async () => {
    const client = createMockClient();
    const pool = createMockPool(client);

    const deps = {
      pool,
      getQuoteById: async () => null,
    };

    await assert.rejects(bookQuote(1, deps), { message: /not found/ });
    assert.equal(client.queries.some((q) => q.sql === "ROLLBACK"), true);
    assert.equal(client.released, true);
  });

  test("rejects if quote status is non-ACTIVE", async () => {
    const client = createMockClient();
    const pool = createMockPool(client);

    const deps = {
      pool,
      getQuoteById: async () => ({
        quote_id: 1,
        status: "ACCEPTED",
        valid_until: "2026-12-31T00:00:00Z",
        load_id: 10,
        truck_id: 20,
        pickup_date: "2026-10-15",
        delivery_date: "2026-10-16",
      }),
    };

    await assert.rejects(bookQuote(1, deps), { message: /not ACTIVE/ });
    assert.equal(client.queries.some((q) => q.sql === "ROLLBACK"), true);
    assert.equal(client.released, true);
  });

  test("rejects if quote valid_until is invalid", async () => {
    const client = createMockClient();
    const pool = createMockPool(client);

    const deps = {
      pool,
      getQuoteById: async () => ({
        quote_id: 1,
        status: "ACTIVE",
        valid_until: "invalid-date",
        load_id: 10,
        truck_id: 20,
        pickup_date: "2026-10-15",
        delivery_date: "2026-10-16",
      }),
    };

    await assert.rejects(bookQuote(1, deps), { message: /invalid valid_until/ });
    assert.equal(client.queries.some((q) => q.sql === "ROLLBACK"), true);
    assert.equal(client.released, true);
  });

  test("rejects if quote has expired", async () => {
    const client = createMockClient();
    const pool = createMockPool(client);

    const deps = {
      pool,
      now: "2026-10-25T00:00:00Z",
      getQuoteById: async () => ({
        quote_id: 1,
        status: "ACTIVE",
        valid_until: "2026-10-20T00:00:00Z",
        load_id: 10,
        truck_id: 20,
        pickup_date: "2026-10-15",
        delivery_date: "2026-10-16",
      }),
    };

    await assert.rejects(bookQuote(1, deps), { message: /expired/ });
    assert.equal(client.queries.some((q) => q.sql === "ROLLBACK"), true);
    assert.equal(client.released, true);
  });

  test("rejects if load is missing delivery_date", async () => {
    const client = createMockClient();
    const pool = createMockPool(client);

    const deps = {
      pool,
      now: "2026-10-10T00:00:00Z",
      getQuoteById: async () => ({
        quote_id: 1,
        status: "ACTIVE",
        valid_until: "2026-10-20T00:00:00Z",
        load_id: 10,
        truck_id: 20,
        pickup_date: "2026-10-15",
        delivery_date: null,
      }),
    };

    await assert.rejects(bookQuote(1, deps), { message: /delivery_date/ });
    assert.equal(client.queries.some((q) => q.sql === "ROLLBACK"), true);
    assert.equal(client.released, true);
  });

  test("rejects if load already has an active booking", async () => {
    const client = createMockClient();
    const pool = createMockPool(client);

    const deps = {
      pool,
      now: "2026-10-10T00:00:00Z",
      getQuoteById: async () => ({
        quote_id: 1,
        status: "ACTIVE",
        valid_until: "2026-10-20T00:00:00Z",
        load_id: 10,
        truck_id: 20,
        pickup_date: "2026-10-15",
        delivery_date: "2026-10-16",
      }),
      lockBookingResources: async () => {},
      getActiveBookingForLoad: async () => [{ booking_id: 99 }],
    };

    await assert.rejects(bookQuote(1, deps), { message: /active booking/ });
    assert.equal(client.queries.some((q) => q.sql === "ROLLBACK"), true);
    assert.equal(client.released, true);
  });

  test("rejects if truck has an overlapping booking conflict", async () => {
    const client = createMockClient();
    const pool = createMockPool(client);

    const deps = {
      pool,
      now: "2026-10-10T00:00:00Z",
      getQuoteById: async () => ({
        quote_id: 1,
        status: "ACTIVE",
        valid_until: "2026-10-20T00:00:00Z",
        load_id: 10,
        truck_id: 20,
        pickup_date: "2026-10-15",
        delivery_date: "2026-10-16",
      }),
      lockBookingResources: async () => {},
      getActiveBookingForLoad: async () => [],
      getTruckBookingConflicts: async () => [{ booking_id: 88 }],
    };

    await assert.rejects(bookQuote(1, deps), { message: /overlapping booking conflict/ });
    assert.equal(client.queries.some((q) => q.sql === "ROLLBACK"), true);
    assert.equal(client.released, true);
  });

  test("acquires resource lock before checking booking conflicts", async () => {
    const client = createMockClient();
    const pool = createMockPool(client);

    const callOrder = [];

    const deps = {
      pool,
      now: "2026-10-10T00:00:00Z",
      getQuoteById: async () => ({
        quote_id: 1,
        status: "ACTIVE",
        valid_until: "2026-10-20T00:00:00Z",
        load_id: 10,
        truck_id: 20,
        pickup_date: "2026-10-15",
        delivery_date: "2026-10-16",
      }),
      lockBookingResources: async (qId, c) => {
        callOrder.push({ fn: "lockBookingResources", quoteId: qId, client: c });
      },
      getActiveBookingForLoad: async (loadId, c) => {
        callOrder.push({ fn: "getActiveBookingForLoad", loadId, client: c });
        return [];
      },
      getTruckBookingConflicts: async (truckId, pickup, delivery, c) => {
        callOrder.push({ fn: "getTruckBookingConflicts", truckId, pickup, delivery, client: c });
        return [];
      },
      createBooking: async ({ quoteId }) => ({
        booking_id: 100,
        quote_id: quoteId,
        status: "CONFIRMED",
      }),
      updateQuoteStatus: async (quoteId, status) => ({ quote_id: quoteId, status }),
      updateLoadStatus: async (loadId, status) => ({ load_id: loadId, status }),
      getBookingById: async (bookingId) => ({ booking_id: bookingId }),
    };

    await bookQuote(1, deps);

    assert.equal(callOrder[0].fn, "lockBookingResources");
    assert.equal(callOrder[0].quoteId, 1);
    assert.equal(callOrder[0].client, client);

    assert.equal(callOrder[1].fn, "getActiveBookingForLoad");
    assert.equal(callOrder[2].fn, "getTruckBookingConflicts");
  });

  test("successfully performs booking flow (quote -> ACCEPTED, load -> BOOKED)", async () => {
    const client = createMockClient();
    const pool = createMockPool(client);

    let lockedResources = null;
    let quoteStatusUpdated = null;
    let loadStatusUpdated = null;

    const deps = {
      pool,
      now: "2026-10-10T00:00:00Z",
      getQuoteById: async () => ({
        quote_id: 1,
        status: "ACTIVE",
        valid_until: "2026-10-20T00:00:00Z",
        load_id: 10,
        truck_id: 20,
        pickup_date: "2026-10-15",
        delivery_date: "2026-10-16",
      }),
      lockBookingResources: async (qId) => {
        lockedResources = { quoteId: qId };
      },
      getActiveBookingForLoad: async () => [],
      getTruckBookingConflicts: async () => [],
      createBooking: async ({ quoteId }) => ({
        booking_id: 100,
        quote_id: quoteId,
        status: "CONFIRMED",
      }),
      updateQuoteStatus: async (quoteId, status) => {
        quoteStatusUpdated = { quoteId, status };
        return { quote_id: quoteId, status };
      },
      updateLoadStatus: async (loadId, status) => {
        loadStatusUpdated = { loadId, status };
        return { load_id: loadId, status };
      },
      getBookingById: async (bookingId) => ({
        booking_id: bookingId,
        quote_id: 1,
        booking_status: "CONFIRMED",
        load_id: 10,
      }),
    };

    const result = await bookQuote(1, deps);

    assert.deepEqual(result, {
      booking_id: 100,
      quote_id: 1,
      booking_status: "CONFIRMED",
      load_id: 10,
    });
    assert.deepEqual(lockedResources, { quoteId: 1 });
    assert.deepEqual(quoteStatusUpdated, { quoteId: 1, status: "ACCEPTED" });
    assert.deepEqual(loadStatusUpdated, { loadId: 10, status: "BOOKED" });
    assert.equal(client.queries.some((q) => q.sql === "BEGIN"), true);
    assert.equal(client.queries.some((q) => q.sql === "COMMIT"), true);
    assert.equal(client.released, true);
  });

  test("rolls back transaction when downstream step fails", async () => {
    const client = createMockClient();
    const pool = createMockPool(client);

    const deps = {
      pool,
      now: "2026-10-10T00:00:00Z",
      getQuoteById: async () => ({
        quote_id: 1,
        status: "ACTIVE",
        valid_until: "2026-10-20T00:00:00Z",
        load_id: 10,
        truck_id: 20,
        pickup_date: "2026-10-15",
        delivery_date: "2026-10-16",
      }),
      lockBookingResources: async () => {},
      getActiveBookingForLoad: async () => [],
      getTruckBookingConflicts: async () => [],
      createBooking: async () => {
        throw new Error("DB write error");
      },
    };

    await assert.rejects(bookQuote(1, deps), { message: /DB write error/ });
    assert.equal(client.queries.some((q) => q.sql === "ROLLBACK"), true);
    assert.equal(client.released, true);
  });

  test("rejects if quote status changes to non-ACTIVE while waiting for lock", async () => {
    const client = createMockClient();
    const pool = createMockPool(client);

    let getQuoteCount = 0;
    const deps = {
      pool,
      now: "2026-10-10T00:00:00Z",
      getQuoteById: async () => {
        getQuoteCount++;
        return {
          quote_id: 1,
          status: getQuoteCount === 1 ? "ACTIVE" : "ACCEPTED",
          valid_until: "2026-10-20T00:00:00Z",
          load_id: 10,
          truck_id: 20,
          pickup_date: "2026-10-15",
          delivery_date: "2026-10-16",
        };
      },
      lockBookingResources: async () => [{ quote_id: 1, load_id: 10, truck_id: 20 }],
      getActiveBookingForLoad: async () => [],
      getTruckBookingConflicts: async () => [],
      createBooking: async () => ({ booking_id: 100 }),
    };

    await assert.rejects(bookQuote(1, deps), { message: /not ACTIVE/ });
    assert.equal(getQuoteCount, 2);
    assert.equal(client.queries.some((q) => q.sql === "ROLLBACK"), true);
    assert.equal(client.released, true);
  });

  test("rejects if quote expires while waiting for lock", async () => {
    const client = createMockClient();
    const pool = createMockPool(client);

    let nowCalls = 0;
    const deps = {
      pool,
      now: () => {
        nowCalls++;
        return nowCalls === 1 ? "2026-10-10T00:00:00Z" : "2026-10-25T00:00:00Z";
      },
      getQuoteById: async () => ({
        quote_id: 1,
        status: "ACTIVE",
        valid_until: "2026-10-20T00:00:00Z",
        load_id: 10,
        truck_id: 20,
        pickup_date: "2026-10-15",
        delivery_date: "2026-10-16",
      }),
      lockBookingResources: async () => [{ quote_id: 1, load_id: 10, truck_id: 20 }],
      getActiveBookingForLoad: async () => [],
      getTruckBookingConflicts: async () => [],
      createBooking: async () => ({ booking_id: 100 }),
    };

    await assert.rejects(bookQuote(1, deps), { message: /expired/ });
    assert.ok(nowCalls >= 2);
    assert.equal(client.queries.some((q) => q.sql === "ROLLBACK"), true);
    assert.equal(client.released, true);
  });

  test("rejects if booking resources do not exist when acquiring lock", async () => {
    const client = createMockClient();
    const pool = createMockPool(client);

    const deps = {
      pool,
      now: "2026-10-10T00:00:00Z",
      getQuoteById: async () => ({
        quote_id: 1,
        status: "ACTIVE",
        valid_until: "2026-10-20T00:00:00Z",
        load_id: 10,
        truck_id: 20,
        pickup_date: "2026-10-15",
        delivery_date: "2026-10-16",
      }),
      lockBookingResources: async () => [],
    };

    await assert.rejects(bookQuote(1, deps), { message: /not found/ });
    assert.equal(client.queries.some((q) => q.sql === "ROLLBACK"), true);
    assert.equal(client.released, true);
  });
});
