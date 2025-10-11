import React, { useState, useEffect } from 'react';
import { Barcode, BarcodeFilters } from '../../types/barcode.types';
import { Product } from '../../types/product.types';
import { barcodeService } from '../../services/barcode.service';
import { Plus, Search, Eye, Printer, Download, ToggleLeft, ToggleRight, Trash2, ImageIcon } from 'lucide-react';
import BarcodeForm from './BarcodeForm';
import BarcodePreview from '../../components/BarcodePreview';

interface BarcodeListProps {
  onBarcodeSelect?: (barcode: Barcode) => void;
}

const BarcodeList: React.FC<BarcodeListProps> = ({ onBarcodeSelect }) => {
  const [barcodes, setBarcodes] = useState<Barcode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedBarcode, setSelectedBarcode] = useState<Barcode | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedBarcodes, setSelectedBarcodes] = useState<number[]>([]);
  const [previewBarcodes, setPreviewBarcodes] = useState<Barcode[]>([]);
  const [filters, setFilters] = useState<BarcodeFilters>({
    page: 1,
    limit: 10
  });
  
  // Pagination state
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchBarcodes();
  }, [filters]);

  const fetchBarcodes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await barcodeService.getBarcodes(filters);
      
      if (response.success && response.data) {
        setBarcodes(response.data);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalItems(response.pagination?.total || 0);
      } else {
        setError(response.error || 'Failed to fetch barcodes');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm || undefined,
      page: 1
    }));
  };

  const handleProductSearch = (productName: string) => {
    // For product name search, we'll use a different approach
    // We can extend the search to include product name in the backend
    setFilters(prev => ({
      ...prev,
      search: productName || undefined, // Backend should handle searching both barcode and product name
      page: 1
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleToggleStatus = async (barcode: Barcode) => {
    try {
      const response = await barcodeService.updateBarcodeStatus(barcode.id, !barcode.isActive);
      
      if (response.success) {
        fetchBarcodes(); // Refresh list
      } else {
        setError(response.error || 'Failed to update barcode status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async (barcode: Barcode) => {
    if (!confirm(`Are you sure you want to delete barcode ${barcode.code}?`)) {
      return;
    }

    try {
      const response = await barcodeService.deleteBarcode(barcode.id);
      
      if (response.success) {
        fetchBarcodes(); // Refresh list
      } else {
        setError(response.error || 'Failed to delete barcode');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handlePrint = async (barcode: Barcode) => {
    setPreviewBarcodes([barcode]);
    setShowPreview(true);
  };

  const handleBulkPreview = () => {
    const selectedBarcodesData = barcodes.filter(b => selectedBarcodes.includes(b.id));
    if (selectedBarcodesData.length > 0) {
      setPreviewBarcodes(selectedBarcodesData);
      setShowPreview(true);
    }
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
        alert('Barcodes sent to printer');
        setShowPreview(false);
        fetchBarcodes(); // Refresh to update print counts
      } else {
        setError(response.error || 'Failed to print barcodes');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDownload = async (barcode: Barcode) => {
    try {
      await barcodeService.downloadBarcode(barcode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download barcode');
    }
  };

  const handleEdit = (barcode: Barcode) => {
    setSelectedBarcode(barcode);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedBarcode(null);
    fetchBarcodes(); // Refresh list
  };

  const handleSelectBarcode = (barcodeId: number, checked: boolean) => {
    if (checked) {
      setSelectedBarcodes(prev => [...prev, barcodeId]);
    } else {
      setSelectedBarcodes(prev => prev.filter(id => id !== barcodeId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBarcodes(barcodes.map(b => b.id));
    } else {
      setSelectedBarcodes([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📊 Barcode Management</h2>
          <p className="text-gray-600">Search, filter, and manage product barcodes with advanced filtering options</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedBarcodes.length > 0 && (
            <button
              onClick={handleBulkPreview}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
            >
              <ImageIcon size={20} />
              Preview Selected ({selectedBarcodes.length})
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus size={20} />
            Generate Barcodes
          </button>
        </div>
      </div>

      {/* Advanced Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">🔍 Search & Filters</h3>
        
        {/* Primary Search Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🔍 Search by Barcode Code
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Enter barcode number..."
                value={filters.search || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  search: e.target.value || undefined,
                  page: 1
                }))}
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🏷️ Search by Product Name
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Enter product name..."
                onChange={(e) => handleProductSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product ID
            </label>
            <input
              type="number"
              placeholder="Enter product ID..."
              value={filters.productId || ''}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                productId: e.target.value ? parseInt(e.target.value) : undefined,
                page: 1
              }))}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Barcode Format
            </label>
            <select
              value={filters.format || ''}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                format: e.target.value as any || undefined,
                page: 1
              }))}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Formats</option>
              <option value="EAN13">📊 EAN-13 (Retail Standard)</option>
              <option value="CODE128">🔤 CODE 128 (Versatile)</option>
              <option value="CODE39">📝 CODE 39 (Simple)</option>
              <option value="UPC">🇺🇸 UPC (US Standard)</option>
              <option value="EAN8">📏 EAN-8 (Compact)</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.isActive?.toString() || ''}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                isActive: e.target.value ? e.target.value === 'true' : undefined,
                page: 1
              }))}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="true">✅ Active</option>
              <option value="false">❌ Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Items per Page
            </label>
            <select
              value={filters.limit || 10}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                limit: parseInt(e.target.value),
                page: 1
              }))}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="10">10 items</option>
              <option value="25">25 items</option>
              <option value="50">50 items</option>
              <option value="100">100 items</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({
                  page: 1,
                  limit: 10
                });
              }}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              🔄 Reset Filters
            </button>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchBarcodes}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? '🔄 Searching...' : '🔍 Refresh'}
            </button>
          </div>
        </div>

        {/* Filter Summary & Stats */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Active filters:</span>
              {filters.search && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Search: "{filters.search}"
                </span>
              )}
              {filters.productId && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                  Product ID: {filters.productId}
                </span>
              )}
              {filters.format && (
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                  Format: {filters.format}
                </span>
              )}
              {filters.isActive !== undefined && (
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  Status: {filters.isActive ? 'Active' : 'Inactive'}
                </span>
              )}
              {!filters.search && !filters.productId && !filters.format && filters.isActive === undefined && (
                <span className="text-gray-500">None applied</span>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="bg-gray-100 px-3 py-1 rounded">
                📊 Total Results: <span className="font-medium">{totalItems}</span>
              </span>
              <span className="bg-gray-100 px-3 py-1 rounded">
                📄 Page: <span className="font-medium">{filters.page}</span> of <span className="font-medium">{totalPages}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">Quick Tips</h4>
              <div className="mt-1 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Barcode Search:</strong> Enter full or partial barcode numbers</li>
                  <li><strong>Product Search:</strong> Search by product name, SKU, or description</li>
                  <li><strong>Product ID:</strong> Enter specific product ID for exact matches</li>
                  <li><strong>Bulk Operations:</strong> Select multiple barcodes for batch printing or status changes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Barcodes List */}
      {loading ? (
        <div className="text-center py-8">Loading barcodes...</div>
      ) : barcodes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No barcodes found. Click "Generate Barcodes" to create some.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedBarcodes.length === barcodes.length && barcodes.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Barcode Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Format
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Print Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {barcodes.map((barcode) => (
                  <tr 
                    key={barcode.id} 
                    className={`hover:bg-gray-50 ${selectedBarcodes.includes(barcode.id) ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedBarcodes.includes(barcode.id)}
                        onChange={(e) => handleSelectBarcode(barcode.id, e.target.checked)}
                        className="rounded border-gray-300"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap cursor-pointer"
                      onClick={() => onBarcodeSelect?.(barcode)}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <img
                            className="h-8 w-20 object-contain border rounded"
                            src={barcodeService.generateBarcodeImage(barcode.code, barcode.format)}
                            alt={`Barcode ${barcode.code}`}
                          />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 font-mono">
                            {barcode.code}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {barcode.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-medium text-blue-600">
                        #{barcode.productId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {barcode.product?.name || 'Unknown Product'}
                      </div>
                      <div className="text-xs text-gray-500">
                        SKU: {barcode.product?.sku || 'N/A'}
                      </div>
                      {barcode.product?.price && (
                        <div className="text-xs text-green-600 font-medium">
                          LKR {Number(barcode.product.price).toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {barcode.product?.category?.name || 'Uncategorized'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        barcode.format === 'EAN13' ? 'bg-green-100 text-green-800' :
                        barcode.format === 'CODE128' ? 'bg-blue-100 text-blue-800' :
                        barcode.format === 'UPC' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {barcode.format}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        barcode.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {barcode.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {barcode.printCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(barcode.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(barcode);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrint(barcode);
                          }}
                          className="text-green-600 hover:text-green-900"
                          title="Print Preview"
                        >
                          <ImageIcon size={16} />
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const response = await barcodeService.printBarcodes({
                                barcodeIds: [barcode.id],
                                copies: 1,
                                paperSize: 'A4',
                                includeProductName: true,
                                includePrice: false
                              });
                              if (response.success) {
                                alert('Barcode sent to printer');
                                fetchBarcodes();
                              } else {
                                setError(response.error || 'Failed to print');
                              }
                            } catch (err) {
                              setError('Print failed');
                            }
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Quick Print"
                        >
                          <Printer size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(barcode);
                          }}
                          className="text-purple-600 hover:text-purple-900"
                          title="Download Barcode"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(barcode);
                          }}
                          className={`${
                            barcode.isActive 
                              ? 'text-orange-600 hover:text-orange-900' 
                              : 'text-blue-600 hover:text-blue-900'
                          }`}
                          title={barcode.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {barcode.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(barcode);
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Barcode"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
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
                    Showing page <span className="font-medium">{filters.page}</span> of{' '}
                    <span className="font-medium">{totalPages}</span> ({totalItems} total barcodes)
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handlePageChange(filters.page! - 1)}
                      disabled={filters.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = Math.max(1, Math.min(totalPages - 4, filters.page! - 2)) + i;
                      return (
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
                      );
                    })}
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
          )}
        </div>
      )}

      {/* Barcode Form Modal */}
      {showForm && (
        <BarcodeForm
          barcode={selectedBarcode}
          onClose={handleFormClose}
        />
      )}

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

export default BarcodeList;