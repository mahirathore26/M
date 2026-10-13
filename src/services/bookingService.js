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

import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from "../errors/AppError.js";

function toDateString(val) {
  if (val instanceof Date) {
    const year = val.getFullYear();
    const month = String(val.getMonth() + 1).padStart(2, "0");
    const day = String(val.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return typeof val === "string" ? val.slice(0, 10) : String(val);
}

export async function bookQuote(quoteId, deps = {}) {
  if (!Number.isInteger(quoteId) || quoteId <= 0) {
    throw new BadRequestError("quoteId must be a positive integer.");
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
      throw new NotFoundError(`Quote ${quoteId} not found.`);
    }

    if (quote.status !== "ACTIVE") {
      throw new ConflictError(`Quote ${quoteId} is not ACTIVE (status: ${quote.status}).`, `Quote ${quoteId} is not active.`);
    }

    const validUntilVal = quote.quote_valid_until ?? quote.valid_until;
    if (!validUntilVal) {
      throw new ConflictError(`Quote ${quoteId} has invalid valid_until.`, `Quote ${quoteId} has invalid valid_until.`);
    }

    const validUntil = new Date(validUntilVal);
    if (Number.isNaN(validUntil.getTime())) {
      throw new ConflictError(`Quote ${quoteId} has invalid valid_until.`, `Quote ${quoteId} has invalid valid_until.`);
    }

    const now = deps.now ? new Date(deps.now) : new Date();
    if (validUntil <= now) {
      throw new ConflictError(`Quote ${quoteId} has expired.`, `Quote ${quoteId} has expired.`);
    }

    if (!quote.delivery_date) {
      throw new BadRequestError(`Load ${quote.load_id} does not have a delivery_date.`, `Load does not have a delivery date.`);
    }

    const loadId = Number(quote.load_id);
    const truckId = Number(quote.truck_id);

    await lockBookingResources(loadId, truckId, client);

    const activeBookings = await getActiveBookingForLoad(loadId, client);
    if (activeBookings && activeBookings.length > 0) {
      throw new ConflictError(`Load ${loadId} already has an active booking.`, `Load already has an active booking.`);
    }

    const pickupDateStr = toDateString(quote.pickup_date);
    const deliveryDateStr = toDateString(quote.delivery_date);

    const truckConflicts = await getTruckBookingConflicts(
      truckId,
      pickupDateStr,
      deliveryDateStr,
      client
    );
    if (truckConflicts && truckConflicts.length > 0) {
      throw new ConflictError(`Truck ${truckId} has an overlapping booking conflict.`, `Truck has an overlapping booking conflict.`);
    }

    const newBooking = await createBooking({ quoteId }, client);
    createdBookingId = Number(newBooking.booking_id);

    const updatedQuote = await updateQuoteStatus(quoteId, "ACCEPTED", client);
    if (!updatedQuote) {
      throw new Error(`Failed to update quote ${quoteId} status to ACCEPTED.`);
    }

    const updatedLoad = await updateLoadStatus(loadId, "BOOKED", client);
    if (!updatedLoad) {
      throw new Error(`Failed to update load ${loadId} status to BOOKED.`);
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
