import { Router } from "express";
import * as priceHistoryController from "../controllers/priceHistoryController";

const router = Router();

router.get("/api/price-history", priceHistoryController.getPriceHistory);

export default router;
