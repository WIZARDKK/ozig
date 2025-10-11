import React, { useState, useEffect } from 'react';
import { productService } from '../../services/product.service';
import { Product, Category, ProductFormData, COSTUME_SIZES, COSTUME_COLORS, GENDER_OPTIONS } from '../../types/product.types';
import { BarcodeFormat } from '../../types/barcode.types';

interface ProductFormProps {
  product?: Product | null;
  onSave: () => void;
  onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onSave, onCancel }) => {
  const [formData, setFormData] = useState<ProductFormData>({
    sku: '',
    name: '',
    description: '',
    categoryId: 0,
    brand: '',
    size: '',
    color: '',
    gender: '',
    price: 0,
    costPrice: 0,
    isActive: true,
    quantity: 0,
    minStockLevel: 5,
    maxStockLevel: 100,
    reorderPoint: 10
  });
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showBarcodeOptions, setShowBarcodeOptions] = useState(false);
  const [createdProductId, setCreatedProductId] = useState<number | null>(null);
  const [barcodeSettings, setBarcodeSettings] = useState({
    format: BarcodeFormat.EAN13,
    quantity: 1,
    autoGenerate: true,
    autoPrint: false
  });

  useEffect(() => {
    loadCategories();
    
    if (product) {
      setFormData({
        sku: product.sku,
        name: product.name,
        description: product.description || '',
        categoryId: product.categoryId,
        brand: product.brand || '',
        size: product.size || '',
        color: product.color || '',
        gender: product.gender || '',
        price: product.price,
        costPrice: product.costPrice,
        isActive: product.isActive,
        quantity: product.inventory?.quantity || 0,
        minStockLevel: product.inventory?.minStockLevel || 5,
        maxStockLevel: product.inventory?.maxStockLevel || 100,
        reorderPoint: product.inventory?.reorderPoint || 10
      });
    }
  }, [product]);

  const loadCategories = async () => {
    try {
      const response = await productService.getCategories();
      if (response.success) {
        setCategories(response.categories || []);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    let processedValue: any = value;
    
    if (type === 'checkbox') {
      processedValue = checked;
    } else if (type === 'number') {
      processedValue = parseFloat(value) || 0;
    } else if (name === 'categoryId') {
      // Special handling for categoryId to ensure it's a valid number
      processedValue = parseInt(value) || 0;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.categoryId || formData.categoryId <= 0) newErrors.categoryId = 'Category is required';
    if (formData.price <= 0) newErrors.price = 'Price must be greater than 0';
    if (formData.costPrice <= 0) newErrors.costPrice = 'Cost price must be greater than 0';
    if (formData.quantity < 0) newErrors.quantity = 'Quantity cannot be negative';
    if (formData.minStockLevel < 0) newErrors.minStockLevel = 'Min stock level cannot be negative';
    if (formData.maxStockLevel < 0) newErrors.maxStockLevel = 'Max stock level cannot be negative';
    if (formData.reorderPoint < 0) newErrors.reorderPoint = 'Reorder point cannot be negative';
    if (formData.maxStockLevel < formData.minStockLevel) {
      newErrors.maxStockLevel = 'Max stock level must be greater than min stock level';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      let response: any;
      
      if (product) {
        response = await productService.updateProduct(product.id, formData);
        if (response.success) {
          onSave();
        } else {
          setErrors({ submit: response.error || 'Failed to save product' });
        }
      } else {
        response = await productService.createProduct(formData);
        
        if (response.success && response.product) {
          setCreatedProductId(response.product.id);
          
          if (barcodeSettings.autoGenerate) {
            try {
              await generateBarcodeForNewProduct(response.product.id);
              
              if (barcodeSettings.autoPrint) {
                // Auto-print after generation
                setTimeout(() => {
                  printBarcodeLabels(response.product.id);
                }, 1000);
              }
            } catch (barcodeError) {
              console.warn('Failed to generate barcode:', barcodeError);
            }
          }
          
          // Show barcode options modal
          setShowBarcodeOptions(true);
        } else {
          setErrors({ submit: response.error || 'Failed to save product' });
        }
      }
    } catch (error) {
      console.error('Save product error:', error);
      setErrors({ submit: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const generateBarcodeForNewProduct = async (productId: number) => {
    try {
      const barcodeService = await import('../../services/barcode.service');
      await barcodeService.barcodeService.generateBarcodes({
        productId: productId,
        format: barcodeSettings.format,
        quantity: barcodeSettings.quantity,
        prefix: 'POS'
      });
    } catch (error) {
      console.error('Barcode generation failed:', error);
      throw error;
    }
  };

  const printBarcodeLabels = async (productId: number) => {
    try {
      const barcodeService = await import('../../services/barcode.service');
      
      // Get all barcodes for this product
      const barcodesResponse = await barcodeService.barcodeService.getBarcodes({
        productId: productId,
        isActive: true
      });

      if (barcodesResponse.success && barcodesResponse.barcodes && barcodesResponse.barcodes.length > 0) {
        const barcodeIds = barcodesResponse.barcodes.map(b => b.id);
        
        await barcodeService.barcodeService.printBarcodes({
          barcodeIds: barcodeIds,
          copies: barcodeSettings.quantity,
          paperSize: 'Label' as const,
          layout: 'grid',
          includeProductName: true,
          includePrice: true
        });

        console.log('Barcode labels printed successfully');
      }
    } catch (error) {
      console.error('Barcode printing failed:', error);
    }
  };

  const handleBarcodeSettingChange = (setting: string, value: any) => {
    setBarcodeSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handlePrintLabels = async () => {
    if (createdProductId) {
      setLoading(true);
      try {
        await printBarcodeLabels(createdProductId);
        alert('Barcode labels sent to printer!');
      } catch (error) {
        alert('Failed to print barcode labels. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFinishProduct = () => {
    setShowBarcodeOptions(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4">
          {errors.submit && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h3>
              
              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                  SKU *
                </label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.sku ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter product SKU"
                />
                {errors.sku && <p className="mt-1 text-sm text-red-600">{errors.sku}</p>}
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter product name"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter product description"
                />
              </div>

              <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.categoryId ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>}
              </div>

              <div>
                <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter brand name"
                />
              </div>
            </div>

            {/* Product Attributes */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Product Attributes</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">
                    Size
                  </label>
                  <select
                    id="size"
                    name="size"
                    value={formData.size}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select size</option>
                    {COSTUME_SIZES.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <select
                    id="color"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select color</option>
                    {COSTUME_COLORS.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select gender</option>
                  {GENDER_OPTIONS.map(gender => (
                    <option key={gender} value={gender.toUpperCase()}>{gender}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    Selling Price (LKR) *
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.price ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                  {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
                </div>

                <div>
                  <label htmlFor="costPrice" className="block text-sm font-medium text-gray-700 mb-1">
                    Cost Price (LKR) *
                  </label>
                  <input
                    type="number"
                    id="costPrice"
                    name="costPrice"
                    value={formData.costPrice}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.costPrice ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                  {errors.costPrice && <p className="mt-1 text-sm text-red-600">{errors.costPrice}</p>}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Product is active
                </label>
              </div>
            </div>
          </div>

          {/* Inventory Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory Management</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Stock *
                </label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.quantity ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
                {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
              </div>

              <div>
                <label htmlFor="minStockLevel" className="block text-sm font-medium text-gray-700 mb-1">
                  Min Stock Level *
                </label>
                <input
                  type="number"
                  id="minStockLevel"
                  name="minStockLevel"
                  value={formData.minStockLevel}
                  onChange={handleInputChange}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.minStockLevel ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="5"
                />
                {errors.minStockLevel && <p className="mt-1 text-sm text-red-600">{errors.minStockLevel}</p>}
              </div>

              <div>
                <label htmlFor="maxStockLevel" className="block text-sm font-medium text-gray-700 mb-1">
                  Max Stock Level *
                </label>
                <input
                  type="number"
                  id="maxStockLevel"
                  name="maxStockLevel"
                  value={formData.maxStockLevel}
                  onChange={handleInputChange}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.maxStockLevel ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="100"
                />
                {errors.maxStockLevel && <p className="mt-1 text-sm text-red-600">{errors.maxStockLevel}</p>}
              </div>

              <div>
                <label htmlFor="reorderPoint" className="block text-sm font-medium text-gray-700 mb-1">
                  Reorder Point *
                </label>
                <input
                  type="number"
                  id="reorderPoint"
                  name="reorderPoint"
                  value={formData.reorderPoint}
                  onChange={handleInputChange}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.reorderPoint ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="10"
                />
                {errors.reorderPoint && <p className="mt-1 text-sm text-red-600">{errors.reorderPoint}</p>}
              </div>
            </div>
          </div>

          {/* Barcode Settings - Show only for new products */}
          {!product && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">📊 Barcode Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={barcodeSettings.autoGenerate}
                      onChange={(e) => handleBarcodeSettingChange('autoGenerate', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Auto-generate barcode after creating product
                    </span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={barcodeSettings.autoPrint}
                      onChange={(e) => handleBarcodeSettingChange('autoPrint', e.target.checked)}
                      disabled={!barcodeSettings.autoGenerate}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Auto-print barcode labels
                    </span>
                  </label>
                </div>

                <div>
                  <label htmlFor="barcodeFormat" className="block text-sm font-medium text-gray-700 mb-1">
                    Barcode Format
                  </label>
                  <select
                    id="barcodeFormat"
                    value={barcodeSettings.format}
                    onChange={(e) => handleBarcodeSettingChange('format', e.target.value as BarcodeFormat)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={BarcodeFormat.EAN13}>EAN-13 (Retail Standard)</option>
                    <option value={BarcodeFormat.CODE128}>Code 128 (Versatile)</option>
                    <option value={BarcodeFormat.CODE39}>Code 39 (Simple)</option>
                    <option value={BarcodeFormat.UPC}>UPC (US Standard)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="barcodeQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Labels
                  </label>
                  <input
                    type="number"
                    id="barcodeQuantity"
                    value={barcodeSettings.quantity}
                    onChange={(e) => handleBarcodeSettingChange('quantity', parseInt(e.target.value) || 1)}
                    min="1"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>

      {/* Barcode Options Modal - Shows after product creation */}
      {showBarcodeOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">🎉 Product Created Successfully!</h3>
              <p className="text-sm text-gray-600 mt-1">Your product has been added to inventory.</p>
            </div>

            <div className="px-6 py-4">
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">
                        {barcodeSettings.autoGenerate ? 'Barcode generated automatically' : 'Product ready for barcode generation'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-2">Next Steps:</p>
                  <ul className="space-y-1 ml-4">
                    <li>• Print barcode labels for your products</li>
                    <li>• Stick labels on physical products</li>
                    <li>• Test barcode scanning in POS</li>
                  </ul>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handlePrintLabels}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'Printing...' : '🖨️ Print Labels'}
                  </button>
                  <button
                    onClick={handleFinishProduct}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    ✅ Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductForm;