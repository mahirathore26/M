import { Router } from "express";
import { getCapabilities } from "../controllers/capabilityController.js";

const router = Router();

router.get("/", getCapabilities);

export default router;
