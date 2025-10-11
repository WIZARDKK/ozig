const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const {
  getExchanges,
  getExchangeById,
  getOrderForExchange,
  createExchange,
  cancelExchange
} = require('../controllers/exchangeController');

// Get all exchanges with optional filters
router.get('/', authenticateToken, authorizeRoles(['MANAGER', 'CASHIER']), getExchanges);

// Get exchange by ID
router.get('/:id', authenticateToken, authorizeRoles(['MANAGER', 'CASHIER']), getExchangeById);

// Get order details for exchange validation
router.get('/order/:orderNumber', authenticateToken, authorizeRoles(['MANAGER', 'CASHIER']), getOrderForExchange);

// Create new exchange
router.post('/', authenticateToken, authorizeRoles(['MANAGER', 'CASHIER']), createExchange);

// Cancel exchange
router.put('/:id/cancel', authenticateToken, authorizeRoles(['MANAGER', 'CASHIER']), cancelExchange);

module.exports = router;