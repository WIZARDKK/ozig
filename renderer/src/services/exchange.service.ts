import { Exchange, ExchangeFilters, ExchangeResponse } from '../types/exchange.types';
import { authService } from './auth.service';

const API_BASE_URL = 'http://localhost:4000/api';

class ExchangeService {
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

  // Generate exchange number
  generateExchangeNumber(): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const timeStr = now.getTime().toString().slice(-6);
    return `EXC-${dateStr}-${timeStr}`;
  }

  // Get order by order number for exchange
  async getOrderForExchange(orderNumber: string) {
    try {
      return await this.makeRequest(`/exchanges/order/${orderNumber}`);
    } catch (error) {
      console.error('Get order for exchange error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch order'
      };
    }
  }

  // Validate exchange eligibility for single item
  async validateSingleExchange(originalProduct: any, newProduct: any) {
    const originalPrice = Number(originalProduct.price);
    const newPrice = Number(newProduct.price);
    
    // Check if new product is in stock (using inventory data from barcode scan)
    const stockQuantity = newProduct.inventory?.quantity || newProduct.stock || 0;
    if (stockQuantity <= 0) {
      return {
        valid: false,
        reason: `${newProduct.name} is out of stock`
      };
    }

    return {
      valid: true,
      priceDifference: newPrice - originalPrice
    };
  }

  // Validate complete exchange (multiple items)
  validateCompleteExchange(originalItems: any[], newItems: any[]) {
    const originalTotal = originalItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
    const newTotal = newItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
    
    // Exchange policy: Total value of new items must be equal or higher than original items
    if (newTotal < originalTotal) {
      return {
        valid: false,
        reason: `Total value of new items (LKR ${newTotal.toFixed(2)}) is less than original items (LKR ${originalTotal.toFixed(2)}). Please add more items or select higher value products.`,
        originalTotal,
        newTotal,
        shortfall: originalTotal - newTotal
      };
    }

    return {
      valid: true,
      priceDifference: newTotal - originalTotal,
      originalTotal,
      newTotal
    };
  }

  // Legacy method for backward compatibility
  async validateExchange(originalProduct: any, newProduct: any) {
    return this.validateSingleExchange(originalProduct, newProduct);
  }

  // Create exchange
  async createExchange(exchange: Partial<Exchange>): Promise<ExchangeResponse> {
    try {
      return await this.makeRequest('/exchanges', {
        method: 'POST',
        body: JSON.stringify(exchange)
      });
    } catch (error) {
      console.error('Create exchange error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create exchange'
      };
    }
  }

  // Get exchanges with filtering
  async getExchanges(filters: ExchangeFilters = {}): Promise<ExchangeResponse> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const endpoint = `/exchanges${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await this.makeRequest(endpoint);
    } catch (error) {
      console.error('Get exchanges error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch exchanges'
      };
    }
  }

  // Get single exchange
  async getExchange(id: number): Promise<ExchangeResponse> {
    try {
      return await this.makeRequest(`/exchanges/${id}`);
    } catch (error) {
      console.error('Get exchange error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch exchange'
      };
    }
  }

  // Print exchange receipt
  printExchangeReceipt(exchange: Exchange) {
    const receiptContent = this.generateExchangeReceipt(exchange);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Exchange Receipt</title>
            <style>
              body { font-family: 'Courier New', monospace; font-size: 12px; margin: 20px; }
              .receipt { max-width: 300px; margin: 0 auto; }
              .center { text-align: center; }
              .line { border-bottom: 1px dashed #000; margin: 10px 0; }
              .bold { font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="receipt">
              <pre>${receiptContent}</pre>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }

  private generateExchangeReceipt(exchange: Exchange): string {
    const receiptLines = [
      '        COSTUME SHOP',
      '      Exchange Receipt',
      '================================',
      `Exchange #: ${exchange.exchangeNumber}`,
      `Original Order: ${exchange.originalOrderNumber}`,
      `Date: ${new Date(exchange.exchangeDate).toLocaleString()}`,
      '',
      'EXCHANGE DETAILS:',
      '--------------------------------'
    ];

    // Add exchange items
    exchange.items.forEach(item => {
      receiptLines.push(`RETURNED:`);
      receiptLines.push(`${item.originalProduct.name}`);
      receiptLines.push(`  Qty: ${item.quantity} × LKR ${Number(item.originalProduct.price).toFixed(2)}`);
      receiptLines.push('');
      receiptLines.push(`RECEIVED:`);
      receiptLines.push(`${item.newProduct.name}`);
      receiptLines.push(`  Qty: ${item.quantity} × LKR ${Number(item.newProduct.price).toFixed(2)}`);
      
      const priceDiff = Number(item.priceDifference || 0);
      if (priceDiff > 0) {
        receiptLines.push(`  Additional Payment: LKR ${priceDiff.toFixed(2)}`);
      } else if (priceDiff === 0) {
        receiptLines.push(`  Even Exchange`);
      }
      receiptLines.push('--------------------------------');
    });

    const additionalPayment = Number(exchange.additionalPaymentRequired || 0);
    if (additionalPayment > 0) {
      receiptLines.push(`TOTAL ADDITIONAL PAYMENT:`);
      receiptLines.push(`LKR ${additionalPayment.toFixed(2)}`);
      receiptLines.push('================================');
    } else {
      receiptLines.push('NO ADDITIONAL PAYMENT REQUIRED');
      receiptLines.push('================================');
    }

    if (exchange.customerName || exchange.customerPhone) {
      receiptLines.push('CUSTOMER:');
      if (exchange.customerName) receiptLines.push(exchange.customerName);
      if (exchange.customerPhone) receiptLines.push(exchange.customerPhone);
      receiptLines.push('');
    }

    receiptLines.push('Thank you for your business!');
    receiptLines.push('Exchange Policy Applied');
    receiptLines.push('================================');

    return receiptLines.join('\n');
  }

  // Manager Analytics Methods

  // Get exchange analytics dashboard data
  async getExchangeAnalytics(filters: any = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const endpoint = `/exchanges/analytics/dashboard${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('Calling exchange analytics endpoint:', endpoint);
      
      const response = await this.makeRequest(endpoint);
      console.log('Exchange analytics response:', response);
      
      return response;
    } catch (error) {
      console.error('Get exchange analytics error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch analytics'
      };
    }
  }

  // Get detailed analytics
  async getDetailedAnalytics(timeframe: string = 'month') {
    try {
      return await this.makeRequest(`/exchanges/analytics/detailed?timeframe=${timeframe}`);
    } catch (error) {
      console.error('Get detailed analytics error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch detailed analytics'
      };
    }
  }

  // Get pending approvals
  async getPendingApprovals(filters: any = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const endpoint = `/exchanges/approvals/pending${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await this.makeRequest(endpoint);
    } catch (error) {
      console.error('Get pending approvals error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch pending approvals'
      };
    }
  }

  // Process approval (approve or reject)
  async processApproval(id: number, decision: string, notes: string = '') {
    try {
      return await this.makeRequest(`/exchanges/approvals/${id}/process`, {
        method: 'PUT',
        body: JSON.stringify({ decision, notes })
      });
    } catch (error) {
      console.error('Process approval error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process approval'
      };
    }
  }

  // Generate mock policy data (since no backend implementation yet)
  async getExchangePolicies() {
    // Mock data for policies - this would be replaced with real API calls
    return {
      success: true,
      data: [
        {
          id: 1,
          name: 'Standard Exchange Policy',
          description: 'Default exchange policy for regular items',
          isActive: true,
          rules: [
            {
              id: 1,
              type: 'timeLimit',
              condition: 'within_days',
              value: 30,
              description: 'Item must be exchanged within 30 days of purchase',
              isActive: true
            }
          ]
        }
      ]
    };
  }

  // Generate comprehensive reports
  async generateExchangeReport(type: string, dateRange: any = {}) {
    try {
      // This would integrate with the analytics endpoints to generate comprehensive reports
      const analytics = await this.getExchangeAnalytics(dateRange);
      const detailed = await this.getDetailedAnalytics(dateRange.timeframe || 'month');
      
      return {
        success: true,
        data: {
          type,
          dateRange,
          analytics: analytics.data,
          detailed: detailed.data,
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Generate report error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate report'
      };
    }
  }
}

export const exchangeService = new ExchangeService();