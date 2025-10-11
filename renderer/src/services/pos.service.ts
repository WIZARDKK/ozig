import { Order, CartItem, PaymentMethod, OrderStatus } from '../types/pos.types';
import { authService } from './auth.service';

const API_BASE_URL = 'http://localhost:4000/api';

class POSService {
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

  // Scan barcode and get product info
  async scanBarcode(code: string) {
    try {
      return await this.makeRequest('/barcodes/scan', {
        method: 'POST',
        body: JSON.stringify({ code })
      });
    } catch (error) {
      console.error('Scan barcode error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to scan barcode'
      };
    }
  }

  // Create order
  async createOrder(order: Partial<Order>) {
    try {
      return await this.makeRequest('/pos/orders', {
        method: 'POST',
        body: JSON.stringify(order)
      });
    } catch (error) {
      console.error('Create order error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create order'
      };
    }
  }

  // Get orders with filtering
  async getOrders(filters: any = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const queryString = params.toString();
      const endpoint = queryString ? `/pos/orders?${queryString}` : '/pos/orders';
      
      return await this.makeRequest(endpoint);
    } catch (error) {
      console.error('Get orders error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch orders'
      };
    }
  }

  // Get single order
  async getOrder(id: number) {
    try {
      return await this.makeRequest(`/pos/orders/${id}`);
    } catch (error) {
      console.error('Get order error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch order'
      };
    }
  }

  // Get available discounts
  async getDiscounts() {
    try {
      return await this.makeRequest('/pos/discounts');
    } catch (error) {
      console.error('Get discounts error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch discounts'
      };
    }
  }

  // Apply discount to cart
  calculateDiscount(subtotal: number, discount: any): number {
    if (!discount) return 0;
    
    if (discount.type === 'PERCENTAGE') {
      return Math.round((subtotal * discount.value) / 100 * 100) / 100;
    } else if (discount.type === 'FIXED') {
      return Math.min(discount.value, subtotal);
    }
    
    return 0;
  }

  // Calculate tax
  calculateTax(subtotal: number, discountAmount: number, taxRate: number): number {
    const taxableAmount = subtotal - discountAmount;
    return Math.round(taxableAmount * taxRate / 100 * 100) / 100;
  }

  // Generate receipt
  generateReceipt(order: Order): string {
    const receiptLines = [
      '================================',
      '       COSTUME SHOP POS        ',
      '================================',
      '',
      `Order #: ${order.orderNumber}`,
      `Date: ${new Date(order.createdAt || Date.now()).toLocaleString()}`,
      `Cashier: ${authService.getCurrentUser()?.name}`,
      '',
      '--------------------------------',
      'ITEMS:',
      '--------------------------------'
    ];

    // Add items
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        receiptLines.push(`${item.product?.name || 'Unknown Item'}`);
        receiptLines.push(`  ${item.quantity || 1} x LKR ${Number(item.unitPrice || 0).toFixed(2)} = LKR ${Number(item.totalPrice || 0).toFixed(2)}`);
        if (item.discount && Number(item.discount) > 0) {
          receiptLines.push(`  Discount: -LKR ${Number(item.discount).toFixed(2)}`);
        }
      });
    }

    receiptLines.push('--------------------------------');
    receiptLines.push(`Subtotal: LKR ${Number(order.subtotal || 0).toFixed(2)}`);
    
    if (Number(order.discountAmount || 0) > 0) {
      receiptLines.push(`Discount: -LKR ${Number(order.discountAmount || 0).toFixed(2)}`);
    }
    
    if (Number(order.taxAmount || 0) > 0) {
      receiptLines.push(`Tax: LKR ${Number(order.taxAmount || 0).toFixed(2)}`);
    }
    
    receiptLines.push('================================');
    receiptLines.push(`TOTAL: LKR ${Number(order.total || 0).toFixed(2)}`);
    receiptLines.push('================================');
    receiptLines.push(`Payment: ${order.paymentMethod || 'Cash'}`);
    receiptLines.push(`Amount Paid: LKR ${Number(order.amountPaid || 0).toFixed(2)}`);
    
    if (Number(order.change || 0) > 0) {
      receiptLines.push(`Change: LKR ${Number(order.change || 0).toFixed(2)}`);
    }
    
    receiptLines.push('');
    receiptLines.push('Thank you for your business!');
    receiptLines.push('================================');

    return receiptLines.join('\n');
  }

  // Print receipt
  printReceipt(order: Order) {
    const receiptContent = this.generateReceipt(order);
    
    // Create a new window for printing
    const printWindow = window.open('', '', 'width=300,height=600');
    
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - ${order.orderNumber}</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                font-size: 12px; 
                line-height: 1.2;
                margin: 0; 
                padding: 10px;
                width: 280px;
              }
              pre { 
                white-space: pre-wrap; 
                margin: 0;
              }
              @media print {
                body { margin: 0; padding: 5px; }
              }
            </style>
          </head>
          <body>
            <pre>${receiptContent}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }

  // Get POS statistics
  async getPOSStats() {
    try {
      return await this.makeRequest('/pos/stats');
    } catch (error) {
      console.error('Get POS stats error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch statistics'
      };
    }
  }

  // Generate order number
  generateOrderNumber(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.getTime().toString().slice(-6);
    return `POS-${dateStr}-${timeStr}`;
  }
}

export const posService = new POSService();