import pool from "../db/pool.js";
import {
  getLoadById as defaultGetLoadById,
  createLoad as defaultCreateLoad,
  createLoadCapability as defaultCreateLoadCapability,
} from "../repositories/loadRepository.js";
import { getLaneById as defaultGetLaneById } from "../repositories/laneRepository.js";
import { getCapabilitiesByIds as defaultGetCapabilitiesByIds } from "../repositories/capabilityRepository.js";
import { BadRequestError, NotFoundError } from "../errors/AppError.js";

function isValidCalendarDate(dateStr) {
  if (typeof dateStr !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export async function createLoad(data, deps = {}) {
  const currentPool = deps.pool ?? pool;
  const getLaneById = deps.getLaneById ?? defaultGetLaneById;
  const getCapabilitiesByIds = deps.getCapabilitiesByIds ?? defaultGetCapabilitiesByIds;
  const createLoadRepo = deps.createLoad ?? defaultCreateLoad;
  const createLoadCapabilityRepo = deps.createLoadCapability ?? defaultCreateLoadCapability;
  const getLoadByIdRepo = deps.getLoadById ?? defaultGetLoadById;

  const laneId = data?.laneId ?? data?.lane_id;
  const pickupDate = data?.pickupDate ?? data?.pickup_date;
  const deliveryDate = data?.deliveryDate ?? data?.delivery_date;
  const weightKg = data?.weightKg ?? data?.weight_kg;
  const rawCapabilityIds = data?.capabilityIds ?? data?.capability_ids ?? [];

  if (!Number.isInteger(laneId) || laneId <= 0) {
    throw new BadRequestError("laneId must be a positive integer.");
  }

  if (!Number.isInteger(weightKg) || weightKg <= 0) {
    throw new BadRequestError("weightKg must be a positive integer.");
  }

  if (!isValidCalendarDate(pickupDate)) {
    throw new BadRequestError("pickupDate must be a valid calendar date in YYYY-MM-DD format.");
  }

  if (deliveryDate !== undefined && deliveryDate !== null) {
    if (!isValidCalendarDate(deliveryDate)) {
      throw new BadRequestError("deliveryDate must be a valid calendar date in YYYY-MM-DD format.");
    }
    if (deliveryDate < pickupDate) {
      throw new BadRequestError("deliveryDate cannot be earlier than pickupDate.");
    }
  }

  if (!Array.isArray(rawCapabilityIds)) {
    throw new BadRequestError("capabilityIds must be an array of positive integers.");
  }

  const uniqueCapabilityIds = [...new Set(rawCapabilityIds)];
  for (const capId of uniqueCapabilityIds) {
    if (!Number.isInteger(capId) || capId <= 0) {
      throw new BadRequestError("Every capability ID must be a positive integer.");
    }
  }

  const lane = await getLaneById(laneId);
  if (!lane) {
    throw new BadRequestError(`Lane ${laneId} does not exist.`);
  }
  if (lane.status !== "ACTIVE") {
    throw new BadRequestError(`Lane ${laneId} is not active.`);
  }

  if (uniqueCapabilityIds.length > 0) {
    const existingCapabilities = await getCapabilitiesByIds(uniqueCapabilityIds);
    if (existingCapabilities.length !== uniqueCapabilityIds.length) {
      throw new BadRequestError("One or more required capability IDs do not exist.");
    }
  }

  const client = await currentPool.connect();
  let createdLoadId;

  try {
    await client.query("BEGIN");

    const created = await createLoadRepo(
      {
        laneId,
        pickupDate,
        deliveryDate: deliveryDate ?? null,
        weightKg,
      },
      client
    );
    createdLoadId = Number(created.load_id);

    for (const capId of uniqueCapabilityIds) {
      await createLoadCapabilityRepo(createdLoadId, capId, client);
    }

    await client.query("COMMIT");
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore rollback failure */
    }
    throw err;
  } finally {
    client.release();
  }

  return await getLoadByIdRepo(Number(createdLoadId));
}

export async function getLoadById(loadId, deps = {}) {
  if (!Number.isInteger(loadId) || loadId <= 0) {
    throw new BadRequestError("loadId must be a positive integer.");
  }

  const getLoadByIdRepo = deps.getLoadById ?? defaultGetLoadById;
  const load = await getLoadByIdRepo(loadId);

  if (!load) {
    throw new NotFoundError(`Load ${loadId} not found.`);
  }

  return load;
}
