export interface CartItem {
  id: number;
  productId: number;
  product: {
    id: number;
    sku: string;
    name: string;
    price: number;
    category: {
      name: string;
    };
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: number;
}

export interface Order {
  id?: number;
  orderNumber?: string;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  customerName?: string;
  customerPhone?: string;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change: number;
  status: OrderStatus;
  createdAt?: string;
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  MOBILE = 'MOBILE',
  BANK_TRANSFER = 'BANK_TRANSFER'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Discount {
  id: number;
  name: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minAmount?: number;
  maxAmount?: number;
  isActive: boolean;
}

export interface POSSettings {
  taxRate: number;
  currency: string;
  receiptFooter: string;
  autoCalculateChange: boolean;
  defaultPaymentMethod: PaymentMethod;
}