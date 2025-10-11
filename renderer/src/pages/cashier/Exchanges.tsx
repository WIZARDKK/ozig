import React, { useState, useEffect } from 'react';
import { 
  ArrowRightLeft, 
  Search, 
  Eye, 
  RefreshCw, 
  Plus, 
  Minus, 
  X, 
  CheckCircle,
  AlertCircle,
  Receipt,
  Scan,
  ShoppingBag
} from 'lucide-react';
import { exchangeService } from '../../services/exchange.service';
import { barcodeService } from '../../services/barcode.service';
import { productService } from '../../services/product.service';
import { Exchange, ExchangeItem, ExchangeStatus } from '../../types/exchange.types';

const Exchanges: React.FC = () => {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showNewExchange, setShowNewExchange] = useState(false);
  const [showExchangeDetails, setShowExchangeDetails] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState<Exchange | null>(null);

  // New Exchange Form State
  const [originalOrderNumber, setOriginalOrderNumber] = useState('');
  const [originalOrder, setOriginalOrder] = useState<any>(null);
  const [selectedOriginalItems, setSelectedOriginalItems] = useState<any[]>([]);
  const [newItems, setNewItems] = useState<any[]>([]);
  const [exchangeItems, setExchangeItems] = useState<ExchangeItem[]>([]);
  const [newProductBarcode, setNewProductBarcode] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchExchanges();
  }, [statusFilter, dateFilter, customStartDate, customEndDate]);

  const fetchExchanges = async () => {
    try {
      setError(null);
      const filters: any = {};
      
      if (statusFilter !== 'all') {
        filters.status = statusFilter.toUpperCase();
      }

      // Add date filtering
      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate: Date;
        let endDate: Date = new Date(now); // End of today
        
        switch (dateFilter) {
          case 'today':
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
          case 'yesterday':
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setHours(23, 59, 59, 999);
            break;
          case 'this-week':
            startDate = new Date(now);
            const dayOfWeek = startDate.getDay();
            const diff = startDate.getDate() - dayOfWeek;
            startDate = new Date(startDate.setDate(diff));
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
          case 'this-month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            break;
          case 'last-month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            break;
          case 'last-7-days':
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
          case 'last-30-days':
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 30);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
          case 'custom':
            if (customStartDate) {
              startDate = new Date(customStartDate);
              startDate.setHours(0, 0, 0, 0);
            }
            if (customEndDate) {
              endDate = new Date(customEndDate);
              endDate.setHours(23, 59, 59, 999);
            }
            break;
          default:
            startDate = new Date(0); // Beginning of time
        }
        
        if (startDate! && endDate!) {
          filters.startDate = startDate.toISOString();
          filters.endDate = endDate.toISOString();
        }
      }

      const response = await exchangeService.getExchanges(filters);
      
      if (response.success) {
        let fetchedExchanges = response.exchanges || [];
        
        // Apply search filter
        if (searchTerm.trim()) {
          fetchedExchanges = fetchedExchanges.filter((exchange: Exchange) =>
            exchange.exchangeNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            exchange.originalOrderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            exchange.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        setExchanges(fetchedExchanges);
      } else {
        setError(response.error || 'Failed to fetch exchanges');
      }
    } catch (err) {
      setError('Failed to load exchanges');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchExchanges();
  };

  const handleNewExchange = () => {
    setShowNewExchange(true);
    resetNewExchangeForm();
  };

  const resetNewExchangeForm = () => {
    setOriginalOrderNumber('');
    setOriginalOrder(null);
    setSelectedOriginalItems([]);
    setNewItems([]);
    setExchangeItems([]);
    setNewProductBarcode('');
    setFormError(null);
    setSuccess(null);
  };

  const handleFetchOrder = async () => {
    if (!originalOrderNumber.trim()) {
      setFormError('Please enter an order number');
      return;
    }

    setFormLoading(true);
    setFormError(null);

    try {
      const response = await exchangeService.getOrderForExchange(originalOrderNumber);
      
      if (response.success) {
        setOriginalOrder(response.order);
        setFormError(null);
      } else {
        setFormError(response.error || 'Order not found');
        setOriginalOrder(null);
      }
    } catch (err) {
      setFormError('Failed to fetch order');
      setOriginalOrder(null);
    } finally {
      setFormLoading(false);
    }
  };

  const handleScanNewProduct = async () => {
    if (!newProductBarcode.trim()) {
      setFormError('Please enter a barcode');
      return;
    }

    if (selectedOriginalItems.length === 0) {
      setFormError('Please select items to exchange first');
      return;
    }

    setFormLoading(true);
    setFormError(null);

    try {
      const scanResult = await barcodeService.scanBarcode(newProductBarcode);
      
      if (scanResult.isValid && scanResult.product) {
        const validation = await exchangeService.validateSingleExchange(
          selectedOriginalItems[0].product, // Just for stock check
          scanResult.product
        );

        if (validation.valid) {
          // Add to new items list
          const newItem = {
            id: Date.now(),
            product: {
              id: scanResult.product.id,
              name: scanResult.product.name,
              sku: scanResult.product.sku,
              price: scanResult.product.price
            },
            quantity: 1
          };

          setNewItems(prev => [...prev, newItem]);
          setNewProductBarcode('');
          setSuccess('Item added successfully!');
          setTimeout(() => setSuccess(null), 3000);
          
          // Check if exchange is now valid
          const completeValidation = exchangeService.validateCompleteExchange(
            selectedOriginalItems.map(item => ({ ...item.product, quantity: item.quantity })),
            [...newItems, newItem].map(item => ({ ...item.product, quantity: item.quantity }))
          );
          
          if (!completeValidation.valid && completeValidation.shortfall) {
            setFormError(`Need LKR ${Number(completeValidation.shortfall || 0).toFixed(2)} more in value. ${completeValidation.reason}`);
          } else if (completeValidation.valid) {
            setFormError(null);
          }
        } else {
          setFormError(validation.reason || 'Product validation failed');
        }
      } else {
        setFormError(scanResult.error || 'Product not found');
      }
    } catch (err) {
      setFormError('Failed to scan product');
    } finally {
      setFormLoading(false);
    }
  };

  const handleProcessExchange = async () => {
    if (selectedOriginalItems.length === 0) {
      setFormError('Please select items to exchange');
      return;
    }

    if (newItems.length === 0) {
      setFormError('Please add new items for exchange');
      return;
    }

    // Validate the complete exchange
    const validation = exchangeService.validateCompleteExchange(
      selectedOriginalItems.map(item => ({ ...item.product, quantity: item.quantity })),
      newItems.map(item => ({ ...item.product, quantity: item.quantity }))
    );

    if (!validation.valid) {
      setFormError(validation.reason || 'Exchange validation failed');
      return;
    }

    setFormLoading(true);
    setFormError(null);

    try {
      // Create exchange items from the selected items and new items
      const exchangeItemsData: ExchangeItem[] = [];
      
      // Create exchange records for each new product being received
      // All new items are paired with the first original item for simplicity
      // The backend will handle stock updates correctly based on the product IDs
      newItems.forEach((newItem, index) => {
        const originalItem = selectedOriginalItems[0]; // Use first original item as reference
        
        exchangeItemsData.push({
          id: Date.now() + index,
          orderItemId: originalItem.id,
          originalProduct: {
            id: originalItem.product.id,
            name: originalItem.product.name,
            sku: originalItem.product.sku,
            price: originalItem.product.price
          },
          newProduct: {
            id: newItem.product.id,
            name: newItem.product.name,
            sku: newItem.product.sku,
            price: newItem.product.price
          },
          quantity: newItem.quantity,
          priceDifference: (newItem.product.price * newItem.quantity) - (originalItem.product.price / newItems.length)
        });
      });
      
      // Handle additional original items being returned (if multiple items selected)
      selectedOriginalItems.slice(1).forEach((originalItem, index) => {
        exchangeItemsData.push({
          id: Date.now() + newItems.length + index,
          orderItemId: originalItem.id,
          originalProduct: {
            id: originalItem.product.id,
            name: originalItem.product.name,
            sku: originalItem.product.sku,
            price: originalItem.product.price
          },
          newProduct: {
            id: originalItem.product.id, // Same as original to indicate this is just a return
            name: originalItem.product.name,
            sku: originalItem.product.sku,
            price: originalItem.product.price
          },
          quantity: 1,
          priceDifference: 0 // No price difference for pure returns
        });
      });

      const exchange: Partial<Exchange> = {
        exchangeNumber: exchangeService.generateExchangeNumber(),
        originalOrderId: originalOrder.id,
        originalOrderNumber: originalOrder.orderNumber,
        customerName: originalOrder.customerName,
        customerPhone: originalOrder.customerPhone,
        items: exchangeItemsData,
        totalPriceDifference: validation.priceDifference || 0,
        additionalPaymentRequired: Math.max(0, validation.priceDifference || 0),
        exchangeDate: new Date(),
        status: ExchangeStatus.COMPLETED
      };

      const response = await exchangeService.createExchange(exchange);

      if (response.success) {
        setSuccess('Exchange processed successfully!');
        
        // Print receipt
        if (response.exchange) {
          exchangeService.printExchangeReceipt(response.exchange);
        }

        // Reset form and refresh list
        setTimeout(() => {
          setShowNewExchange(false);
          resetNewExchangeForm();
          fetchExchanges();
        }, 2000);
      } else {
        setFormError(response.error || 'Failed to process exchange');
      }
    } catch (err) {
      setFormError('Exchange processing failed');
    } finally {
      setFormLoading(false);
    }
  };

  const removeNewItem = (itemId: number) => {
    setNewItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleViewExchange = (exchange: Exchange) => {
    setSelectedExchange(exchange);
    setShowExchangeDetails(true);
  };

  const getStatusBadge = (status: ExchangeStatus) => {
    const statusConfig = {
      [ExchangeStatus.COMPLETED]: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
      [ExchangeStatus.PENDING]: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      [ExchangeStatus.CANCELLED]: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig[ExchangeStatus.PENDING];
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Exchanges</h1>
            <p className="text-gray-600">Handle costume exchanges and replacements</p>
          </div>
          <button 
            onClick={handleNewExchange}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <ArrowRightLeft size={20} />
            New Exchange
          </button>
        </div>

        {/* Exchange Policy Notice */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex">
            <AlertCircle className="text-blue-400 mr-3 mt-0.5" size={20} />
            <div>
              <h3 className="text-sm font-medium text-blue-800">Exchange Policy</h3>
              <p className="text-sm text-blue-700 mt-1">
                Customers can exchange products for same value or higher value items only. 
                No money is returned for exchanges - only product swaps with optional additional payment.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Date Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">⚡ Quick Date Filters</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setDateFilter('today');
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                dateFilter === 'today'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              📅 Today
            </button>
            <button
              onClick={() => {
                setDateFilter('yesterday');
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                dateFilter === 'yesterday'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              📋 Yesterday
            </button>
            <button
              onClick={() => {
                setDateFilter('this-week');
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                dateFilter === 'this-week'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              📅 This Week
            </button>
            <button
              onClick={() => {
                setDateFilter('this-month');
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                dateFilter === 'this-month'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              🗓️ This Month
            </button>
            <button
              onClick={() => {
                setDateFilter('last-7-days');
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                dateFilter === 'last-7-days'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              🔄 Last 7 Days
            </button>
            <button
              onClick={() => {
                setDateFilter('last-30-days');
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                dateFilter === 'last-30-days'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              📈 Last 30 Days
            </button>
            <button
              onClick={() => {
                setDateFilter('all');
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                dateFilter === 'all'
                  ? 'bg-gray-600 text-white border-gray-600'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              ♾️ All Time
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">🔍 Search & Filter Exchanges</h3>
          
          {/* Primary Search Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Exchanges
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by exchange number, order number, or customer name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status Filter
              </label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="completed">✅ Completed</option>
                <option value="pending">⏳ Pending</option>
                <option value="cancelled">❌ Cancelled</option>
              </select>
            </div>
          </div>

          {/* Date Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📅 Date Filter
              </label>
              <select 
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  if (e.target.value !== 'custom') {
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }
                }}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">📆 Today</option>
                <option value="yesterday">📋 Yesterday</option>
                <option value="this-week">📅 This Week</option>
                <option value="this-month">🗓️ This Month</option>
                <option value="last-month">📊 Last Month</option>
                <option value="last-7-days">🔄 Last 7 Days</option>
                <option value="last-30-days">📈 Last 30 Days</option>
                <option value="custom">🎯 Custom Range</option>
              </select>
            </div>

            {/* Custom Date Range - Show only when 'custom' is selected */}
            {dateFilter === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            <div className="flex items-end">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Filter Summary */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">Active filters:</span>
                {searchTerm && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Search: "{searchTerm}"
                  </span>
                )}
                {statusFilter !== 'all' && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                    Status: {statusFilter}
                  </span>
                )}
                {dateFilter !== 'all' && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    Date: {dateFilter === 'custom' ? `${customStartDate} to ${customEndDate}` : dateFilter}
                  </span>
                )}
                {!searchTerm && statusFilter === 'all' && dateFilter === 'all' && (
                  <span className="text-gray-500">None applied</span>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="bg-gray-100 px-3 py-1 rounded">
                  📊 Total Results: <span className="font-medium">{exchanges.length}</span>
                </span>
                {dateFilter !== 'all' && (
                  <button
                    onClick={() => {
                      setDateFilter('all');
                      setCustomStartDate('');
                      setCustomEndDate('');
                    }}
                    className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs hover:bg-red-200"
                  >
                    Clear Date Filter
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Exchanges Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exchange Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Original Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items Exchanged
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Additional Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="animate-spin mr-2" size={20} />
                        Loading exchanges...
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="text-red-600 mb-2">Error loading exchanges</div>
                      <div className="text-gray-500 text-sm">{error}</div>
                    </td>
                  </tr>
                ) : exchanges.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="text-gray-400 mb-4">
                        <ArrowRightLeft size={48} className="mx-auto mb-4" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No exchanges found</h3>
                      <p className="text-gray-600">
                        Exchange transactions will appear here once processed.
                      </p>
                    </td>
                  </tr>
                ) : (
                  exchanges.map((exchange) => (
                    <tr key={exchange.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {exchange.exchangeNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{exchange.originalOrderNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {exchange.customerName || 'Walk-in Customer'}
                        </div>
                        {exchange.customerPhone && (
                          <div className="text-sm text-gray-500">{exchange.customerPhone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        <div className="space-y-1">
                          {exchange.items && exchange.items.length > 0 ? (
                            (() => {
                              // Group by original products to show exchange summary
                              const groupedForTable = exchange.items.reduce((acc: any, item) => {
                                const originalKey = item.originalProduct?.id || 'unknown';
                                if (!acc[originalKey]) {
                                  acc[originalKey] = {
                                    originalProduct: item.originalProduct,
                                    newProducts: []
                                  };
                                }
                                if (item.newProduct?.id !== item.originalProduct?.id) {
                                  acc[originalKey].newProducts.push({
                                    product: item.newProduct,
                                    quantity: item.quantity
                                  });
                                }
                                return acc;
                              }, {});

                              const groups = Object.values(groupedForTable);
                              const firstGroup = groups[0] as any;
                              
                              return (
                                <div className="text-xs">
                                  {/* Show first returned item */}
                                  <div className="font-medium text-red-600 truncate">
                                    -{firstGroup?.originalProduct?.name}
                                  </div>
                                  
                                  {/* Show new items count or first few items */}
                                  {firstGroup?.newProducts?.length > 0 && (
                                    <div className="space-y-0.5">
                                      {firstGroup.newProducts.slice(0, 2).map((newItem: any, idx: number) => (
                                        <div key={idx} className="font-medium text-green-600 truncate">
                                          +{newItem.product?.name} (Qty: {newItem.quantity})
                                        </div>
                                      ))}
                                      {firstGroup.newProducts.length > 2 && (
                                        <div className="text-green-600 font-medium">
                                          +{firstGroup.newProducts.length - 2} more items
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Show total exchange count */}
                                  <div className="text-gray-500 mt-1">
                                    {exchange.items.length} exchange record{exchange.items.length !== 1 ? 's' : ''}
                                  </div>
                                </div>
                              );
                            })()
                          ) : (
                            <div className="text-gray-500">No items</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {exchange.additionalPaymentRequired > 0 ? (
                          <span className="text-blue-600">
                            LKR {Number(exchange.additionalPaymentRequired || 0).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-green-600">Even Exchange</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(exchange.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {exchange.exchangeDate ? formatDate(exchange.exchangeDate) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleViewExchange(exchange)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* New Exchange Modal */}
        {showNewExchange && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">New Exchange</h2>
                  <button
                    onClick={() => setShowNewExchange(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Success Message */}
                {success && (
                  <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex">
                      <CheckCircle className="text-green-400 mr-2" size={20} />
                      <div className="text-sm text-green-800">{success}</div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {formError && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                      <AlertCircle className="text-red-400 mr-2" size={20} />
                      <div className="text-sm text-red-800">{formError}</div>
                    </div>
                  </div>
                )}

                {/* Step 1: Enter Original Order Number */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Step 1: Find Original Order</h3>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Enter original order number..."
                      value={originalOrderNumber}
                      onChange={(e) => setOriginalOrderNumber(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleFetchOrder}
                      disabled={formLoading}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      <Search size={16} />
                      Find Order
                    </button>
                  </div>
                </div>

                {/* Step 2: Original Order Details */}
                {originalOrder && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Step 2: Original Order Items</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900">Order: {originalOrder.orderNumber}</h4>
                        <p className="text-sm text-gray-600">
                          Customer: {originalOrder.customerName || 'Walk-in Customer'} | 
                          Date: {formatDate(originalOrder.createdAt)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-900">Select items to exchange (multiple selection allowed):</p>
                        {originalOrder.items?.map((item: any) => (
                          <div 
                            key={item.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedOriginalItems.some(selected => selected.id === item.id)
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => {
                              const isSelected = selectedOriginalItems.some(selected => selected.id === item.id);
                              if (isSelected) {
                                setSelectedOriginalItems(prev => prev.filter(selected => selected.id !== item.id));
                              } else {
                                setSelectedOriginalItems(prev => [...prev, { ...item, quantity: 1 }]);
                              }
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={selectedOriginalItems.some(selected => selected.id === item.id)}
                                    onChange={() => {}} // Handled by parent click
                                    className="mr-3"
                                  />
                                  <div>
                                    <div className="font-medium">{item.product.name}</div>
                                    <div className="text-sm text-gray-600">
                                      SKU: {item.product.sku} | Available Qty: {item.quantity} | LKR {Number(item.unitPrice).toFixed(2)} each
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">LKR {Number(item.totalPrice).toFixed(2)}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Scan New Product */}
                {selectedOriginalItems.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Step 3: Scan New Products</h3>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="Scan or enter barcode for new product..."
                        value={newProductBarcode}
                        onChange={(e) => setNewProductBarcode(e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleScanNewProduct}
                        disabled={formLoading}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        <Scan size={16} />
                        Add Item
                      </button>
                    </div>
                    
                    {/* Selected Original Items Summary */}
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Selected Items to Exchange:</h4>
                      {selectedOriginalItems.map((item, index) => (
                        <div key={item.id} className="text-sm text-gray-600">
                          {index + 1}. {item.product.name} - LKR {Number(item.unitPrice).toFixed(2)} x {item.quantity}
                        </div>
                      ))}
                      <div className="text-sm font-medium text-gray-900 mt-2">
                        Total Value: LKR {selectedOriginalItems.reduce((sum, item) => sum + (Number(item.unitPrice) * item.quantity), 0).toFixed(2)}
                      </div>
                    </div>

                    {/* New Items Being Added */}
                    {newItems.length > 0 && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg">
                        <h4 className="text-sm font-medium text-green-900 mb-2">New Items Added:</h4>
                        {newItems.map((item, index) => (
                          <div key={item.id} className="flex justify-between items-center text-sm text-green-700">
                            <span>{index + 1}. {item.product.name} - LKR {Number(item.product.price).toFixed(2)} x {item.quantity}</span>
                            <button
                              onClick={() => setNewItems(prev => prev.filter(i => i.id !== item.id))}
                              className="text-red-600 hover:text-red-800 ml-2"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        <div className="text-sm font-medium text-green-900 mt-2">
                          Total Value: LKR {newItems.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0).toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 4: Exchange Summary */}
                {selectedOriginalItems.length > 0 && newItems.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Step 4: Exchange Summary</h3>
                    
                    {(() => {
                      const validation = exchangeService.validateCompleteExchange(
                        selectedOriginalItems.map(item => ({ ...item.product, quantity: item.quantity })),
                        newItems.map(item => ({ ...item.product, quantity: item.quantity }))
                      );
                      
                      return (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="grid grid-cols-2 gap-6">
                            {/* Original Items */}
                            <div>
                              <h4 className="font-medium text-red-600 mb-2">Returning Items:</h4>
                              <div className="space-y-1">
                                {selectedOriginalItems.map((item, index) => (
                                  <div key={item.id} className="text-sm">
                                    {index + 1}. {item.product.name} (LKR {Number(item.unitPrice).toFixed(2)} x {item.quantity})
                                  </div>
                                ))}
                              </div>
                              <div className="text-sm font-medium text-red-700 mt-2 pt-2 border-t border-red-200">
                                Total: LKR {Number(validation.originalTotal || 0).toFixed(2)}
                              </div>
                            </div>
                            
                            {/* New Items */}
                            <div>
                              <h4 className="font-medium text-green-600 mb-2">Receiving Items:</h4>
                              <div className="space-y-1">
                                {newItems.map((item, index) => (
                                  <div key={item.id} className="text-sm">
                                    {index + 1}. {item.product.name} (LKR {Number(item.product.price).toFixed(2)} x {item.quantity})
                                  </div>
                                ))}
                              </div>
                              <div className="text-sm font-medium text-green-700 mt-2 pt-2 border-t border-green-200">
                                Total: LKR {Number(validation.newTotal || 0).toFixed(2)}
                              </div>
                            </div>
                          </div>
                          
                          {/* Exchange Status */}
                          <div className="mt-4 pt-4 border-t border-gray-300">
                            {validation.valid ? (
                              <div className="flex justify-between items-center">
                                <span className="text-green-600 font-medium">✓ Exchange Valid</span>
                                <div className="text-right">
                                  {(validation.priceDifference || 0) > 0 ? (
                                    <div>
                                      <span className="text-blue-600 font-medium">
                                        Additional Payment: LKR {(validation.priceDifference || 0).toFixed(2)}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-green-600 font-medium">Even Exchange</span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="text-red-600">
                                <span className="font-medium">⚠ Exchange Invalid:</span> {validation.reason}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => setShowNewExchange(false)}
                    className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProcessExchange}
                    disabled={
                      formLoading || 
                      selectedOriginalItems.length === 0 || 
                      newItems.length === 0 ||
                      !exchangeService.validateCompleteExchange(
                        selectedOriginalItems.map(item => ({ ...item.product, quantity: item.quantity })),
                        newItems.map(item => ({ ...item.product, quantity: item.quantity }))
                      ).valid
                    }
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <CheckCircle size={16} />
                    Process Exchange
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Exchange Details Modal */}
        {showExchangeDetails && selectedExchange && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Exchange Details</h2>
                    <p className="text-gray-600">{selectedExchange.exchangeNumber}</p>
                  </div>
                  <button
                    onClick={() => setShowExchangeDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Exchange Info */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Exchange Information</h3>
                    <div className="space-y-1 text-sm">
                      <div><span className="font-medium">Status:</span> {getStatusBadge(selectedExchange.status)}</div>
                      <div><span className="font-medium">Date:</span> {formatDate(selectedExchange.exchangeDate)}</div>
                      <div><span className="font-medium">Original Order:</span> {selectedExchange.originalOrderNumber}</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Customer Information</h3>
                    <div className="space-y-1 text-sm">
                      <div>{selectedExchange.customerName || 'Walk-in Customer'}</div>
                      {selectedExchange.customerPhone && (
                        <div className="text-gray-600">{selectedExchange.customerPhone}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Exchange Items */}
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Exchange Items</h3>
                  
                  {selectedExchange.items && selectedExchange.items.length > 0 ? (
                    <div className="space-y-6">
                      {/* Group items by original product to show multi-item exchanges clearly */}
                      {(() => {
                        // Group items by original product
                        type GroupedItem = {
                          originalProduct: any;
                          newProducts: Array<{
                            product: any;
                            quantity: number;
                            priceDifference: number;
                          }>;
                        };
                        
                        const groupedItems: Record<string, GroupedItem> = selectedExchange.items.reduce((acc: Record<string, GroupedItem>, item) => {
                          const originalKey = `${item.originalProduct?.id}-${item.originalProduct?.name}`;
                          if (!acc[originalKey]) {
                            acc[originalKey] = {
                              originalProduct: item.originalProduct,
                              newProducts: []
                            };
                          }
                          // Only add to new products if it's actually different from the original
                          if (item.newProduct?.id !== item.originalProduct?.id) {
                            acc[originalKey].newProducts.push({
                              product: item.newProduct,
                              quantity: item.quantity || 1,
                              priceDifference: item.priceDifference || 0
                            });
                          }
                          return acc;
                        }, {});

                        return Object.values(groupedItems).map((group: GroupedItem, groupIndex: number) => (
                          <div key={groupIndex} className="bg-gray-50 rounded-lg p-4">
                            {/* Original Item Returned */}
                            <div className="mb-4">
                              <p className="font-medium text-red-600 mb-2">Item Returned:</p>
                              <div className="bg-red-50 border border-red-200 rounded p-3">
                                <p className="text-sm font-medium">{group.originalProduct?.name}</p>
                                <p className="text-xs text-gray-600">
                                  SKU: {group.originalProduct?.sku} • Unit Price: LKR {Number(group.originalProduct?.price || 0).toFixed(2)}
                                </p>
                                <p className="text-xs font-medium text-red-700 mt-1">
                                  Quantity: 1 • Total Value: LKR {Number(group.originalProduct?.price || 0).toFixed(2)}
                                </p>
                              </div>
                            </div>

                            {/* New Items Received */}
                            {group.newProducts.length > 0 && (
                              <div>
                                <p className="font-medium text-green-600 mb-2">
                                  Item{group.newProducts.length > 1 ? 's' : ''} Received ({group.newProducts.length}):
                                </p>
                                <div className="space-y-2">
                                  {group.newProducts.map((newItem: any, itemIndex: number) => (
                                    <div key={itemIndex} className="bg-green-50 border border-green-200 rounded p-3">
                                      <p className="text-sm font-medium">{newItem.product?.name}</p>
                                      <p className="text-xs text-gray-600">
                                        SKU: {newItem.product?.sku} • Unit Price: LKR {Number(newItem.product?.price || 0).toFixed(2)}
                                      </p>
                                      <p className="text-xs font-medium text-green-700 mt-1">
                                        Quantity: {newItem.quantity || 1} • Total Value: LKR {((newItem.product?.price || 0) * (newItem.quantity || 1)).toFixed(2)}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Exchange Summary for this group */}
                            <div className="mt-4 pt-3 border-t border-gray-200">
                              <div className="grid grid-cols-3 gap-4 text-xs">
                                <div>
                                  <span className="font-medium">Returned Value:</span>
                                  <br />
                                  <span className="text-red-600 font-medium">
                                    LKR {Number(group.originalProduct?.price || 0).toFixed(2)}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium">Received Value:</span>
                                  <br />
                                  <span className="text-green-600 font-medium">
                                    LKR {group.newProducts.reduce((sum: number, item: any) => 
                                      sum + ((item.product?.price || 0) * (item.quantity || 1)), 0
                                    ).toFixed(2)}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium">Net Difference:</span>
                                  <br />
                                  {(() => {
                                    const returnedValue = group.originalProduct?.price || 0;
                                    const receivedValue = group.newProducts.reduce((sum: number, item: any) => 
                                      sum + ((item.product?.price || 0) * (item.quantity || 1)), 0
                                    );
                                    const difference = receivedValue - returnedValue;
                                    
                                    return difference > 0 ? (
                                      <span className="text-blue-600 font-medium">
                                        +LKR {difference.toFixed(2)}
                                      </span>
                                    ) : difference < 0 ? (
                                      <span className="text-red-600 font-medium">
                                        LKR {difference.toFixed(2)}
                                      </span>
                                    ) : (
                                      <span className="text-green-600 font-medium">Even Exchange</span>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-4">No items found</div>
                  )}
                </div>

                {/* Payment Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Payment Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Price Difference:</span>
                      <span>LKR {Number(selectedExchange.totalPriceDifference || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-2">
                      <span>Additional Payment:</span>
                      <span className={selectedExchange.additionalPaymentRequired > 0 ? 'text-blue-600' : 'text-green-600'}>
                        {selectedExchange.additionalPaymentRequired > 0 
                          ? `LKR ${Number(selectedExchange.additionalPaymentRequired || 0).toFixed(2)}`
                          : 'None Required'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button
                    onClick={() => setShowExchangeDetails(false)}
                    className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => selectedExchange && exchangeService.printExchangeReceipt(selectedExchange)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Receipt size={16} />
                    Print Receipt
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Exchanges;