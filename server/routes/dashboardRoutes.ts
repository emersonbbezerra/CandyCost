import { Router } from "express";
import * as dashboardController from "../controllers/dashboardController";
import { isAuthenticated } from "../middlewares/authMiddleware";

const router = Router();

export default router;

router.get("/api/dashboard/stats", dashboardController.getDashboardStats);
router.get("/api/dashboard/recent-updates", dashboardController.getRecentUpdates);