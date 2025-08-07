
import { Router } from "express";
import { FixedCostController } from "../controllers/fixedCostController";
import { isAuthenticated } from "../middlewares/authMiddleware";

const router = Router();
const fixedCostController = new FixedCostController();

router.use(isAuthenticated);

router.get("/", fixedCostController.getAll.bind(fixedCostController));
router.get("/active", fixedCostController.getActive.bind(fixedCostController));
router.get("/monthly-total", fixedCostController.getMonthlyTotal.bind(fixedCostController));
router.get("/by-category", fixedCostController.getByCategory.bind(fixedCostController));
router.get("/cost-per-hour", fixedCostController.getFixedCostPerHour.bind(fixedCostController));
router.get("/work-configuration", fixedCostController.getWorkConfiguration.bind(fixedCostController));
router.put("/work-configuration", fixedCostController.updateWorkConfiguration.bind(fixedCostController));
router.get("/:id", fixedCostController.getById.bind(fixedCostController));
router.post("/", fixedCostController.create.bind(fixedCostController));
router.put("/:id", fixedCostController.update.bind(fixedCostController));
router.patch("/:id/toggle", fixedCostController.toggleActive.bind(fixedCostController));
router.delete("/:id", fixedCostController.delete.bind(fixedCostController));

export default router;
