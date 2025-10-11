export interface Barcode {
  id: number;
  code: string;
  productId: number;
  product?: {
    id: number;
    sku: string;
    name: string;
    price: number;
    category: {
      name: string;
    };
  };
  format: BarcodeFormat;
  isActive: boolean;
  printCount: number;
  lastPrintedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export enum BarcodeFormat {
  CODE128 = 'CODE128',
  CODE39 = 'CODE39',
  EAN13 = 'EAN13',
  EAN8 = 'EAN8',
  UPC = 'UPC'
}

export interface BarcodeGenerateRequest {
  productId: number;
  format: BarcodeFormat;
  quantity: number;
  prefix?: string;
}

export interface BarcodePrintRequest {
  barcodeIds: number[];
  copies: number;
  paperSize: 'A4' | 'Label' | 'Receipt';
  layout?: 'grid' | 'single' | 'list';
  includeProductName?: boolean;
  includePrice?: boolean;
}

export interface BarcodeResponse {
  success: boolean;
  barcodes?: Barcode[];
  barcode?: Barcode;
  data?: Barcode[];
  total?: number;
  pagination?: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
  error?: string;
  printJobId?: string;
}

export interface BarcodeFilters {
  search?: string;
  productId?: number;
  format?: BarcodeFormat;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

// Barcode scanning result
export interface BarcodeScanResult {
  code: string;
  product?: {
    id: number;
    sku: string;
    name: string;
    price: number;
    category: string;
    inventory: {
      quantity: number;
    };
  };
  isValid: boolean;
  error?: string;
}