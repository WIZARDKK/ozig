import React, { useState, useEffect, useRef } from 'react';
import { CartItem, Order, PaymentMethod, OrderStatus, Discount } from '../../types/pos.types';
import { posService } from '../../services/pos.service';
import { barcodeService } from '../../services/barcode.service';
import { 
  ShoppingCart, 
  Scan, 
  Trash2, 
  Plus, 
  Minus, 
  Calculator,
  CreditCard,
  DollarSign,
  Smartphone,
  Building2,
  Receipt,
  RotateCcw,
  Search,
  CheckCircle
} from 'lucide-react';

const PointOfSale: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [scanning, setScanning] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Bill Preview
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);

  // Order calculations
  const [subtotal, setSubtotal] = useState(0);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxRate] = useState(10); // 10% tax
  const [taxAmount, setTaxAmount] = useState(0);
  const [total, setTotal] = useState(0);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [amountPaid, setAmountPaid] = useState(0);
  const [change, setChange] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Discounts
  const [availableDiscounts, setAvailableDiscounts] = useState<Discount[]>([]);
  const [customDiscountPercent, setCustomDiscountPercent] = useState(0);

  // Refs
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const amountPaidRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDiscounts();
  }, []);

  useEffect(() => {
    calculateTotals();
  }, [cart, selectedDiscount, customDiscountPercent]);

  useEffect(() => {
    if (paymentMethod === PaymentMethod.CASH && amountPaid > 0) {
      setChange(Math.max(0, amountPaid - total));
    } else {
      setChange(0);
    }
  }, [amountPaid, total, paymentMethod]);

  const fetchDiscounts = async () => {
    try {
      const response = await posService.getDiscounts();
      if (response.success) {
        setAvailableDiscounts(response.discounts || []);
      }
    } catch (err) {
      console.error('Failed to fetch discounts:', err);
    }
  };

  const calculateTotals = () => {
    const newSubtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
    setSubtotal(newSubtotal);

    let newDiscountAmount = 0;
    if (selectedDiscount) {
      newDiscountAmount = posService.calculateDiscount(newSubtotal, selectedDiscount);
    } else if (customDiscountPercent > 0) {
      newDiscountAmount = (newSubtotal * customDiscountPercent) / 100;
    }
    setDiscountAmount(newDiscountAmount);

    const newTaxAmount = posService.calculateTax(newSubtotal, newDiscountAmount, taxRate);
    setTaxAmount(newTaxAmount);

    const newTotal = newSubtotal - newDiscountAmount + newTaxAmount;
    setTotal(newTotal);

    // Auto-set amount paid for non-cash payments
    if (paymentMethod !== PaymentMethod.CASH) {
      setAmountPaid(newTotal);
    }
  };

  const handleScan = async (code: string) => {
    if (!code.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await barcodeService.scanBarcode(code.trim());
      
      if (result.isValid && result.product) {
        addToCart(result.product);
        setBarcodeInput('');
        setSuccess(`Added ${result.product.name} to cart`);
        setTimeout(() => setSuccess(null), 2000);
      } else {
        setError(result.error || 'Product not found for this barcode');
      }
    } catch (err) {
      setError('Failed to scan barcode');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.productId === product.id);
    
    // Use price as-is from database (no conversion)
    const price = Number(product.price);
    
    if (existingItem) {
      updateQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      const newItem: CartItem = {
        id: Date.now(), // Temporary ID
        productId: product.id,
        product: {
          id: product.id,
          sku: product.sku,
          name: product.name,
          price: price,
          category: { name: product.category }
        },
        quantity: 1,
        unitPrice: price,
        totalPrice: price
      };
      setCart(prev => [...prev, newItem]);
    }
  };

  const updateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, quantity: newQuantity, totalPrice: item.unitPrice * newQuantity }
        : item
    ));
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedDiscount(null);
    setCustomDiscountPercent(0);
    setAmountPaid(0);
    setCustomerName('');
    setCustomerPhone('');
    setBarcodeInput('');
    setError(null);
    setSuccess(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && barcodeInput) {
      handleScan(barcodeInput);
    }
  };

  const processPayment = async () => {
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }

    if (paymentMethod === PaymentMethod.CASH && amountPaid < total) {
      setError('Insufficient payment amount');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const order: Partial<Order> = {
        orderNumber: posService.generateOrderNumber(),
        items: cart.map(item => ({
          ...item,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
          quantity: Number(item.quantity)
        })),
        subtotal: Number(subtotal),
        discountAmount: Number(discountAmount),
        taxAmount: Number(taxAmount),
        total: Number(total),
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        paymentMethod,
        amountPaid: Number(amountPaid),
        change: Number(change),
        status: OrderStatus.COMPLETED
      };

      const response = await posService.createOrder(order);

      if (response.success) {
        setSuccess('Payment processed successfully!');
        
        // Show bill preview instead of immediately printing
        if (response.order) {
          setPreviewOrder(response.order);
          setShowBillPreview(true);
        }
      } else {
        setError(response.error || 'Failed to process payment');
      }
    } catch (err) {
      setError('Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  const startScanning = () => {
    setScanning(true);
    setBarcodeInput('');
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  const stopScanning = () => {
    setScanning(false);
  };

  const handlePrintReceipt = () => {
    if (previewOrder) {
      posService.printReceipt(previewOrder);
      setShowBillPreview(false);
      setPreviewOrder(null);
      
      // Clear cart after printing
      setTimeout(() => {
        clearCart();
        setSuccess(null);
      }, 1000);
    }
  };

  const handleCloseBillPreview = () => {
    setShowBillPreview(false);
    setPreviewOrder(null);
    
    // Clear cart without printing
    setTimeout(() => {
      clearCart();
      setSuccess(null);
    }, 1000);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Panel - Cart and Scanning */}
      <div className="w-1/2 bg-white shadow-lg flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-blue-600 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Point of Sale</h2>
            <div className="flex items-center space-x-2">
              <ShoppingCart size={20} />
              <span>{cart.length} items</span>
            </div>
          </div>
        </div>

        {/* Scanner Section */}
        <div className="p-4 border-b bg-gray-50">
          <div className="space-y-3">
            <div className="flex space-x-2">
              <div className="flex-1">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Scan barcode or enter manually..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>
              <button
                onClick={() => handleScan(barcodeInput)}
                disabled={!barcodeInput || loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Search size={16} />
                Add
              </button>
            </div>

            <div className="flex space-x-2">
              {!scanning ? (
                <button
                  onClick={startScanning}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Scan size={16} />
                  Start Scanner
                </button>
              ) : (
                <button
                  onClick={stopScanning}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2"
                >
                  Stop Scanner
                </button>
              )}
              
              <button
                onClick={clearCart}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <RotateCcw size={16} />
                Clear
              </button>
            </div>

            {scanning && (
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <Scan size={16} className="animate-pulse" />
                  <span className="text-sm font-medium">Scanner Active - Point scanner at barcode</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mx-4 mt-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mx-4 mt-2 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm">
            {success}
          </div>
        )}

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Cart is empty</p>
              <p className="text-sm">Scan a barcode to add items</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                      <p className="text-sm text-gray-600">
                        SKU: {item.product.sku} • LKR {Number(item.unitPrice || 0).toFixed(2)} each
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">LKR {item.totalPrice.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Totals and Payment */}
      <div className="w-1/2 bg-white shadow-lg flex flex-col">
        {/* Totals Section */}
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
          
          {/* Discount Selection */}
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apply Discount
              </label>
              <select
                value={selectedDiscount?.id || ''}
                onChange={(e) => {
                  const discount = availableDiscounts.find(d => d.id === Number(e.target.value));
                  setSelectedDiscount(discount || null);
                  setCustomDiscountPercent(0);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No discount</option>
                {availableDiscounts.map(discount => (
                  <option key={discount.id} value={discount.id}>
                    {discount.name} ({discount.type === 'PERCENTAGE' ? `${discount.value}%` : `$${discount.value}`})
                  </option>
                ))}
              </select>
            </div>
            
            {!selectedDiscount && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={customDiscountPercent}
                  onChange={(e) => setCustomDiscountPercent(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>LKR {subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-LKR {discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax ({taxRate}%):</span>
              <span>LKR {taxAmount.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>LKR {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Customer Name (Optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="tel"
              placeholder="Phone (Optional)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Payment Section */}
        <div className="flex-1 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment</h3>
          
          {/* Payment Method */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentMethod(PaymentMethod.CASH)}
                className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 ${
                  paymentMethod === PaymentMethod.CASH
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-600'
                }`}
              >
                <DollarSign size={20} />
                Cash
              </button>
              <button
                onClick={() => setPaymentMethod(PaymentMethod.CARD)}
                className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 ${
                  paymentMethod === PaymentMethod.CARD
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-600'
                }`}
              >
                <CreditCard size={20} />
                Card
              </button>
              <button
                onClick={() => setPaymentMethod(PaymentMethod.MOBILE)}
                className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 ${
                  paymentMethod === PaymentMethod.MOBILE
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-600'
                }`}
              >
                <Smartphone size={20} />
                Mobile
              </button>
              <button
                onClick={() => setPaymentMethod(PaymentMethod.BANK_TRANSFER)}
                className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 ${
                  paymentMethod === PaymentMethod.BANK_TRANSFER
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-600'
                }`}
              >
                <Building2 size={20} />
                Transfer
              </button>
            </div>
          </div>

          {/* Amount Paid */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount Paid
            </label>
            <input
              ref={amountPaidRef}
              type="number"
              min="0"
              step="0.01"
              value={amountPaid}
              onChange={(e) => setAmountPaid(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium"
              placeholder="0.00"
              disabled={paymentMethod !== PaymentMethod.CASH}
            />
          </div>

          {/* Change */}
          {paymentMethod === PaymentMethod.CASH && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium text-green-800">Change:</span>
                <span className="text-xl font-bold text-green-600">
                  LKR {change.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Process Payment Button */}
          <button
            onClick={processPayment}
            disabled={cart.length === 0 || loading || (paymentMethod === PaymentMethod.CASH && amountPaid < total)}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg font-medium"
          >
            {loading ? (
              <>Processing...</>
            ) : (
              <>
                <Receipt size={20} />
                Process Payment & Print Receipt
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bill Preview Modal */}
      {showBillPreview && previewOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="mb-4 text-center">
              <div className="mb-3">
                <CheckCircle className="mx-auto text-green-500 animate-pulse" size={48} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
              <p className="text-gray-600">Review your receipt before printing:</p>
            </div>

            {/* Receipt Preview */}
            <div className="bg-white p-4 rounded-lg mb-6 border border-gray-300 shadow-inner">
              <div className="text-center mb-4 pb-2 border-b-2 border-dashed border-gray-300">
                <h3 className="font-bold text-xl">COSTUME SHOP</h3>
                <p className="text-sm text-gray-600">Sales Receipt</p>
                <p className="text-xs text-gray-500 mt-1">
                  Order #: {previewOrder.orderNumber || 'N/A'}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(previewOrder.createdAt || Date.now()).toLocaleString()}
                </p>
              </div>

              <div className="border-t border-gray-300 pt-2 mb-2">
                {previewOrder.items?.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm py-1">
                    <div className="flex-1">
                      <div className="font-medium">{item.product.name}</div>
                      <div className="text-xs text-gray-500">
                        {item.quantity} × LKR {Number(item.unitPrice || 0).toFixed(2)}
                      </div>
                    </div>
                    <div className="font-medium">
                      LKR {Number(item.totalPrice || 0).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-300 pt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>LKR {Number(previewOrder.subtotal || 0).toFixed(2)}</span>
                </div>
                {previewOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span>-LKR {Number(previewOrder.discountAmount || 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span>LKR {Number(previewOrder.taxAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-1">
                  <span>Total:</span>
                  <span>LKR {Number(previewOrder.total || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-gray-300 pt-2 mt-2">
                <div className="flex justify-between text-sm">
                  <span>Payment Method:</span>
                  <span className="capitalize">{previewOrder.paymentMethod?.toLowerCase()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Amount Paid:</span>
                  <span>LKR {Number(previewOrder.amountPaid || 0).toFixed(2)}</span>
                </div>
                {previewOrder.change > 0 && (
                  <div className="flex justify-between text-sm font-medium">
                    <span>Change:</span>
                    <span>LKR {Number(previewOrder.change || 0).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {(previewOrder.customerName || previewOrder.customerPhone) && (
                <div className="border-t border-gray-300 pt-2 mt-2">
                  <div className="text-xs text-gray-600">Customer:</div>
                  {previewOrder.customerName && (
                    <div className="text-sm">{previewOrder.customerName}</div>
                  )}
                  {previewOrder.customerPhone && (
                    <div className="text-sm">{previewOrder.customerPhone}</div>
                  )}
                </div>
              )}

              <div className="text-center mt-4 pt-2 border-t border-gray-300">
                <p className="text-xs text-gray-500">Thank you for shopping with us!</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handlePrintReceipt}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Receipt size={18} />
                Print Receipt
              </button>
              <button
                onClick={handleCloseBillPreview}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
              >
                Close Without Printing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointOfSale;