import React, { useState, useEffect } from 'react';
import { Search, Eye, RefreshCw, Calendar, Clock, DollarSign } from 'lucide-react';
import { posService } from '../../services/pos.service';
import { Order, OrderStatus, PaymentMethod } from '../../types/pos.types';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('today');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  useEffect(() => {
    fetchOrders();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    
    return () => clearInterval(interval);
  }, [statusFilter, dateFilter]);

  const fetchOrders = async () => {
    try {
      setError(null);
      
      const filters: any = {};
      
      // Add status filter
      if (statusFilter !== 'all') {
        filters.status = statusFilter.toUpperCase();
      }
      
      // Add date filter
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (dateFilter) {
        case 'today':
          filters.startDate = today.toISOString();
          filters.endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString();
          break;
        case 'week':
          const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          filters.startDate = weekStart.toISOString();
          filters.endDate = now.toISOString();
          break;
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          filters.startDate = monthStart.toISOString();
          filters.endDate = now.toISOString();
          break;
      }

      const response = await posService.getOrders(filters);
      
      if (response.success) {
        let fetchedOrders = response.orders || [];
        
        // Apply search filter locally
        if (searchTerm.trim()) {
          fetchedOrders = fetchedOrders.filter((order: Order) =>
            order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customerPhone?.includes(searchTerm)
          );
        }
        
        // Sort by creation date (newest first)
        fetchedOrders.sort((a: Order, b: Order) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        
        setOrders(fetchedOrders);
      } else {
        setError(response.error || 'Failed to fetch orders');
      }
    } catch (err) {
      setError('Failed to load orders');
      console.error('Fetch orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchOrders();
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // Debounce the search
    setTimeout(fetchOrders, 300);
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig = {
      [OrderStatus.COMPLETED]: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
      [OrderStatus.PENDING]: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      [OrderStatus.CANCELLED]: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig[OrderStatus.PENDING];
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getPaymentMethodBadge = (method: PaymentMethod) => {
    const methodConfig: Record<PaymentMethod, { bg: string; text: string }> = {
      [PaymentMethod.CASH]: { bg: 'bg-green-100', text: 'text-green-800' },
      [PaymentMethod.CARD]: { bg: 'bg-blue-100', text: 'text-blue-800' },
      [PaymentMethod.MOBILE]: { bg: 'bg-purple-100', text: 'text-purple-800' },
      [PaymentMethod.BANK_TRANSFER]: { bg: 'bg-gray-100', text: 'text-gray-800' }
    };
    
    const config = methodConfig[method] || methodConfig[PaymentMethod.CASH];
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        {method}
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
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-600">View and manage customer orders</p>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by order number, customer name, or phone..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
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
                        Loading orders...
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="text-red-600 mb-2">Error loading orders</div>
                      <div className="text-gray-500 text-sm">{error}</div>
                      <button 
                        onClick={handleRefresh}
                        className="mt-2 text-blue-600 hover:text-blue-800"
                      >
                        Try again
                      </button>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="text-gray-400 mb-4">
                        <Search size={48} className="mx-auto mb-4" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                      <p className="text-gray-600">
                        {searchTerm ? 'No orders match your search criteria.' : 'Orders will appear here once customers make purchases.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {order.orderNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.customerName || 'Walk-in Customer'}
                        </div>
                        {order.customerPhone && (
                          <div className="text-sm text-gray-500">{order.customerPhone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        LKR {Number(order.total || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPaymentMethodBadge(order.paymentMethod)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.createdAt ? formatDate(order.createdAt) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleViewOrder(order)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
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

        {/* Order Details Modal */}
        {showOrderDetails && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                    <p className="text-gray-600">{selectedOrder.orderNumber}</p>
                  </div>
                  <button
                    onClick={() => setShowOrderDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Customer Information</h3>
                    <div className="space-y-1 text-sm">
                      <div>{selectedOrder.customerName || 'Walk-in Customer'}</div>
                      {selectedOrder.customerPhone && (
                        <div className="text-gray-600">{selectedOrder.customerPhone}</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Order Information</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span>{getStatusBadge(selectedOrder.status)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payment:</span>
                        <span>{getPaymentMethodBadge(selectedOrder.paymentMethod)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span>{selectedOrder.createdAt ? formatDate(selectedOrder.createdAt) : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Order Items</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                          <div className="flex-1">
                            <div className="font-medium">{item.product?.name || 'Unknown Item'}</div>
                            <div className="text-sm text-gray-600">
                              SKU: {item.product?.sku || 'N/A'} • LKR {Number(item.unitPrice || 0).toFixed(2)} each
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">Qty: {item.quantity}</div>
                            <div className="text-sm text-gray-600">
                              LKR {Number(item.totalPrice || 0).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-4">No items found</div>
                    )}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>LKR {Number(selectedOrder.subtotal || 0).toFixed(2)}</span>
                    </div>
                    {Number(selectedOrder.discountAmount || 0) > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>-LKR {Number(selectedOrder.discountAmount || 0).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>LKR {Number(selectedOrder.taxAmount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-2">
                      <span>Total:</span>
                      <span>LKR {Number(selectedOrder.total || 0).toFixed(2)}</span>
                    </div>
                  </div>

                  {selectedOrder.paymentMethod === PaymentMethod.CASH && (
                    <div className="mt-4 pt-4 border-t border-gray-300 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Amount Paid:</span>
                        <span>LKR {Number(selectedOrder.amountPaid || 0).toFixed(2)}</span>
                      </div>
                      {Number(selectedOrder.change || 0) > 0 && (
                        <div className="flex justify-between font-medium">
                          <span>Change Given:</span>
                          <span>LKR {Number(selectedOrder.change || 0).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;