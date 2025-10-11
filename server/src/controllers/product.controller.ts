import { Request, Response } from 'express';
import { ProductService } from '../services/product.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

const productService = new ProductService();

export class ProductController {
  async getProducts(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        search,
        categoryId,
        size,
        color,
        gender,
        isActive,
        lowStock,
        page = 1,
        limit = 20
      } = req.query;

      const filters = {
        search: search as string,
        categoryId: categoryId ? parseInt(categoryId as string) : undefined,
        size: size as string,
        color: color as string,
        gender: gender as string,
        isActive: isActive ? isActive === 'true' : undefined,
        lowStock: lowStock ? lowStock === 'true' : undefined,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      const result = await productService.getProducts(filters);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Get products controller error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getProduct(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const productId = parseInt(id);

      if (isNaN(productId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid product ID'
        });
      }

      const result = await productService.getProduct(productId);

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Get product controller error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async createProduct(req: AuthenticatedRequest, res: Response) {
    try {
      const productData = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Basic validation
      if (!productData.sku || !productData.name || !productData.categoryId || !productData.price) {
        return res.status(400).json({
          success: false,
          error: 'SKU, name, category, and price are required'
        });
      }

      const result = await productService.createProduct(productData, userId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(201).json(result);
    } catch (error) {
      console.error('Create product controller error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async updateProduct(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const productData = req.body;
      const userId = req.user?.id;
      const productId = parseInt(id);

      if (isNaN(productId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid product ID'
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Basic validation for required fields
      if (productData.categoryId && productData.categoryId <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Valid category is required'
        });
      }

      if (productData.price !== undefined && (isNaN(productData.price) || productData.price <= 0)) {
        return res.status(400).json({
          success: false,
          error: 'Valid price is required'
        });
      }

      if (productData.costPrice !== undefined && (isNaN(productData.costPrice) || productData.costPrice <= 0)) {
        return res.status(400).json({
          success: false,
          error: 'Valid cost price is required'
        });
      }

      const result = await productService.updateProduct(productId, productData, userId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Update product controller error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async deleteProduct(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const productId = parseInt(id);

      if (isNaN(productId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid product ID'
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const result = await productService.deleteProduct(productId, userId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Delete product controller error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getCategories(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await productService.getCategories();

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Get categories controller error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async createCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const { name } = req.body;
      const userId = req.user?.id;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Category name is required'
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const result = await productService.createCategory(name, userId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(201).json(result);
    } catch (error) {
      console.error('Create category controller error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async updateInventory(req: AuthenticatedRequest, res: Response) {
    try {
      const { productId } = req.params;
      const inventoryData = req.body;
      const userId = req.user?.id;
      const id = parseInt(productId);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid product ID'
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const result = await productService.updateInventory(id, inventoryData, userId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Update inventory controller error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getLowStockProducts(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await productService.getLowStockProducts();

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Get low stock products controller error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async updateCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const userId = req.user?.id;

      const categoryId = parseInt(id);
      if (isNaN(categoryId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid category ID'
        });
      }

      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Category name is required'
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const result = await productService.updateCategory(categoryId, name.trim(), userId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Update category controller error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async deleteCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const categoryId = parseInt(id);
      if (isNaN(categoryId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid category ID'
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const result = await productService.deleteCategory(categoryId, userId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Delete category controller error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}