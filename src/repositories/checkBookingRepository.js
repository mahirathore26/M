import pool from "../db/pool.js";
import { createQuote } from "./quoteRepository.js";
import {
  getActiveBookingForLoad,
  getTruckBookingConflicts,
  createBooking,
  getBookingById,
} from "./bookingRepository.js";

async function main() {
  let createdQuoteId = null;
  let createdBookingId = null;

  try {
    const initialBookings = await getActiveBookingForLoad(1);
    if (!Array.isArray(initialBookings) || initialBookings.length !== 0) {
      throw new Error("Expected 0 active bookings for load 1 initially");
    }

    const initialConflicts = await getTruckBookingConflicts(2, "2026-10-15", "2026-10-20");
    if (!Array.isArray(initialConflicts) || initialConflicts.length !== 0) {
      throw new Error("Expected 0 truck booking conflicts initially");
    }

    const quote = await createQuote({
      loadId: 1,
      carrierId: 1,
      truckId: 2,
      rateCardId: 2,
      baseRate: "41500.00",
      fuelSurcharge: "4150.00",
      accessorialCharges: "0.00",
      totalAmount: "45650.00",
      validUntil: new Date("2026-10-20").toISOString(),
      calculationSnapshot: {},
    });
    if (!quote || !quote.quote_id) {
      throw new Error("Failed to create test quote");
    }
    createdQuoteId = Number(quote.quote_id);

    const booking = await createBooking({ quoteId: createdQuoteId });
    if (!booking || !booking.booking_id || booking.status !== "CONFIRMED") {
      throw new Error("createBooking failed or returned unexpected payload");
    }
    createdBookingId = Number(booking.booking_id);

    const fetchedBooking = await getBookingById(createdBookingId);
    if (!fetchedBooking || Number(fetchedBooking.booking_id) !== createdBookingId) {
      throw new Error("getBookingById failed to return expected booking object");
    }

    const nonExistentBooking = await getBookingById(999999);
    if (nonExistentBooking !== null) {
      throw new Error("getBookingById for non-existent ID should return null");
    }

    const activeBookings = await getActiveBookingForLoad(1);
    if (!Array.isArray(activeBookings) || activeBookings.length !== 1) {
      throw new Error("Expected 1 active booking for load 1 after creation");
    }

    const conflicts = await getTruckBookingConflicts(2, "2026-10-14", "2026-10-16");
    if (!Array.isArray(conflicts) || conflicts.length !== 1) {
      throw new Error("Expected 1 truck booking conflict after booking creation");
    }

    let errorCaught = false;
    try {
      await getActiveBookingForLoad(-1);
    } catch {
      errorCaught = true;
    }
    if (!errorCaught) {
      throw new Error("getActiveBookingForLoad should reject negative loadId");
    }

    errorCaught = false;
    try {
      await getTruckBookingConflicts(2, "invalid-date", "2026-10-20");
    } catch {
      errorCaught = true;
    }
    if (!errorCaught) {
      throw new Error("getTruckBookingConflicts should reject invalid date format");
    }

    errorCaught = false;
    try {
      await createBooking({ quoteId: 0 });
    } catch {
      errorCaught = true;
    }
    if (!errorCaught) {
      throw new Error("createBooking should reject non-positive quoteId");
    }

    console.log("✔ Booking repository check passed cleanly.");
  } catch (err) {
    console.error("✖ Check booking repository failed:", err.message);
    process.exitCode = 1;
  } finally {
    if (createdBookingId) {
      await pool.query("DELETE FROM bookings WHERE booking_id = $1", [createdBookingId]);
    }
    if (createdQuoteId) {
      await pool.query("DELETE FROM quotes WHERE quote_id = $1", [createdQuoteId]);
    }
    await pool.end();
  }
}

main();
