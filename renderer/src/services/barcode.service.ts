import { 
  Barcode, 
  BarcodeGenerateRequest, 
  BarcodePrintRequest, 
  BarcodeResponse, 
  BarcodeFilters,
  BarcodeScanResult 
} from '../types/barcode.types';
import { authService } from './auth.service';

const API_BASE_URL = 'http://localhost:4000/api';

class BarcodeService {
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

  // Get all barcodes with filtering
  async getBarcodes(filters: BarcodeFilters = {}): Promise<BarcodeResponse> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const queryString = params.toString();
      const endpoint = queryString ? `/barcodes?${queryString}` : '/barcodes';
      
      return await this.makeRequest(endpoint);
    } catch (error) {
      console.error('Get barcodes error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch barcodes'
      };
    }
  }

  // Get single barcode
  async getBarcode(id: number): Promise<BarcodeResponse> {
    try {
      return await this.makeRequest(`/barcodes/${id}`);
    } catch (error) {
      console.error('Get barcode error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch barcode'
      };
    }
  }

  // Generate barcodes for products
  async generateBarcodes(request: BarcodeGenerateRequest): Promise<BarcodeResponse> {
    try {
      return await this.makeRequest('/barcodes/generate', {
        method: 'POST',
        body: JSON.stringify(request)
      });
    } catch (error) {
      console.error('Generate barcodes error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate barcodes'
      };
    }
  }

  // Update barcode status
  async updateBarcodeStatus(id: number, isActive: boolean): Promise<BarcodeResponse> {
    try {
      return await this.makeRequest(`/barcodes/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ isActive })
      });
    } catch (error) {
      console.error('Update barcode status error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update barcode'
      };
    }
  }

  // Delete barcode
  async deleteBarcode(id: number): Promise<BarcodeResponse> {
    try {
      return await this.makeRequest(`/barcodes/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Delete barcode error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete barcode'
      };
    }
  }

  // Print barcodes
  async printBarcodes(request: BarcodePrintRequest): Promise<BarcodeResponse> {
    try {
      return await this.makeRequest('/barcodes/print', {
        method: 'POST',
        body: JSON.stringify(request)
      });
    } catch (error) {
      console.error('Print barcodes error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to print barcodes'
      };
    }
  }

  // Scan barcode and get product info
  async scanBarcode(code: string): Promise<BarcodeScanResult> {
    try {
      const response = await this.makeRequest('/barcodes/scan', {
        method: 'POST',
        body: JSON.stringify({ code })
      });
      
      return {
        code,
        product: response.product,
        isValid: response.success,
        error: response.success ? undefined : response.error
      };
    } catch (error) {
      console.error('Scan barcode error:', error);
      return {
        code,
        isValid: false,
        error: error instanceof Error ? error.message : 'Failed to scan barcode'
      };
    }
  }

  // Generate barcode image data URL for display
  generateBarcodeImage(code: string, format: string = 'CODE128'): string {
    // This will be used with a barcode generation library like JsBarcode
    // For now, return a placeholder or use a service to generate the image
    return `data:image/svg+xml;base64,${btoa(this.createBarcodeSVG(code, format))}`;
  }

  // Create a simple SVG barcode representation
  private createBarcodeSVG(code: string, format: string): string {
    // This is a simplified barcode SVG - in production, use JsBarcode or similar library
    const width = 200;
    const height = 60;
    const bars = this.generateBars(code);
    
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect width="${width}" height="${height}" fill="white"/>`;
    
    // Draw bars
    let x = 10;
    bars.forEach(bar => {
      if (bar === '1') {
        svg += `<rect x="${x}" y="10" width="2" height="30" fill="black"/>`;
      }
      x += 2;
    });
    
    // Add text
    svg += `<text x="${width/2}" y="50" text-anchor="middle" font-family="monospace" font-size="10">${code}</text>`;
    svg += `</svg>`;
    
    return svg;
  }

  // Simple bar pattern generator (for demo purposes)
  private generateBars(code: string): string[] {
    // This is a very simplified version - use proper barcode library in production
    const bars: string[] = [];
    
    // Start pattern
    bars.push('1', '1', '0', '1', '0');
    
    // Encode each character
    for (let char of code) {
      const charCode = char.charCodeAt(0);
      for (let i = 0; i < 6; i++) {
        bars.push((charCode + i) % 2 === 0 ? '1' : '0');
      }
    }
    
    // End pattern
    bars.push('1', '0', '1', '1', '1');
    
    return bars;
  }

  // Download barcode as image
  async downloadBarcode(barcode: Barcode): Promise<void> {
    try {
      const imageUrl = this.generateBarcodeImage(barcode.code, barcode.format);
      
      // Convert data URL to blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `barcode-${barcode.code}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download barcode error:', error);
      throw error;
    }
  }
}

export const barcodeService = new BarcodeService();