import { Express } from "express";

import authRoutes from "./authRoutes";
import dashboardRoutes from "./dashboardRoutes";
import ingredientRoutes from "./ingredientRoutes";
import priceHistoryRoutes from "./priceHistoryRoutes";
import productRoutes from "./productRoutes";
import recipeRoutes from "./recipeRoutes";
import reportRoutes from "./reportRoutes";
import userRoutes from "./userRoutes";
import fixedCostRoutes from "./fixedCostRoutes";
import { Router } from "express";
import { FixedCostController } from "../controllers/fixedCostController";
import { isAuthenticated } from "../middlewares/authMiddleware";

export async function registerRoutes(app: Express) {
  app.use(authRoutes);
  app.use(dashboardRoutes);
  app.use(ingredientRoutes);
  app.use(priceHistoryRoutes);
  app.use(productRoutes);
  app.use(recipeRoutes);
  app.use(reportRoutes);
  app.use(userRoutes);
  app.use("/api/fixed-costs", fixedCostRoutes);

  // Work configuration routes
  const workConfigRouter = Router();
  const fixedCostController = new FixedCostController();

  workConfigRouter.use(isAuthenticated);
  workConfigRouter.get("/work-configuration", fixedCostController.getWorkConfiguration.bind(fixedCostController));
  workConfigRouter.put("/work-configuration", fixedCostController.updateWorkConfiguration.bind(fixedCostController));

  app.use("/api/work-config", workConfigRouter);
}