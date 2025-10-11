import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import {
  getExchanges,
  getExchangeById,
  getOrderForExchange,
  createExchange,
  cancelExchange,
  getExchangeAnalytics,
  getDetailedAnalytics,
  getPendingApprovals,
  processApproval
} from '../controllers/exchange.controller.js';

const router = Router();

// All exchange routes require authentication
router.use(authenticateToken);

// Get all exchanges with optional filters
router.get('/', getExchanges);

// Get exchange by ID
router.get('/:id', getExchangeById);

// Get order details for exchange validation
router.get('/order/:orderNumber', getOrderForExchange);

// Create new exchange
router.post('/', createExchange);

// Cancel exchange
router.put('/:id/cancel', cancelExchange);

// Manager analytics endpoints
router.get('/analytics/dashboard', getExchangeAnalytics);
router.get('/analytics/detailed', getDetailedAnalytics);
router.get('/approvals/pending', getPendingApprovals);
router.put('/approvals/:id/process', processApproval);

export { router as exchangeRoutes };