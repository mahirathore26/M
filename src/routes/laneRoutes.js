import { Router } from "express";
import { getLanes } from "../controllers/laneController.js";

const router = Router();

router.get("/", getLanes);

export default router;
