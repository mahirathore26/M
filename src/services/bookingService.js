import pool from "../db/pool.js";
import { getQuoteById as defaultGetQuoteById } from "../repositories/quoteRepository.js";
import {
  getActiveBookingForLoad as defaultGetActiveBookingForLoad,
  getTruckBookingConflicts as defaultGetTruckBookingConflicts,
  createBooking as defaultCreateBooking,
  getBookingById as defaultGetBookingById,
} from "../repositories/bookingRepository.js";
import {
  lockBookingResources as defaultLockBookingResources,
  updateQuoteStatus as defaultUpdateQuoteStatus,
  updateLoadStatus as defaultUpdateLoadStatus,
} from "../repositories/bookingTransactionRepository.js";

function toDateString(val) {
  return typeof val === "string" ? val.slice(0, 10) : String(val);
}

export async function bookQuote(quoteId, deps = {}) {
  if (!Number.isInteger(quoteId) || quoteId <= 0) {
    throw new Error("quoteId must be a positive integer.");
  }

  const currentPool = deps.pool ?? pool;
  const getQuoteById = deps.getQuoteById ?? defaultGetQuoteById;
  const getActiveBookingForLoad = deps.getActiveBookingForLoad ?? defaultGetActiveBookingForLoad;
  const getTruckBookingConflicts = deps.getTruckBookingConflicts ?? defaultGetTruckBookingConflicts;
  const createBooking = deps.createBooking ?? defaultCreateBooking;
  const getBookingById = deps.getBookingById ?? defaultGetBookingById;
  const lockBookingResources = deps.lockBookingResources ?? defaultLockBookingResources;
  const updateQuoteStatus = deps.updateQuoteStatus ?? defaultUpdateQuoteStatus;
  const updateLoadStatus = deps.updateLoadStatus ?? defaultUpdateLoadStatus;

  const client = await currentPool.connect();
  let createdBookingId = null;

  try {
    await client.query("BEGIN");

    const quote = await getQuoteById(quoteId, client);

    if (!quote) {
      throw new Error(`Quote ${quoteId} not found.`);
    }

    if (quote.status !== "ACTIVE") {
      throw new Error(`Quote ${quoteId} is not ACTIVE (status: ${quote.status}).`);
    }

    const validUntilVal = quote.quote_valid_until ?? quote.valid_until;
    if (!validUntilVal) {
      throw new Error(`Quote ${quoteId} has invalid valid_until.`);
    }

    const validUntil = new Date(validUntilVal);
    if (Number.isNaN(validUntil.getTime())) {
      throw new Error(`Quote ${quoteId} has invalid valid_until.`);
    }

    const now = deps.now ? new Date(deps.now) : new Date();
    if (validUntil <= now) {
      throw new Error(`Quote ${quoteId} has expired.`);
    }

    if (!quote.delivery_date) {
      throw new Error(`Load ${quote.load_id} does not have a delivery_date.`);
    }

    await lockBookingResources(quote.load_id, quote.truck_id, client);

    const activeBookings = await getActiveBookingForLoad(quote.load_id, client);
    if (activeBookings && activeBookings.length > 0) {
      throw new Error(`Load ${quote.load_id} already has an active booking.`);
    }

    const pickupDateStr = toDateString(quote.pickup_date);
    const deliveryDateStr = toDateString(quote.delivery_date);

    const truckConflicts = await getTruckBookingConflicts(
      quote.truck_id,
      pickupDateStr,
      deliveryDateStr,
      client
    );
    if (truckConflicts && truckConflicts.length > 0) {
      throw new Error(`Truck ${quote.truck_id} has an overlapping booking conflict.`);
    }

    const newBooking = await createBooking({ quoteId }, client);
    createdBookingId = newBooking.booking_id;

    const updatedQuote = await updateQuoteStatus(quoteId, "ACCEPTED", client);
    if (!updatedQuote) {
      throw new Error(`Failed to update quote ${quoteId} status to ACCEPTED.`);
    }

    const updatedLoad = await updateLoadStatus(quote.load_id, "BOOKED", client);
    if (!updatedLoad) {
      throw new Error(`Failed to update load ${quote.load_id} status to BOOKED.`);
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return await getBookingById(Number(createdBookingId));
}
