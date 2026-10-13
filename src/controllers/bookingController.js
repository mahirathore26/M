import { getBookingById } from "../repositories/bookingRepository.js";
import { BadRequestError, NotFoundError } from "../errors/AppError.js";

function parsePositiveInt(val, name) {
  const num = Number(val);
  if (!Number.isInteger(num) || num <= 0) {
    throw new BadRequestError(`${name} must be a positive integer.`);
  }
  return num;
}

export async function handleGetBookingById(req, res, next) {
  try {
    const bookingId = parsePositiveInt(req.params.bookingId, "bookingId");
    const booking = await getBookingById(bookingId);
    if (!booking) {
      throw new NotFoundError(`Booking ${bookingId} not found.`);
    }
    res.json(booking);
  } catch (err) {
    next(err);
  }
}
