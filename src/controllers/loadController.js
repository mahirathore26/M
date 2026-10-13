import { createLoad, getLoadById } from "../services/loadService.js";
import { requestQuotesForLoad } from "../services/quoteService.js";
import { listQuotesForLoad } from "../repositories/quoteRepository.js";
import { BadRequestError } from "../errors/AppError.js";

function parsePositiveInt(val, name) {
  const num = Number(val);
  if (!Number.isInteger(num) || num <= 0) {
    throw new BadRequestError(`${name} must be a positive integer.`);
  }
  return num;
}

export async function handleCreateLoad(req, res, next) {
  try {
    const load = await createLoad(req.body);
    res.status(201).json(load);
  } catch (err) {
    next(err);
  }
}

export async function handleGetLoadById(req, res, next) {
  try {
    const loadId = parsePositiveInt(req.params.loadId, "loadId");
    const load = await getLoadById(loadId);
    res.json(load);
  } catch (err) {
    next(err);
  }
}

export async function handleGenerateQuotes(req, res, next) {
  try {
    const loadId = parsePositiveInt(req.params.loadId, "loadId");
    const quotes = await requestQuotesForLoad(loadId);
    res.status(201).json(quotes);
  } catch (err) {
    next(err);
  }
}

export async function handleGetQuotesForLoad(req, res, next) {
  try {
    const loadId = parsePositiveInt(req.params.loadId, "loadId");
    // Verify load exists, throwing NotFoundError if missing
    await getLoadById(loadId);
    const quotes = await listQuotesForLoad(loadId);
    res.json(quotes);
  } catch (err) {
    next(err);
  }
}
