import { Router } from "express";
import * as recipeController from "../controllers/recipeController";

const router = Router();

router.post("/api/products/:id/recipes", recipeController.saveRecipes);

export default router;