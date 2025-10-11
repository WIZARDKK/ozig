import React, { useState, useEffect } from 'react';
import { productService } from '../../services/product.service';
import { Product, Category, ProductFilters } from '../../types/product.types';

interface ProductListProps {
  onEditProduct: (product: Product) => void;
  onAddProduct: () => void;
}

const ProductList: React.FC<ProductListProps> = ({ onEditProduct, onAddProduct }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 20
  });
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [showBulkBarcodeModal, setShowBulkBarcodeModal] = useState(false);
  const [barcodeLoading, setBarcodeLoading] = useState(false);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [filters]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await productService.getProducts(filters);
      if (response.success) {
        setProducts(response.products || []);
        setTotal(response.total || 0);
        setTotalPages(response.totalPages || 0);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 }));
  };

  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const response = await productService.updateProduct(product.id, {
        ...product,
        isActive: !product.isActive
      });
      if (response.success) {
        loadProducts();
      }
    } catch (error) {
      console.error('Failed to toggle product status:', error);
    }
  };

  const handleSelectProduct = (productId: number) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const handleBulkBarcodeGeneration = async () => {
    if (selectedProducts.length === 0) {
      alert('Please select products first');
      return;
    }
    setShowBulkBarcodeModal(true);
  };

  const generateAndPrintBarcodes = async (copies: number = 1) => {
    setBarcodeLoading(true);
    try {
      const barcodeService = await import('../../services/barcode.service');
      
      for (const productId of selectedProducts) {
        try {
          // Generate barcode if not exists
          await barcodeService.barcodeService.generateBarcodes({
            productId: productId,
            format: 'EAN13' as any,
            quantity: 1,
            prefix: 'POS'
          });

          // Get barcodes for printing
          const barcodesResponse = await barcodeService.barcodeService.getBarcodes({
            productId: productId,
            isActive: true
          });

          if (barcodesResponse.success && barcodesResponse.barcodes && barcodesResponse.barcodes.length > 0) {
            const barcodeIds = barcodesResponse.barcodes.map(b => b.id);
            
            await barcodeService.barcodeService.printBarcodes({
              barcodeIds: barcodeIds,
              copies: copies,
              paperSize: 'Label' as const,
              layout: 'grid',
              includeProductName: true,
              includePrice: true
            });
          }
        } catch (error) {
          console.error(`Failed to process barcode for product ${productId}:`, error);
        }
      }

      alert(`Barcode labels for ${selectedProducts.length} products sent to printer!`);
      setSelectedProducts([]);
      setShowBulkBarcodeModal(false);
    } catch (error) {
      alert('Failed to generate/print barcodes. Please try again.');
    } finally {
      setBarcodeLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
          {selectedProducts.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>
        <div className="flex gap-3">
          {selectedProducts.length > 0 && (
            <button
              onClick={handleBulkBarcodeGeneration}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1h4z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10v8a1 1 0 001 1h12a1 1 0 001-1v-8" />
              </svg>
              🖨️ Print Barcodes ({selectedProducts.length})
            </button>
          )}
          <button
            onClick={onAddProduct}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={filters.categoryId || ''}
              onChange={(e) => handleFilterChange('categoryId', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender
            </label>
            <select
              value={filters.gender || ''}
              onChange={(e) => handleFilterChange('gender', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Genders</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="UNISEX">Unisex</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.isActive !== undefined ? filters.isActive.toString() : ''}
              onChange={(e) => handleFilterChange('isActive', e.target.value ? e.target.value === 'true' : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading products...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={products.length > 0 && selectedProducts.length === products.length}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => handleSelectProduct(product.id)}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            SKU: {product.sku}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.category?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        LKR {typeof product.price === 'number' ? product.price.toFixed(2) : parseFloat(product.price || '0').toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${
                          (product.inventory?.quantity || 0) <= (product.inventory?.reorderPoint || 0)
                            ? 'text-red-600 font-medium'
                            : 'text-gray-900'
                        }`}>
                          {product.inventory?.quantity || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => onEditProduct(product)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(product)}
                          className={`${
                            product.isActive
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {product.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(filters.page! - 1)}
                      disabled={filters.page === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(filters.page! + 1)}
                      disabled={filters.page === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{((filters.page! - 1) * filters.limit!) + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(filters.page! * filters.limit!, total)}</span> of{' '}
                        <span className="font-medium">{total}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => handlePageChange(filters.page! - 1)}
                          disabled={filters.page === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === filters.page
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={() => handlePageChange(filters.page! + 1)}
                          disabled={filters.page === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bulk Barcode Generation Modal */}
      {showBulkBarcodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">📊 Bulk Barcode Generation</h3>
              <p className="text-sm text-gray-600 mt-1">
                Generate and print barcodes for {selectedProducts.length} selected product{selectedProducts.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="px-6 py-4">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-800">
                        Industry Standard Process
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        • EAN-13 barcodes will be generated<br/>
                        • Labels optimized for retail stickers<br/>
                        • Includes product name and price
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="labelCopies" className="block text-sm font-medium text-gray-700 mb-2">
                    Number of label copies per product
                  </label>
                  <div className="flex items-center space-x-3">
                    {[1, 2, 3, 5, 10].map(num => (
                      <label key={num} className="flex items-center">
                        <input
                          type="radio"
                          name="labelCopies"
                          value={num}
                          defaultChecked={num === 1}
                          className="mr-1"
                        />
                        <span className="text-sm">{num}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  <p className="font-medium">What happens:</p>
                  <ul className="mt-1 space-y-1 ml-3">
                    <li>• Generate barcode for each product (if not exists)</li>
                    <li>• Format labels for easy application</li>
                    <li>• Send to configured printer</li>
                    <li>• Track print history</li>
                  </ul>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      const copies = parseInt((document.querySelector('input[name="labelCopies"]:checked') as HTMLInputElement)?.value || '1');
                      generateAndPrintBarcodes(copies);
                    }}
                    disabled={barcodeLoading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {barcodeLoading ? 'Processing...' : '🖨️ Generate & Print'}
                  </button>
                  <button
                    onClick={() => setShowBulkBarcodeModal(false)}
                    disabled={barcodeLoading}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                  >
                    Cancel
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

export default ProductList;