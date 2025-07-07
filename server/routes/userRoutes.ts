import { Router } from "express";
import * as userController from "../controllers/userController";
import { isAdmin, isAuthenticated } from "../middlewares/authMiddleware";

const router = Router();

router.post('/api/admin/promote-user', isAuthenticated, isAdmin, userController.promoteUser);
router.get('/api/user/profile', isAuthenticated, userController.getUserProfile);
router.put('/api/user/profile', isAuthenticated, userController.updateUserProfile);
router.put('/api/user/change-password', isAuthenticated, userController.changeUserPassword);
router.get('/api/admin/users', isAuthenticated, isAdmin, userController.getAllUsers);
router.put('/api/admin/users/:userId', isAuthenticated, isAdmin, userController.updateUser);
router.put('/api/admin/users/:userId/reset-password', isAuthenticated, isAdmin, userController.resetUserPassword);
router.delete('/api/admin/users/:userId', isAuthenticated, isAdmin, userController.deleteUser);

export default router;
