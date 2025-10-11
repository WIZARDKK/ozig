import express from 'express';
import { BarcodeController } from '../controllers/barcode.controller.js';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware.js';

const router = express.Router();
const barcodeController = new BarcodeController();

// All barcode routes require authentication
router.use(authenticateToken);

// Routes that require MANAGE_PRODUCTS permission (manager only)
router.post('/generate', requirePermission('MANAGE_PRODUCTS'), barcodeController.generateBarcodes.bind(barcodeController));
router.get('/', requirePermission('MANAGE_PRODUCTS'), barcodeController.getBarcodes.bind(barcodeController));
router.get('/:id', requirePermission('MANAGE_PRODUCTS'), barcodeController.getBarcode.bind(barcodeController));
router.put('/:id/status', requirePermission('MANAGE_PRODUCTS'), barcodeController.updateBarcodeStatus.bind(barcodeController));
router.delete('/:id', requirePermission('MANAGE_PRODUCTS'), barcodeController.deleteBarcode.bind(barcodeController));
router.post('/print', requirePermission('MANAGE_PRODUCTS'), barcodeController.printBarcodes.bind(barcodeController));

// Scan barcode - accessible to both managers and cashiers (no additional permission required)
router.post('/scan', barcodeController.scanBarcode.bind(barcodeController));

// Get barcode statistics
router.get('/stats', barcodeController.getBarcodeStats.bind(barcodeController));

export default router;