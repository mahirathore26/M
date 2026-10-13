import { Router } from "express";
import {
  handleCreateLoad,
  handleGetLoadById,
  handleGenerateQuotes,
  handleGetQuotesForLoad,
} from "../controllers/loadController.js";

const router = Router();

router.post("/", handleCreateLoad);
router.get("/:loadId", handleGetLoadById);
router.post("/:loadId/quotes", handleGenerateQuotes);
router.get("/:loadId/quotes", handleGetQuotesForLoad);

export default router;
