import React, { useState, useRef } from 'react';
import { BarcodeScanResult } from '../../types/barcode.types';
import { barcodeService } from '../../services/barcode.service';
import { Search, Scan, Package, AlertCircle, CheckCircle } from 'lucide-react';

const BarcodeScanner: React.FC = () => {
  const [scanResult, setScanResult] = useState<BarcodeScanResult | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleScan = async (code: string) => {
    if (!code.trim()) return;

    setLoading(true);
    setError(null);
    setScanResult(null);

    try {
      const result = await barcodeService.scanBarcode(code.trim());
      setScanResult(result);
      
      if (!result.isValid) {
        setError(result.error || 'Invalid barcode');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan barcode');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScan(manualCode);
  };

  const handleKeyboardScan = (e: React.KeyboardEvent) => {
    // Handle barcode scanner input (usually ends with Enter)
    if (e.key === 'Enter' && manualCode) {
      handleScan(manualCode);
    }
  };

  const startScanning = () => {
    setScanning(true);
    setError(null);
    setScanResult(null);
    setManualCode('');
    
    // Focus input for scanner
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    // Auto-stop scanning after 30 seconds
    setTimeout(() => {
      setScanning(false);
    }, 30000);
  };

  const stopScanning = () => {
    setScanning(false);
  };

  const clearResults = () => {
    setScanResult(null);
    setError(null);
    setManualCode('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Barcode Scanner & Lookup</h2>
        <p className="text-gray-600">Scan barcodes or enter codes manually to look up product information</p>
      </div>

      {/* Scanner Controls */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Manual Entry */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Manual Entry</h3>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Barcode
                </label>
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyDown={handleKeyboardScan}
                    placeholder="Type or scan barcode here..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={!manualCode || loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Search size={16} />
                    Lookup
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Scanner Mode */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Barcode Scanner</h3>
            <div className="space-y-4">
              {!scanning ? (
                <button
                  onClick={startScanning}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Scan size={20} />
                  Start Scanner Mode
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <Scan size={20} className="animate-pulse" />
                      <span className="font-medium">Scanner Active</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      Point your barcode scanner at a product and scan
                    </p>
                  </div>
                  <button
                    onClick={stopScanning}
                    className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                  >
                    Stop Scanning
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Looking up barcode...</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle size={20} />
            <span className="font-medium">Scan Failed</span>
          </div>
          <p className="text-red-600 mt-1">{error}</p>
        </div>
      )}

      {/* Scan Results */}
      {scanResult && (
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <div className="p-6">
            {scanResult.isValid && scanResult.product ? (
              <div className="space-y-6">
                {/* Success Header */}
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle size={24} />
                  <h3 className="text-lg font-medium">Product Found</h3>
                </div>

                {/* Barcode Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Scanned Code</p>
                      <p className="text-lg font-mono text-gray-900">{scanResult.code}</p>
                    </div>
                    <div className="text-right">
                      <img
                        className="h-12 w-32 object-contain border"
                        src={barcodeService.generateBarcodeImage(scanResult.code)}
                        alt={`Barcode ${scanResult.code}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Product Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Product Name</label>
                      <p className="mt-1 text-lg font-semibold text-gray-900">{scanResult.product.name}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">SKU</label>
                      <p className="mt-1 text-gray-900">{scanResult.product.sku}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <p className="mt-1 text-gray-900">{scanResult.product.category}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Price</label>
                      <p className="mt-1 text-2xl font-bold text-green-600">
                        ${scanResult.product.price.toFixed(2)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Stock Quantity</label>
                      <p className="mt-1 text-lg text-gray-900">
                        {scanResult.product.inventory.quantity} units
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Stock Status</label>
                      <p className="mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          scanResult.product.inventory.quantity > 10
                            ? 'bg-green-100 text-green-800'
                            : scanResult.product.inventory.quantity > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {scanResult.product.inventory.quantity > 10
                            ? 'In Stock'
                            : scanResult.product.inventory.quantity > 0
                            ? 'Low Stock'
                            : 'Out of Stock'
                          }
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <button
                    onClick={clearResults}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Clear Results
                  </button>
                  
                  <div className="flex gap-3">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                      <Package size={16} />
                      Add to Order
                    </button>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Invalid Barcode */
              <div className="text-center py-8">
                <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Barcode Not Found</h3>
                <p className="text-gray-600 mb-4">
                  The scanned barcode "{scanResult.code}" is not associated with any product in the system.
                </p>
                <button
                  onClick={clearResults}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <h4 className="text-blue-900 font-medium mb-2">How to use the barcode scanner:</h4>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• Enter barcode manually in the text field, or</li>
          <li>• Click "Start Scanner Mode" and use a USB barcode scanner</li>
          <li>• Barcode scanners typically input the code and press Enter automatically</li>
          <li>• Make sure the input field is focused when scanning</li>
        </ul>
      </div>
    </div>
  );
};

export default BarcodeScanner;