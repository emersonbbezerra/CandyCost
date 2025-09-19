import { Router } from 'express';
import { BackupController } from '../controllers/backupController';
import { isAuthenticated } from '../middlewares/authMiddleware';

const router = Router();
const backupController = new BackupController();

// Aplicar middleware de autenticação para todas as rotas
router.use(isAuthenticated);

// Rota para restaurar backup
router.post(
  '/restore-backup',
  backupController.restoreBackup.bind(backupController)
);

export default router;
