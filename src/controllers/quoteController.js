import { getQuoteById } from "../repositories/quoteRepository.js";
import { bookQuote } from "../services/bookingService.js";
import { BadRequestError, NotFoundError } from "../errors/AppError.js";

function parsePositiveInt(val, name) {
  const num = Number(val);
  if (!Number.isInteger(num) || num <= 0) {
    throw new BadRequestError(`${name} must be a positive integer.`);
  }
  return num;
}

export async function handleGetQuoteById(req, res, next) {
  try {
    const quoteId = parsePositiveInt(req.params.quoteId, "quoteId");
    const quote = await getQuoteById(quoteId);
    if (!quote) {
      throw new NotFoundError(`Quote ${quoteId} not found.`);
    }
    res.json(quote);
  } catch (err) {
    next(err);
  }
}

export async function handleBookQuote(req, res, next) {
  try {
    const quoteId = parsePositiveInt(req.params.quoteId, "quoteId");
    const booking = await bookQuote(quoteId);
    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
}
