import { Request, Response } from 'express';
import { BarcodeService, BarcodeGenerateRequest, BarcodePrintRequest, BarcodeFilters } from '../services/barcode.service.js';

const barcodeService = new BarcodeService();

export class BarcodeController {
  // Generate barcodes for products
  async generateBarcodes(req: Request, res: Response) {
    try {
      const { productId, format, quantity, prefix }: BarcodeGenerateRequest = req.body;
      const userId = (req as any).user.id;

      // Validation
      if (!productId || !format || !quantity) {
        return res.status(400).json({
          success: false,
          error: 'Product ID, format, and quantity are required'
        });
      }

      if (quantity < 1 || quantity > 100) {
        return res.status(400).json({
          success: false,
          error: 'Quantity must be between 1 and 100'
        });
      }

      const validFormats = ['CODE128', 'CODE39', 'EAN13', 'EAN8', 'UPC'];
      if (!validFormats.includes(format)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid barcode format'
        });
      }

      const result = await barcodeService.generateBarcodes(
        { productId, format, quantity, prefix },
        userId
      );

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Generate barcodes controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get barcodes with filtering and pagination
  async getBarcodes(req: Request, res: Response) {
    try {
      const {
        search,
        productId,
        format,
        isActive,
        page,
        limit
      } = req.query;

      const filters: BarcodeFilters = {
        search: search as string,
        productId: productId ? Number(productId) : undefined,
        format: format as string,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10
      };

      const result = await barcodeService.getBarcodes(filters);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Get barcodes controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get single barcode
  async getBarcode(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const barcodeId = Number(id);

      if (isNaN(barcodeId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid barcode ID'
        });
      }

      const result = await barcodeService.getBarcode(barcodeId);

      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      console.error('Get barcode controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Update barcode status
  async updateBarcodeStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const userId = (req as any).user.id;

      const barcodeId = Number(id);

      if (isNaN(barcodeId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid barcode ID'
        });
      }

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'isActive must be a boolean'
        });
      }

      const result = await barcodeService.updateBarcodeStatus(barcodeId, isActive, userId);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Update barcode status controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Delete barcode
  async deleteBarcode(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const barcodeId = Number(id);

      if (isNaN(barcodeId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid barcode ID'
        });
      }

      const result = await barcodeService.deleteBarcode(barcodeId);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Delete barcode controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Print barcodes
  async printBarcodes(req: Request, res: Response) {
    try {
      const { barcodeIds, copies, paperSize, layout, includeProductName, includePrice }: BarcodePrintRequest = req.body;
      const userId = (req as any).user.id;

      // Validation
      if (!barcodeIds || !Array.isArray(barcodeIds) || barcodeIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Barcode IDs array is required'
        });
      }

      if (!copies || copies < 1 || copies > 50) {
        return res.status(400).json({
          success: false,
          error: 'Copies must be between 1 and 50'
        });
      }

      const validPaperSizes = ['A4', 'Label', 'Receipt'];
      if (!paperSize || !validPaperSizes.includes(paperSize)) {
        return res.status(400).json({
          success: false,
          error: 'Valid paper size is required (A4, Label, Receipt)'
        });
      }

      const result = await barcodeService.printBarcodes(
        { barcodeIds, copies, paperSize, layout, includeProductName, includePrice },
        userId
      );

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Print barcodes controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Scan barcode and get product info
  async scanBarcode(req: Request, res: Response) {
    try {
      const { code } = req.body;

      if (!code || typeof code !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Barcode code is required'
        });
      }

      const result = await barcodeService.scanBarcode(code.trim());

      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      console.error('Scan barcode controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get barcode statistics
  async getBarcodeStats(req: Request, res: Response) {
    try {
      const result = await barcodeService.getBarcodeStats();

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('Get barcode stats controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}