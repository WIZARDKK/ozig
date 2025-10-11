import React, { useState, useEffect } from 'react';
import { Barcode, BarcodeGenerateRequest, BarcodeFormat } from '../../types/barcode.types';
import { Product } from '../../types/product.types';
import { barcodeService } from '../../services/barcode.service';
import { productService } from '../../services/product.service';
import { X, Printer, Download, Eye, ImageIcon } from 'lucide-react';
import BarcodePreview from '../../components/BarcodePreview';

interface BarcodeFormProps {
  barcode?: Barcode | null;
  onClose: () => void;
}

const BarcodeForm: React.FC<BarcodeFormProps> = ({ barcode, onClose }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewBarcodes, setPreviewBarcodes] = useState<Barcode[]>([]);
  
  const [formData, setFormData] = useState<BarcodeGenerateRequest>({
    productId: 0,
    format: BarcodeFormat.CODE128,
    quantity: 1,
    prefix: ''
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
    
    if (barcode) {
      // Convert barcode product to full Product type if exists
      if (barcode.product) {
        const productData = products.find(p => p.id === barcode.product?.id);
        setSelectedProduct(productData || null);
      }
      setFormData({
        productId: barcode.productId,
        format: barcode.format,
        quantity: 1,
        prefix: ''
      });
    }
  }, [barcode]);

  const fetchProducts = async () => {
    try {
      const response = await productService.getProducts({ limit: 1000 });
      if (response.success && response.products) {
        setProducts(response.products);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productId) {
      setError('Please select a product');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await barcodeService.generateBarcodes(formData);
      
      if (response.success) {
        setSuccess(`Successfully generated ${formData.quantity} barcode(s)`);
        
        // Show preview option
        if (response.barcodes) {
          setPreviewBarcodes(response.barcodes);
          setTimeout(() => {
            setSuccess(null);
          }, 2000);
        } else {
          setTimeout(() => {
            onClose();
          }, 1500);
        }
      } else {
        setError(response.error || 'Failed to generate barcodes');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = (productId: number) => {
    const product = products.find(p => p.id === productId);
    setSelectedProduct(product || null);
    setFormData(prev => ({ ...prev, productId }));
  };

  const handlePrint = async () => {
    if (!barcode) return;
    
    try {
      const response = await barcodeService.printBarcodes({
        barcodeIds: [barcode.id],
        copies: 1,
        paperSize: 'A4',
        includeProductName: true,
        includePrice: false
      });
      
      if (response.success) {
        setSuccess('Barcode sent to printer');
      } else {
        setError(response.error || 'Failed to print barcode');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to print barcode');
    }
  };

  const handleDownload = async () => {
    if (!barcode) return;
    
    try {
      await barcodeService.downloadBarcode(barcode);
      setSuccess('Barcode downloaded');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download barcode');
    }
  };

  const handlePreview = () => {
    if (barcode) {
      setPreviewBarcodes([barcode]);
    } else if (previewBarcodes.length > 0) {
      // Already have generated barcodes to preview
    } else {
      return;
    }
    setShowPreview(true);
  };

  const handlePrintFromPreview = async (barcodesToPrint: Barcode[], options: any) => {
    try {
      const response = await barcodeService.printBarcodes({
        barcodeIds: barcodesToPrint.map(b => b.id),
        copies: options.copies,
        paperSize: options.paperSize,
        includeProductName: options.includeProductName,
        includePrice: options.includePrice
      });
      
      if (response.success) {
        setSuccess('Barcodes sent to printer');
        setShowPreview(false);
      } else {
        setError(response.error || 'Failed to print barcodes');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const isViewMode = !!barcode;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isViewMode ? 'Barcode Details' : 'Generate Barcodes'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex justify-between items-center">
              <span>{success}</span>
              {previewBarcodes.length > 0 && (
                <button
                  onClick={handlePreview}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1 hover:bg-green-700"
                >
                  <ImageIcon size={14} />
                  Preview & Print
                </button>
              )}
            </div>
          )}

          {/* View Mode - Show Barcode Details */}
          {isViewMode && barcode ? (
            <div className="space-y-6">
              {/* Barcode Image */}
              <div className="text-center">
                <div className="inline-block p-4 bg-white border rounded-lg shadow-sm">
                  <img
                    className="h-20 w-60 object-contain"
                    src={barcodeService.generateBarcodeImage(barcode.code, barcode.format)}
                    alt={`Barcode ${barcode.code}`}
                  />
                  <p className="mt-2 text-sm font-mono text-gray-600">{barcode.code}</p>
                </div>
              </div>

              {/* Barcode Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Product</label>
                  <p className="mt-1 text-sm text-gray-900">{barcode.product?.name}</p>
                  <p className="text-sm text-gray-500">{barcode.product?.sku}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Format</label>
                  <p className="mt-1 text-sm text-gray-900">{barcode.format}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      barcode.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {barcode.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Print Count</label>
                  <p className="mt-1 text-sm text-gray-900">{barcode.printCount}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(barcode.createdAt).toLocaleString()}
                  </p>
                </div>
                {barcode.lastPrintedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Printed</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(barcode.lastPrintedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-center space-x-4 pt-4">
                <button
                  onClick={handlePreview}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
                >
                  <ImageIcon size={16} />
                  Preview & Print
                </button>
                <button
                  onClick={handleDownload}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                >
                  <Download size={16} />
                  Download
                </button>
              </div>
            </div>
          ) : (
            /* Generate Mode - Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Product *
                </label>
                <select
                  value={formData.productId}
                  onChange={(e) => handleProductChange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value={0}>Choose a product...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.sku}) - ${product.price}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Product Info */}
              {selectedProduct && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Selected Product</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <span className="ml-2 text-gray-900">{selectedProduct.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">SKU:</span>
                      <span className="ml-2 text-gray-900">{selectedProduct.sku}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Price:</span>
                      <span className="ml-2 text-gray-900">${selectedProduct.price}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Category:</span>
                      <span className="ml-2 text-gray-900">{selectedProduct.category?.name}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Barcode Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Barcode Format
                </label>
                <select
                  value={formData.format}
                  onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value as BarcodeFormat }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={BarcodeFormat.CODE128}>CODE 128 (Recommended)</option>
                  <option value={BarcodeFormat.CODE39}>CODE 39</option>
                  <option value={BarcodeFormat.EAN13}>EAN-13</option>
                  <option value={BarcodeFormat.EAN8}>EAN-8</option>
                  <option value={BarcodeFormat.UPC}>UPC</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  CODE 128 is recommended for retail environments
                </p>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Number of barcodes to generate (1-100)
                </p>
              </div>

              {/* Prefix */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prefix (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., STORE, SALE"
                  value={formData.prefix}
                  onChange={(e) => setFormData(prev => ({ ...prev, prefix: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={10}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Optional prefix to add to generated barcode numbers
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.productId}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Generating...' : 'Generate Barcodes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Barcode Preview Modal */}
      {showPreview && (
        <BarcodePreview
          barcodes={previewBarcodes}
          onClose={() => setShowPreview(false)}
          onPrint={handlePrintFromPreview}
        />
      )}
    </div>
  );
};

export default BarcodeForm;