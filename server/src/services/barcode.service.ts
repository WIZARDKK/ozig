import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface BarcodeGenerateRequest {
  productId: number;
  format: 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'UPC';
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

export interface BarcodeFilters {
  search?: string;
  productId?: number;
  format?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export class BarcodeService {
  // Generate barcodes for products
  async generateBarcodes(request: BarcodeGenerateRequest, userId: number) {
    try {
      // Verify product exists
      const product = await prisma.product.findUnique({
        where: { id: request.productId },
        include: { category: true }
      });

      if (!product) {
        throw new Error('Product not found');
      }

      const barcodes = [];
      const prefix = request.prefix || '';
      const timestamp = Date.now();

      for (let i = 0; i < request.quantity; i++) {
        // Generate unique barcode code
        const suffix = (timestamp + i).toString();
        const code = prefix + suffix.slice(-8); // Take last 8 digits to keep reasonable length

        // Create barcode record
        const barcode = await prisma.barcode.create({
          data: {
            code,
            productId: request.productId,
            format: request.format,
            isActive: true,
            printCount: 0,
            createdById: userId
          },
          include: {
            product: {
              include: {
                category: {
                  select: { name: true }
                }
              }
            }
          }
        });

        barcodes.push(barcode);
      }

      return {
        success: true,
        barcodes,
        message: `Successfully generated ${request.quantity} barcode(s)`
      };
    } catch (error) {
      console.error('Generate barcodes error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate barcodes'
      };
    }
  }

  // Get barcodes with filtering and pagination
  async getBarcodes(filters: BarcodeFilters = {}) {
    try {
      const {
        search,
        productId,
        format,
        isActive,
        page = 1,
        limit = 10
      } = filters;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (search) {
        where.OR = [
          { code: { contains: search } },
          { product: { name: { contains: search } } },
          { product: { sku: { contains: search } } }
        ];
      }

      if (productId) {
        where.productId = productId;
      }

      if (format) {
        where.format = format;
      }

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      // Get total count
      const total = await prisma.barcode.count({ where });

      // Get barcodes with pagination
      const barcodes = await prisma.barcode.findMany({
        where,
        include: {
          product: {
            include: {
              category: {
                select: { name: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      });

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: barcodes,
        pagination: {
          total,
          totalPages,
          currentPage: page,
          limit
        }
      };
    } catch (error) {
      console.error('Get barcodes error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch barcodes'
      };
    }
  }

  // Get single barcode
  async getBarcode(id: number) {
    try {
      const barcode = await prisma.barcode.findUnique({
        where: { id },
        include: {
          product: {
            include: {
              category: {
                select: { name: true }
              }
            }
          }
        }
      });

      if (!barcode) {
        return {
          success: false,
          error: 'Barcode not found'
        };
      }

      return {
        success: true,
        barcode
      };
    } catch (error) {
      console.error('Get barcode error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch barcode'
      };
    }
  }

  // Update barcode status
  async updateBarcodeStatus(id: number, isActive: boolean, userId: number) {
    try {
      const barcode = await prisma.barcode.update({
        where: { id },
        data: { 
          isActive,
          updatedAt: new Date()
        },
        include: {
          product: {
            include: {
              category: {
                select: { name: true }
              }
            }
          }
        }
      });

      return {
        success: true,
        barcode,
        message: `Barcode ${isActive ? 'activated' : 'deactivated'} successfully`
      };
    } catch (error) {
      console.error('Update barcode status error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update barcode'
      };
    }
  }

  // Delete barcode
  async deleteBarcode(id: number) {
    try {
      // Check if barcode is used in any orders (when order system is implemented)
      // For now, just delete directly

      await prisma.barcode.delete({
        where: { id }
      });

      return {
        success: true,
        message: 'Barcode deleted successfully'
      };
    } catch (error) {
      console.error('Delete barcode error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete barcode'
      };
    }
  }

  // Print barcodes (simulate print job)
  async printBarcodes(request: BarcodePrintRequest, userId: number) {
    try {
      // Get barcodes
      const barcodes = await prisma.barcode.findMany({
        where: {
          id: { in: request.barcodeIds },
          isActive: true
        },
        include: {
          product: {
            include: {
              category: true
            }
          }
        }
      });

      if (barcodes.length === 0) {
        return {
          success: false,
          error: 'No valid barcodes found'
        };
      }

      // Update print counts
      await Promise.all(
        barcodes.map((barcode: any) =>
          prisma.barcode.update({
            where: { id: barcode.id },
            data: {
              printCount: { increment: request.copies },
              lastPrintedAt: new Date()
            }
          })
        )
      );

      // Create print job record (for tracking)
      const printJobId = `PJ-${Date.now()}`;

      // In a real implementation, you would:
      // 1. Generate PDF/image files for printing
      // 2. Send to printer queue
      // 3. Store print job details

      return {
        success: true,
        printJobId,
        message: `Print job created for ${barcodes.length} barcode(s) with ${request.copies} copies each`,
        barcodes
      };
    } catch (error) {
      console.error('Print barcodes error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to print barcodes'
      };
    }
  }

  // Scan barcode and return product info
  async scanBarcode(code: string) {
    try {
      const barcode = await prisma.barcode.findFirst({
        where: {
          code,
          isActive: true
        },
        include: {
          product: {
            include: {
              category: true,
              inventory: {
                select: { quantity: true }
              }
            }
          }
        }
      });

      if (!barcode) {
        return {
          success: false,
          error: 'Barcode not found or inactive'
        };
      }

      // Format product data for response
      const productData = {
        id: barcode.product.id,
        sku: barcode.product.sku,
        name: barcode.product.name,
        price: barcode.product.price,
        category: barcode.product.category.name,
        stock: barcode.product.stock || 0,
        inventory: {
          quantity: barcode.product.inventory?.quantity || barcode.product.stock || 0
        }
      };

      return {
        success: true,
        barcode,
        product: productData
      };
    } catch (error) {
      console.error('Scan barcode error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to scan barcode'
      };
    }
  }

  // Get barcode statistics
  async getBarcodeStats() {
    try {
      const [
        totalBarcodes,
        activeBarcodes,
        productsWithBarcodes,
        recentScans
      ] = await Promise.all([
        prisma.barcode.count(),
        prisma.barcode.count({ where: { isActive: true } }),
        prisma.barcode.groupBy({
          by: ['productId'],
          _count: { productId: true }
        }),
        prisma.barcode.count({
          where: {
            lastPrintedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          }
        })
      ]);

      return {
        success: true,
        stats: {
          totalBarcodes,
          activeBarcodes,
          productsWithBarcodes: productsWithBarcodes.length,
          recentScans
        }
      };
    } catch (error) {
      console.error('Get barcode stats error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch statistics'
      };
    }
  }
}