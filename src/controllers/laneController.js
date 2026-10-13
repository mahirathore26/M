import { getActiveLanes } from "../repositories/laneRepository.js";

export async function getLanes(_req, res, next) {
  try {
    const lanes = await getActiveLanes();
    res.json(lanes);
  } catch (err) {
    next(err);
  }
}
