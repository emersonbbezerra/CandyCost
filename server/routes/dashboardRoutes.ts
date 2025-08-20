import { Router } from 'express';
import {
  getCostEvolution,
  getDashboardStats,
  getIngredientUpdates,
  getRecentUpdates,
} from '../controllers/dashboardController';

const router = Router();

router.get('/stats', getDashboardStats);
router.get('/recent-updates', getRecentUpdates);
router.get('/ingredient-updates', getIngredientUpdates); // Nova rota específica
router.get('/cost-evolution', getCostEvolution);

export default router;
