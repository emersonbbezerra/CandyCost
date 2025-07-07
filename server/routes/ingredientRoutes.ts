import { Router } from "express";
import * as ingredientController from "../controllers/ingredientController";
import { isAuthenticated } from "../middlewares/authMiddleware";

const router = Router();

router.get("/api/ingredients", isAuthenticated, ingredientController.getIngredients);
router.get("/api/ingredients/:id", isAuthenticated, ingredientController.getIngredientById);
router.post("/api/ingredients", isAuthenticated, ingredientController.createIngredient);
router.put("/api/ingredients/:id", isAuthenticated, ingredientController.updateIngredient);
router.delete("/api/ingredients/:id", isAuthenticated, ingredientController.deleteIngredient);

export default router;
