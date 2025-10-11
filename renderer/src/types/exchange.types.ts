export interface ExchangeItem {
  id: number;
  orderItemId: number; // Reference to original order item
  originalProduct: {
    id: number;
    name: string;
    sku: string;
    price: number;
  };
  newProduct: {
    id: number;
    name: string;
    sku: string;
    price: number;
  };
  quantity: number;
  priceDifference: number; // New product price - original product price
}

export interface OriginalExchangeItem {
  id: number;
  orderItemId: number;
  product: {
    id: number;
    name: string;
    sku: string;
    price: number;
  };
  quantity: number;
  selected: boolean;
}

export interface NewExchangeItem {
  id: number;
  product: {
    id: number;
    name: string;
    sku: string;
    price: number;
  };
  quantity: number;
}

export interface Exchange {
  id?: number;
  exchangeNumber: string;
  originalOrderId: number;
  originalOrderNumber: string;
  customerName?: string;
  customerPhone?: string;
  items: ExchangeItem[];
  totalPriceDifference: number;
  additionalPaymentRequired: number; // If customer needs to pay more
  exchangeDate: Date;
  status: ExchangeStatus;
  notes?: string;
  processedBy: number; // User ID
  createdAt?: Date;
  updatedAt?: Date;
}

export enum ExchangeStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface ExchangeFilters {
  search?: string;
  status?: ExchangeStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ExchangeResponse {
  success: boolean;
  exchange?: Exchange;
  exchanges?: Exchange[];
  total?: number;
  page?: number;
  limit?: number;
  error?: string;
}