import { Router } from "express";
import * as authController from "../controllers/authController";
import { isAuthenticated } from "../middlewares/authMiddleware";

const router = Router();

router.post('/api/auth/login', authController.login);
router.post('/api/auth/register', authController.register);
router.get('/api/logout', authController.logoutGet);
router.post('/api/auth/logout', authController.logoutPost);
router.get('/api/auth/user', isAuthenticated, authController.getUser);

export default router;
