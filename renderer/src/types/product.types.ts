export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  category: Category;
  categoryId: number;
  brand?: string;
  size?: string;
  color?: string;
  gender?: string;
  price: number;
  costPrice: number;
  isActive: boolean;
  inventory?: Inventory;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  products?: Product[];
  createdAt: string;
  updatedAt: string;
}

export interface Inventory {
  id: number;
  productId: number;
  quantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  updatedAt: string;
}

export interface ProductFormData {
  sku: string;
  name: string;
  description?: string;
  categoryId: number;
  brand?: string;
  size?: string;
  color?: string;
  gender?: string;
  price: number;
  costPrice: number;
  isActive: boolean;
  // Inventory data
  quantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
}

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

export interface ProductResponse {
  success: boolean;
  products?: Product[];
  product?: Product;
  categories?: Category[];
  total?: number;
  totalPages?: number;
  page?: number;
  error?: string;
}

// Size options for Sri Lankan costume shop
export const COSTUME_SIZES = [
  'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL',
  'Free Size', 'Custom'
];

// Color options
export const COSTUME_COLORS = [
  'White', 'Black', 'Red', 'Blue', 'Green', 'Yellow',
  'Pink', 'Purple', 'Orange', 'Brown', 'Gray', 'Gold',
  'Silver', 'Maroon', 'Navy', 'Cream', 'Multi-Color'
];

// Gender options
export const GENDER_OPTIONS = [
  'Male', 'Female', 'Unisex', 'Kids'
];