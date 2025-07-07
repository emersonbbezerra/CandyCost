import { Express } from "express";

import authRoutes from "./authRoutes";
import dashboardRoutes from "./dashboardRoutes";
import ingredientRoutes from "./ingredientRoutes";
import priceHistoryRoutes from "./priceHistoryRoutes";
import productRoutes from "./productRoutes";
import recipeRoutes from "./recipeRoutes";
import reportRoutes from "./reportRoutes";
import userRoutes from "./userRoutes";

export async function registerRoutes(app: Express) {
  app.use(authRoutes);
  app.use(dashboardRoutes);
  app.use(ingredientRoutes);
  app.use(priceHistoryRoutes);
  app.use(productRoutes);
  app.use(recipeRoutes);
  app.use(reportRoutes);
  app.use(userRoutes);
}
