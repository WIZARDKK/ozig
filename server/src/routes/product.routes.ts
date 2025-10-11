import express from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware.js';

const router = express.Router();
const productController = new ProductController();

// Get products (CASHIER and MANAGER can view)
router.get(
  '/',
  authenticateToken,
  requirePermission('view_products'),
  productController.getProducts.bind(productController)
);

// Get single product (CASHIER and MANAGER can view)
router.get(
  '/:id',
  authenticateToken,
  requirePermission('view_products'),
  productController.getProduct.bind(productController)
);

// Create product (MANAGER only)
router.post(
  '/',
  authenticateToken,
  requirePermission('manage_products'),
  productController.createProduct.bind(productController)
);

// Update product (MANAGER only)
router.put(
  '/:id',
  authenticateToken,
  requirePermission('manage_products'),
  productController.updateProduct.bind(productController)
);

// Delete product (MANAGER only)
router.delete(
  '/:id',
  authenticateToken,
  requirePermission('manage_products'),
  productController.deleteProduct.bind(productController)
);

// Get categories (CASHIER and MANAGER can view)
router.get(
  '/categories/list',
  authenticateToken,
  requirePermission('view_products'),
  productController.getCategories.bind(productController)
);

// Create category (MANAGER only)
router.post(
  '/categories',
  authenticateToken,
  requirePermission('manage_products'),
  productController.createCategory.bind(productController)
);

// Update category (MANAGER only)
router.put(
  '/categories/:id',
  authenticateToken,
  requirePermission('manage_products'),
  productController.updateCategory.bind(productController)
);

// Delete category (MANAGER only)
router.delete(
  '/categories/:id',
  authenticateToken,
  requirePermission('manage_products'),
  productController.deleteCategory.bind(productController)
);

// Update inventory (MANAGER only)
router.put(
  '/:id/inventory',
  authenticateToken,
  requirePermission('manage_products'),
  productController.updateInventory.bind(productController)
);

// Get low stock products (MANAGER only)
router.get(
  '/inventory/low-stock',
  authenticateToken,
  requirePermission('manage_inventory'),
  productController.getLowStockProducts.bind(productController)
);

export { router as productRoutes };