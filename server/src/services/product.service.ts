import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to convert Prisma Decimal fields to numbers
const convertDecimalFields = (obj: any) => {
  if (obj && typeof obj === 'object') {
    const converted = { ...obj };
    if (converted.price) converted.price = parseFloat(converted.price.toString());
    if (converted.costPrice) converted.costPrice = parseFloat(converted.costPrice.toString());
    return converted;
  }
  return obj;
};

export interface ProductFilters {
  search?: string;
  categoryId?: number;
  size?: string;
  color?: string;
  gender?: string;
  isActive?: boolean;
  lowStock?: boolean;
  page?: number;
  limit?: number;
}

export class ProductService {
  async getProducts(filters: ProductFilters = {}) {
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
      } = filters;

      const where: any = {};

      // Text search
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { sku: { contains: search } },
          { description: { contains: search } }
        ];
      }

      // Category filter
      if (categoryId) {
        where.categoryId = categoryId;
      }

      // Attribute filters
      if (size) where.size = size;
      if (color) where.color = color;
      if (gender) where.gender = gender;
      if (isActive !== undefined) where.isActive = isActive;

      // Low stock filter
      if (lowStock) {
        where.inventory = {
          quantity: {
            lte: prisma.$queryRaw`inventory.reorderPoint`
          }
        };
      }

      const skip = (page - 1) * limit;

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: true,
            inventory: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: limit
        }),
        prisma.product.count({ where })
      ]);

      // Convert Decimal fields to numbers for frontend consumption
      const convertedProducts = products.map(convertDecimalFields);

      return {
        success: true,
        products: convertedProducts,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Get products service error:', error);
      return {
        success: false,
        error: 'Failed to fetch products'
      };
    }
  }

  async getProduct(id: number) {
    try {
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          category: true,
          inventory: true
        }
      });

      if (!product) {
        return {
          success: false,
          error: 'Product not found'
        };
      }

      return {
        success: true,
        product: convertDecimalFields(product)
      };
    } catch (error) {
      console.error('Get product service error:', error);
      return {
        success: false,
        error: 'Failed to fetch product'
      };
    }
  }

  async createProduct(productData: any, userId: number) {
    try {
      // Check if SKU already exists
      const existingProduct = await prisma.product.findUnique({
        where: { sku: productData.sku }
      });

      if (existingProduct) {
        return {
          success: false,
          error: 'Product with this SKU already exists'
        };
      }

      // Create product with inventory
      const product = await prisma.product.create({
        data: {
          sku: productData.sku,
          name: productData.name,
          description: productData.description,
          categoryId: productData.categoryId,
          brand: productData.brand,
          size: productData.size,
          color: productData.color,
          gender: productData.gender,
          price: productData.price,
          costPrice: productData.costPrice,
          isActive: productData.isActive ?? true,
          inventory: {
            create: {
              quantity: productData.quantity || 0,
              minStockLevel: productData.minStockLevel || 5,
              maxStockLevel: productData.maxStockLevel || 100,
              reorderPoint: productData.reorderPoint || 10
            }
          }
        },
        include: {
          category: true,
          inventory: true
        }
      });

      // Log the action
      await this.logProductAction(userId, 'CREATE', 'Product created', product.id, null, product);

      return {
        success: true,
        product: convertDecimalFields(product)
      };
    } catch (error) {
      console.error('Create product service error:', error);
      return {
        success: false,
        error: error instanceof Error && error.message.includes('Unique constraint') 
          ? 'Product with this SKU already exists'
          : 'Failed to create product'
      };
    }
  }

  async updateProduct(id: number, productData: any, userId: number) {
    try {
      const existingProduct = await prisma.product.findUnique({
        where: { id },
        include: { inventory: true }
      });

      if (!existingProduct) {
        return {
          success: false,
          error: 'Product not found'
        };
      }

      // Check SKU uniqueness if it's being changed
      if (productData.sku && productData.sku !== existingProduct.sku) {
        const skuExists = await prisma.product.findUnique({
          where: { sku: productData.sku }
        });

        if (skuExists) {
          return {
            success: false,
            error: 'Product with this SKU already exists'
          };
        }
      }

      // Update product
      const updatedProduct = await prisma.product.update({
        where: { id },
        data: {
          sku: productData.sku,
          name: productData.name,
          description: productData.description,
          categoryId: productData.categoryId,
          brand: productData.brand,
          size: productData.size,
          color: productData.color,
          gender: productData.gender,
          price: productData.price,
          costPrice: productData.costPrice,
          isActive: productData.isActive
        },
        include: {
          category: true,
          inventory: true
        }
      });

      // Update inventory if provided
      if (existingProduct.inventory && (
        productData.quantity !== undefined ||
        productData.minStockLevel !== undefined ||
        productData.maxStockLevel !== undefined ||
        productData.reorderPoint !== undefined
      )) {
        await prisma.inventory.update({
          where: { productId: id },
          data: {
            quantity: productData.quantity ?? existingProduct.inventory.quantity,
            minStockLevel: productData.minStockLevel ?? existingProduct.inventory.minStockLevel,
            maxStockLevel: productData.maxStockLevel ?? existingProduct.inventory.maxStockLevel,
            reorderPoint: productData.reorderPoint ?? existingProduct.inventory.reorderPoint
          }
        });
      }

      // Log the action
      await this.logProductAction(userId, 'UPDATE', 'Product updated', id, existingProduct, updatedProduct);

      return {
        success: true,
        product: convertDecimalFields(updatedProduct)
      };
    } catch (error) {
      console.error('Update product service error:', error);
      console.error('Product data:', productData);
      console.error('Error details:', error instanceof Error ? error.message : error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update product'
      };
    }
  }

  async deleteProduct(id: number, userId: number) {
    try {
      const existingProduct = await prisma.product.findUnique({
        where: { id }
      });

      if (!existingProduct) {
        return {
          success: false,
          error: 'Product not found'
        };
      }

      // Soft delete by setting isActive to false
      const product = await prisma.product.update({
        where: { id },
        data: { isActive: false }
      });

      // Log the action
      await this.logProductAction(userId, 'DELETE', 'Product deactivated', id, existingProduct, product);

      return {
        success: true,
        message: 'Product deactivated successfully'
      };
    } catch (error) {
      console.error('Delete product service error:', error);
      return {
        success: false,
        error: 'Failed to delete product'
      };
    }
  }

  async getCategories() {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { products: true }
          }
        }
      });

      return {
        success: true,
        categories
      };
    } catch (error) {
      console.error('Get categories service error:', error);
      return {
        success: false,
        error: 'Failed to fetch categories'
      };
    }
  }

  async createCategory(name: string, userId: number) {
    try {
      const existingCategory = await prisma.category.findUnique({
        where: { name }
      });

      if (existingCategory) {
        return {
          success: false,
          error: 'Category with this name already exists'
        };
      }

      const category = await prisma.category.create({
        data: { name }
      });

      // Log the action
      await this.logProductAction(userId, 'CREATE', 'Category created', category.id, null, category);

      return {
        success: true,
        category
      };
    } catch (error) {
      console.error('Create category service error:', error);
      return {
        success: false,
        error: 'Failed to create category'
      };
    }
  }

  async updateCategory(id: number, name: string, userId: number) {
    try {
      const existingCategory = await prisma.category.findUnique({
        where: { id }
      });

      if (!existingCategory) {
        return {
          success: false,
          error: 'Category not found'
        };
      }

      // Check if name is already taken by another category
      if (name !== existingCategory.name) {
        const nameExists = await prisma.category.findUnique({
          where: { name }
        });

        if (nameExists) {
          return {
            success: false,
            error: 'Category with this name already exists'
          };
        }
      }

      const updatedCategory = await prisma.category.update({
        where: { id },
        data: { name }
      });

      // Log the action
      await this.logProductAction(userId, 'UPDATE', 'Category updated', id, existingCategory, updatedCategory);

      return {
        success: true,
        category: updatedCategory
      };
    } catch (error) {
      console.error('Update category service error:', error);
      return {
        success: false,
        error: 'Failed to update category'
      };
    }
  }

  async deleteCategory(id: number, userId: number) {
    try {
      const existingCategory = await prisma.category.findUnique({
        where: { id },
        include: {
          _count: {
            select: { products: true }
          }
        }
      });

      if (!existingCategory) {
        return {
          success: false,
          error: 'Category not found'
        };
      }

      // Check if category has products
      if (existingCategory._count.products > 0) {
        return {
          success: false,
          error: 'Cannot delete category with existing products. Please move or delete the products first.'
        };
      }

      await prisma.category.delete({
        where: { id }
      });

      // Log the action
      await this.logProductAction(userId, 'DELETE', 'Category deleted', id, existingCategory, null);

      return {
        success: true,
        message: 'Category deleted successfully'
      };
    } catch (error) {
      console.error('Delete category service error:', error);
      return {
        success: false,
        error: 'Failed to delete category'
      };
    }
  }

  async updateInventory(productId: number, inventoryData: any, userId: number) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { inventory: true }
      });

      if (!product) {
        return {
          success: false,
          error: 'Product not found'
        };
      }

      if (!product.inventory) {
        return {
          success: false,
          error: 'Product has no inventory record'
        };
      }

      const updatedInventory = await prisma.inventory.update({
        where: { productId },
        data: {
          quantity: inventoryData.quantity,
          minStockLevel: inventoryData.minStockLevel,
          maxStockLevel: inventoryData.maxStockLevel,
          reorderPoint: inventoryData.reorderPoint
        }
      });

      // Log the action
      await this.logProductAction(userId, 'UPDATE', 'Inventory updated', productId, product.inventory, updatedInventory);

      return {
        success: true,
        inventory: updatedInventory
      };
    } catch (error) {
      console.error('Update inventory service error:', error);
      return {
        success: false,
        error: 'Failed to update inventory'
      };
    }
  }

  async getLowStockProducts() {
    try {
      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          inventory: {
            quantity: {
              lte: prisma.inventory.fields.reorderPoint
            }
          }
        },
        include: {
          category: true,
          inventory: true
        },
        orderBy: {
          inventory: {
            quantity: 'asc'
          }
        }
      });

      return {
        success: true,
        products: products.map(convertDecimalFields)
      };
    } catch (error) {
      console.error('Get low stock products service error:', error);
      return {
        success: false,
        error: 'Failed to fetch low stock products'
      };
    }
  }

  private async logProductAction(userId: number, action: string, description: string, entityId: number, oldData?: any, newData?: any) {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          entity: 'PRODUCT',
          entityId,
          oldData: oldData ? JSON.stringify(oldData) : undefined,
          newData: newData ? JSON.stringify(newData) : undefined
        }
      });
    } catch (error) {
      console.error('Failed to log product action:', error);
    }
  }
}