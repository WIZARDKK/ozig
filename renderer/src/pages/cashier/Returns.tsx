import React from 'react';
import { RotateCcw } from 'lucide-react';

const Returns: React.FC = () => {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Returns</h1>
            <p className="text-gray-600">Process customer returns and refunds</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
            <RotateCcw size={20} />
            New Return
          </button>
        </div>

        {/* Coming Soon */}
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-400 mb-4">
            <RotateCcw size={64} className="mx-auto" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Return System Coming Soon</h3>
          <p className="text-gray-600 mb-6">
            The return system will allow customers to return costumes with proper validation, 
            refund processing, and inventory management.
          </p>
          <div className="text-left max-w-md mx-auto">
            <h4 className="font-medium text-gray-900 mb-2">Planned Features:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Scan receipt or order number</li>
              <li>• Verify return eligibility</li>
              <li>• Select items for return</li>
              <li>• Calculate refund amounts</li>
              <li>• Process refunds (cash/card)</li>
              <li>• Update inventory levels</li>
              <li>• Generate return receipts</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Returns;