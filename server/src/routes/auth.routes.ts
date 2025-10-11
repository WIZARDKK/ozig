import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/login', (req, res) => authController.login(req, res));

// Protected routes
router.get('/validate', authenticateToken, (req, res) => authController.validateToken(req, res));
router.post('/change-password', authenticateToken, (req, res) => authController.changePassword(req, res));
router.post('/logout', authenticateToken, (req, res) => authController.logout(req, res));

export { router as authRoutes };