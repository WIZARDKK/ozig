import React, { useState } from 'react';
import BarcodeList from './BarcodeList';
import BarcodeScanner from './BarcodeScanner';
import { Barcode } from '../../types/barcode.types';
import { BarChart3, Search } from 'lucide-react';

const BarcodesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'manage' | 'scan'>('manage');
  const [selectedBarcode, setSelectedBarcode] = useState<Barcode | null>(null);

  const handleBarcodeSelect = (barcode: Barcode) => {
    setSelectedBarcode(barcode);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Barcode System</h1>
          <p className="mt-2 text-lg text-gray-600">
            Generate, manage, and scan barcodes for your products
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-1 bg-white rounded-lg shadow-sm p-1">
            <button
              onClick={() => setActiveTab('manage')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'manage'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <BarChart3 size={18} />
                Manage Barcodes
              </div>
            </button>
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'scan'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Search size={18} />
                Scan & Lookup
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'manage' ? (
            <div className="p-6">
              <BarcodeList onBarcodeSelect={handleBarcodeSelect} />
            </div>
          ) : (
            <div className="p-6">
              <BarcodeScanner />
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Barcodes</p>
                <p className="text-2xl font-semibold text-gray-900">-</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Search className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Barcodes</p>
                <p className="text-2xl font-semibold text-gray-900">-</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Products with Barcodes</p>
                <p className="text-2xl font-semibold text-gray-900">-</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodesPage;