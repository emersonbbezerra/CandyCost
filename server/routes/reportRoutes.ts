import { Router } from "express";
import * as reportController from "../controllers/reportController";

const router = Router();

router.get("/api/reports", reportController.getReports);

export default router;
