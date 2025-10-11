import { Product, ProductFormData, ProductFilters, ProductResponse, Category } from '../types/product.types';
import { authService } from './auth.service';

const API_BASE_URL = 'http://localhost:4000/api';

class ProductService {
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        authService.logout();
        throw new Error('Authentication expired');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Network error');
    }

    return response.json();
  }

  // Products
  async getProducts(filters?: ProductFilters): Promise<ProductResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            queryParams.append(key, String(value));
          }
        });
      }
      
      const endpoint = `/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await this.makeRequest(endpoint);
    } catch (error) {
      console.error('Get products error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch products'
      };
    }
  }

  async getProduct(id: number): Promise<ProductResponse> {
    try {
      return await this.makeRequest(`/products/${id}`);
    } catch (error) {
      console.error('Get product error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch product'
      };
    }
  }

  async createProduct(productData: ProductFormData): Promise<ProductResponse> {
    try {
      return await this.makeRequest('/products', {
        method: 'POST',
        body: JSON.stringify(productData)
      });
    } catch (error) {
      console.error('Create product error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create product'
      };
    }
  }

  async updateProduct(id: number, productData: Partial<ProductFormData>): Promise<ProductResponse> {
    try {
      return await this.makeRequest(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData)
      });
    } catch (error) {
      console.error('Update product error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update product'
      };
    }
  }

  async deleteProduct(id: number): Promise<ProductResponse> {
    try {
      return await this.makeRequest(`/products/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Delete product error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete product'
      };
    }
  }

  // Categories
  async getCategories(): Promise<ProductResponse> {
    try {
      return await this.makeRequest('/products/categories/list');
    } catch (error) {
      console.error('Get categories error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch categories'
      };
    }
  }

  async createCategory(name: string): Promise<ProductResponse> {
    try {
      return await this.makeRequest('/products/categories', {
        method: 'POST',
        body: JSON.stringify({ name })
      });
    } catch (error) {
      console.error('Create category error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create category'
      };
    }
  }

  async updateCategory(id: number, name: string): Promise<ProductResponse> {
    try {
      return await this.makeRequest(`/products/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name })
      });
    } catch (error) {
      console.error('Update category error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update category'
      };
    }
  }

  async deleteCategory(id: number): Promise<ProductResponse> {
    try {
      return await this.makeRequest(`/products/categories/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Delete category error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete category'
      };
    }
  }

  // Inventory
  async updateInventory(productId: number, inventoryData: {
    quantity: number;
    minStockLevel: number;
    maxStockLevel: number;
    reorderPoint: number;
  }): Promise<ProductResponse> {
    try {
      return await this.makeRequest(`/inventory/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(inventoryData)
      });
    } catch (error) {
      console.error('Update inventory error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update inventory'
      };
    }
  }

  async getLowStockProducts(): Promise<ProductResponse> {
    try {
      return await this.makeRequest('/products/inventory/low-stock');
    } catch (error) {
      console.error('Get low stock products error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch low stock products'
      };
    }
  }

  async getProductStats(): Promise<ProductResponse> {
    try {
      return await this.makeRequest('/products/stats');
    } catch (error) {
      console.error('Get product stats error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch product statistics'
      };
    }
  }
}

export const productService = new ProductService();