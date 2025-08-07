import { Router } from "express";
import { getDashboardStats, getRecentUpdates, getCostEvolution } from "../controllers/dashboardController";

const router = Router();

router.get("/stats", getDashboardStats);
router.get("/recent-updates", getRecentUpdates);
router.get("/cost-evolution", getCostEvolution);

export default router;