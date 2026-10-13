import { Router } from "express";
import {
  handleGetQuoteById,
  handleBookQuote,
} from "../controllers/quoteController.js";

const router = Router();

router.get("/:quoteId", handleGetQuoteById);
router.post("/:quoteId/book", handleBookQuote);

export default router;
