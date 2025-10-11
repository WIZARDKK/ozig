import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle, Eye, MessageCircle, User, Calendar, DollarSign, Package, Filter } from 'lucide-react';

interface PendingApproval {
  id: number;
  exchangeId: string;
  requestedBy: string;
  requestedAt: string;
  type: 'high_value' | 'policy_override' | 'bulk_exchange' | 'exceptional_case';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'rejected';
  originalItem: {
    name: string;
    barcode: string;
    price: number;
  };
  exchangeItems: Array<{
    name: string;
    barcode: string;
    price: number;
    quantity: number;
  }>;
  valueDifference: number;
  reason: string;
  notes?: string;
  customerInfo: {
    name: string;
    phone: string;
    membershipLevel: string;
  };
}

const ExchangeApprovals: React.FC = () => {
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    try {
      // Import exchange service
      const { exchangeService } = await import('../../services/exchange.service');
      
      // Fetch real pending approvals from backend
      const response = await exchangeService.getPendingApprovals({
        priority: filterStatus === 'all' ? undefined : filterStatus,
        type: filterType === 'all' ? undefined : filterType
      });
      
      if (response.success && response.data) {
        // Map backend exchange data to approval format
        const mappedApprovals: PendingApproval[] = response.data.map((exchange: any, index: number) => ({
          id: exchange.id,
          exchangeId: exchange.exchangeNumber,
          requestedBy: exchange.user?.name || 'Unknown Staff',
          requestedAt: exchange.exchangeDate,
          type: 'high_value', // Determine based on exchange value
          priority: 'medium', // Could be calculated based on rules
          status: 'pending',
          originalItem: {
            name: exchange.originalOrder?.items[0]?.product?.name || 'Unknown Item',
            barcode: exchange.originalOrder?.items[0]?.product?.sku || 'N/A',
            price: Number(exchange.originalOrder?.items[0]?.product?.price || 0)
          },
          exchangeItems: exchange.items?.map((item: any) => ({
            name: item.newProduct?.name || 'Unknown Product',
            barcode: item.newProduct?.sku || 'N/A',
            price: Number(item.newProduct?.price || 0),
            quantity: item.quantity || 1
          })) || [],
          valueDifference: Number(exchange.totalPriceDifference || 0),
          reason: 'Pending approval required',
          customerInfo: {
            name: exchange.customerName || 'Walk-in Customer',
            phone: exchange.customerPhone || 'N/A',
            membershipLevel: 'Regular'
          }
        }));
        
        setApprovals(mappedApprovals);
      } else {
        // Fallback to mock data if backend fails
        setMockApprovals();
      }
    } catch (error) {
      console.error('Failed to load approvals:', error);
      setMockApprovals();
    }
  };

  const setMockApprovals = () => {
    // Mock data - fallback when backend is unavailable
    const mockApprovals: PendingApproval[] = [
      {
        id: 1,
        exchangeId: 'EX-2024-0001',
        requestedBy: 'John Smith (Cashier)',
        requestedAt: new Date().toISOString(),
        type: 'high_value',
        priority: 'high',
        status: 'pending',
        originalItem: {
          name: 'Designer Jacket',
          barcode: '1234567890123',
          price: 15000
        },
        exchangeItems: [
          {
            name: 'Casual Shirt',
            barcode: '1234567890124',
            price: 3500,
            quantity: 2
          },
          {
            name: 'Jeans',
            barcode: '1234567890125',
            price: 4500,
            quantity: 1
          }
        ],
        valueDifference: -3500,
        reason: 'Customer wants multiple items instead of single expensive item',
        customerInfo: {
          name: 'Sarah Johnson',
          phone: '+94771234567',
          membershipLevel: 'Gold'
        }
      },
      {
        id: 2,
        exchangeId: 'EX-2024-0002',
        requestedBy: 'Mary Davis (Senior Cashier)',
        requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        type: 'policy_override',
        priority: 'medium',
        status: 'pending',
        originalItem: {
          name: 'Sale Dress',
          barcode: '1234567890126',
          price: 8000
        },
        exchangeItems: [
          {
            name: 'Regular Dress',
            barcode: '1234567890127',
            price: 9500,
            quantity: 1
          }
        ],
        valueDifference: 1500,
        reason: 'Customer claims item was defective, beyond 7-day sale policy',
        notes: 'Customer has receipt and item does appear to have manufacturing defect',
        customerInfo: {
          name: 'Emily Wilson',
          phone: '+94771234568',
          membershipLevel: 'Silver'
        }
      },
      {
        id: 3,
        exchangeId: 'EX-2024-0003',
        requestedBy: 'Robert Chen (Cashier)',
        requestedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        type: 'exceptional_case',
        priority: 'urgent',
        status: 'pending',
        originalItem: {
          name: 'Wedding Gown',
          barcode: '1234567890128',
          price: 25000
        },
        exchangeItems: [
          {
            name: 'Cocktail Dress',
            barcode: '1234567890129',
            price: 12000,
            quantity: 1
          },
          {
            name: 'Shoes',
            barcode: '1234567890130',
            price: 8000,
            quantity: 1
          }
        ],
        valueDifference: -5000,
        reason: 'Wedding cancelled, customer extremely distressed',
        notes: 'Customer provided wedding cancellation documentation',
        customerInfo: {
          name: 'Lisa Park',
          phone: '+94771234569',
          membershipLevel: 'Platinum'
        }
      }
    ];

    setApprovals(mockApprovals);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'high_value': return 'High Value';
      case 'policy_override': return 'Policy Override';
      case 'bulk_exchange': return 'Bulk Exchange';
      case 'exceptional_case': return 'Exceptional Case';
      default: return 'Unknown';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'high_value': return 'bg-blue-100 text-blue-800';
      case 'policy_override': return 'bg-yellow-100 text-yellow-800';
      case 'bulk_exchange': return 'bg-purple-100 text-purple-800';
      case 'exceptional_case': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'urgent': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const handleApproval = async (approvalId: number, decision: 'approved' | 'rejected') => {
    setLoading(true);
    try {
      // Import exchange service
      const { exchangeService } = await import('../../services/exchange.service');
      
      // API call to approve/reject
      const backendDecision = decision === 'approved' ? 'COMPLETED' : 'CANCELLED';
      const response = await exchangeService.processApproval(approvalId, backendDecision, approvalNotes);
      
      if (response.success) {
        // Update local state
        setApprovals(prev => prev.map(approval => 
          approval.id === approvalId 
            ? { ...approval, status: decision }
            : approval
        ));
        
        setShowDetails(false);
        setApprovalNotes('');
        
        // Reload approvals to get fresh data
        loadPendingApprovals();
      } else {
        console.error('Failed to process approval:', response.error);
        alert('Failed to process approval: ' + response.error);
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      alert('Error processing approval. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredApprovals = approvals.filter(approval => {
    if (filterStatus !== 'all' && approval.status !== filterStatus) return false;
    if (filterType !== 'all' && approval.type !== filterType) return false;
    return true;
  });

  const pendingCount = approvals.filter(a => a.status === 'pending').length;
  const urgentCount = approvals.filter(a => a.priority === 'urgent' && a.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Exchange Approvals</h3>
          <p className="text-sm text-gray-600">Review and approve exchange requests</p>
        </div>
        <div className="flex space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{pendingCount}</div>
            <div className="text-xs text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{urgentCount}</div>
            <div className="text-xs text-gray-600">Urgent</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="all">All Types</option>
                <option value="high_value">High Value</option>
                <option value="policy_override">Policy Override</option>
                <option value="bulk_exchange">Bulk Exchange</option>
                <option value="exceptional_case">Exceptional Case</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Cards */}
      <div className="space-y-4">
        {filteredApprovals.map((approval) => (
          <div key={approval.id} className="bg-white rounded-lg shadow border">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="font-medium text-gray-900">#{approval.exchangeId}</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(approval.type)}`}>
                      {getTypeLabel(approval.type)}
                    </span>
                    <div className={`flex items-center ${getPriorityColor(approval.priority)}`}>
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      <span className="text-xs font-medium capitalize">{approval.priority}</span>
                    </div>
                    {approval.status === 'pending' && (
                      <Clock className="h-4 w-4 text-yellow-500" />
                    )}
                    {approval.status === 'approved' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {approval.status === 'rejected' && (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Customer</div>
                      <div className="font-medium">{approval.customerInfo.name}</div>
                      <div className="text-xs text-gray-500">{approval.customerInfo.membershipLevel} Member</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Requested By</div>
                      <div className="font-medium">{approval.requestedBy}</div>
                      <div className="text-xs text-gray-500">{new Date(approval.requestedAt).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Value Difference</div>
                      <div className={`font-medium ${approval.valueDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {approval.valueDifference >= 0 ? '+' : ''}LKR {approval.valueDifference.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Original Item</div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="font-medium">{approval.originalItem.name}</div>
                        <div className="text-sm text-gray-600">{approval.originalItem.barcode}</div>
                        <div className="text-sm font-medium text-gray-900">LKR {approval.originalItem.price.toLocaleString()}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Exchange Items ({approval.exchangeItems.length})</div>
                      <div className="space-y-2">
                        {approval.exchangeItems.slice(0, 2).map((item, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex justify-between">
                              <div>
                                <div className="font-medium">{item.name}</div>
                                <div className="text-sm text-gray-600">{item.barcode}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium">Qty: {item.quantity}</div>
                                <div className="text-sm font-medium">LKR {item.price.toLocaleString()}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {approval.exchangeItems.length > 2 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{approval.exchangeItems.length - 2} more items
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-1">Reason</div>
                    <div className="text-sm text-gray-900">{approval.reason}</div>
                    {approval.notes && (
                      <div className="mt-2">
                        <div className="text-sm text-gray-600 mb-1">Additional Notes</div>
                        <div className="text-sm text-gray-900 bg-yellow-50 p-2 rounded">{approval.notes}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => {
                      setSelectedApproval(approval);
                      setShowDetails(true);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Eye size={20} />
                  </button>
                  {approval.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApproval(approval.id, 'approved')}
                        disabled={loading}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApproval(approval.id, 'rejected')}
                        disabled={loading}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredApprovals.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No approvals found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filterStatus !== 'all' || filterType !== 'all' 
              ? 'Try adjusting your filters to see more results.'
              : 'All exchange requests have been processed.'
            }
          </p>
        </div>
      )}

      {/* Detailed Review Modal */}
      {showDetails && selectedApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Exchange Approval Details - #{selectedApproval.exchangeId}
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Information */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Customer Information</h4>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600">Name</div>
                    <div className="font-medium">{selectedApproval.customerInfo.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Phone</div>
                    <div className="font-medium">{selectedApproval.customerInfo.phone}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Membership Level</div>
                    <div className="font-medium">{selectedApproval.customerInfo.membershipLevel}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Request Priority</div>
                    <div className={`font-medium capitalize ${getPriorityColor(selectedApproval.priority)}`}>
                      {selectedApproval.priority}
                    </div>
                  </div>
                </div>
              </div>

              {/* Exchange Details */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Exchange Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Original Item</h5>
                    <div className="border rounded-lg p-4">
                      <div className="font-medium">{selectedApproval.originalItem.name}</div>
                      <div className="text-sm text-gray-600 mt-1">Barcode: {selectedApproval.originalItem.barcode}</div>
                      <div className="text-lg font-bold text-gray-900 mt-2">
                        LKR {selectedApproval.originalItem.price.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Exchange Items</h5>
                    <div className="space-y-2">
                      {selectedApproval.exchangeItems.map((item, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex justify-between">
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-gray-600">{item.barcode}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">Qty: {item.quantity}</div>
                              <div className="font-bold">LKR {(item.price * item.quantity).toLocaleString()}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="text-center p-2 border-t">
                        <div className="text-sm text-gray-600">Total Exchange Value</div>
                        <div className="font-bold">
                          LKR {selectedApproval.exchangeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}
                        </div>
                        <div className={`text-sm font-medium mt-1 ${selectedApproval.valueDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Difference: {selectedApproval.valueDifference >= 0 ? '+' : ''}LKR {selectedApproval.valueDifference.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Approval Notes */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Approval Notes</h4>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Add your approval notes here..."
                  className="w-full border border-gray-300 rounded-lg p-3 h-24 resize-none"
                />
              </div>

              {/* Action Buttons */}
              {selectedApproval.status === 'pending' && (
                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleApproval(selectedApproval.id, 'rejected')}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApproval(selectedApproval.id, 'approved')}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExchangeApprovals;