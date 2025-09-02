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

    console.log('Registering auth routes...');
    app.use('/api/auth', authRoutes);

    console.log('Registering ingredients routes...');
    app.use('/api/ingredients', ingredientRoutes);

    console.log('Registering price history routes...');
    app.use('/api/price-history', priceHistoryRoutes);

    console.log('Registering product routes...');
    app.use('/api/products', productRoutes);

    console.log('Registering recipe routes...');
    app.use('/api/recipes', recipeRoutes);

    console.log('Registering report routes...');
    app.use('/api/reports', reportRoutes);

    console.log('Registering user routes...');
    app.use('/api/users', userRoutes);

    console.log('Registering fixed cost routes...');
    app.use('/api/fixed-costs', fixedCostRoutes);

    console.log('Registering dashboard routes...');
    app.use('/api/dashboard', dashboardRoutes);

    console.log('Registering settings routes...');
    app.use('/api/settings', settingsRoutes);

    console.log('All routes registered successfully'); // Work configuration routes - COMENTADO PARA DEBUG
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
