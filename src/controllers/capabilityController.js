import { getAllCapabilities } from "../repositories/capabilityRepository.js";

export async function getCapabilities(_req, res, next) {
  try {
    const capabilities = await getAllCapabilities();
    res.json(capabilities);
  } catch (err) {
    next(err);
  }
}
