import { Express } from 'express';

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
  try {
    console.log('Starting route registration...');

    app.use('/api/auth', authRoutes);
    app.use('/api/ingredients', ingredientRoutes);
    app.use('/api/price-history', priceHistoryRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/recipes', recipeRoutes);
    app.use('/api/reports', reportRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/fixed-costs', fixedCostRoutes);
    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api/settings', settingsRoutes);

    console.log('Routes registered successfully');

    // Work configuration routes - COMENTADO PARA DEBUG
    // const workConfigRouter = Router();
    // const fixedCostController = new FixedCostController();

    // workConfigRouter.use(isAuthenticated);
    // workConfigRouter.get(
    //   '/work-configuration',
    //   fixedCostController.getWorkConfiguration.bind(fixedCostController)
    // );
    // workConfigRouter.put(
    //   '/work-configuration',
    //   fixedCostController.updateWorkConfiguration.bind(fixedCostController)
    // );

    // app.use('/api/work-config', workConfigRouter);
  } catch (error) {
    console.error('Error registering routes:', error);
    throw error;
  }
}
