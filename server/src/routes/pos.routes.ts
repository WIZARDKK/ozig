import { Router } from 'express';
import { POSController } from '../controllers/pos.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();
const posController = new POSController();

// All POS routes require authentication
router.use(authenticateToken);

// Create new order
router.post('/orders', posController.createOrder.bind(posController));

// Get orders with filtering
router.get('/orders', posController.getOrders.bind(posController));

// Get single order
router.get('/orders/:id', posController.getOrder.bind(posController));

// Get available discounts
router.get('/discounts', posController.getDiscounts.bind(posController));

// Get POS statistics
router.get('/stats', posController.getPOSStats.bind(posController));

export default router;