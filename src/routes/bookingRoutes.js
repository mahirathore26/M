import { Router } from "express";
import { handleGetBookingById } from "../controllers/bookingController.js";

const router = Router();

router.get("/:bookingId", handleGetBookingById);

export default router;
