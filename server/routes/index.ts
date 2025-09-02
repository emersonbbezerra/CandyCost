import { Express } from 'express';

import { Router } from 'express';
import { FixedCostController } from '../controllers/fixedCostController';
import { isAuthenticated } from '../middlewares/authMiddleware';
import authRoutes from './authRoutes';
import dashboardRoutes from './dashboardRoutes';
import fixedCostRoutes from './fixedCostRoutes';
import ingredientRoutes from './ingredientRoutes';
import priceHistoryRoutes from './priceHistoryRoutes';
import productRoutes from './productRoutes';
import recipeRoutes from './recipeRoutes';
import reportRoutes from './reportRoutes';
import settingsRoutes from './settingsRoutes';
import userRoutes from './userRoutes';

export async function registerRoutes(app: Express) {
  app.use(authRoutes);
  app.use(ingredientRoutes);
  app.use(priceHistoryRoutes);
  app.use(productRoutes);
  app.use(recipeRoutes);
  app.use(reportRoutes);
  app.use(userRoutes);
  app.use('/api/fixed-costs', fixedCostRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/settings', settingsRoutes);

  // Work configuration routes
  const workConfigRouter = Router();
  const fixedCostController = new FixedCostController();

  workConfigRouter.use(isAuthenticated);
  workConfigRouter.get(
    '/work-configuration',
    fixedCostController.getWorkConfiguration.bind(fixedCostController)
  );
  workConfigRouter.put(
    '/work-configuration',
    fixedCostController.updateWorkConfiguration.bind(fixedCostController)
  );

  app.use('/api/work-config', workConfigRouter);
}
