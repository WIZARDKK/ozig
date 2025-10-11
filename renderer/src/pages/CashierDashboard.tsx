import React, { useState } from 'react';
import { authService } from '../services/auth.service';
import PointOfSale from './cashier/PointOfSale';
import Orders from './cashier/Orders';
import Exchanges from './cashier/Exchanges';
import Returns from './cashier/Returns';

interface CashierDashboardProps {
  onLogout: () => void;
}

type CashierSection = 'pos' | 'orders' | 'exchanges' | 'returns';

const CashierDashboard: React.FC<CashierDashboardProps> = ({ onLogout }) => {
  const user = authService.getCurrentUser();
  const [currentSection, setCurrentSection] = useState<CashierSection>('pos');

  const handleLogout = () => {
    authService.logout();
    onLogout();
  };

  const handleNavigate = (section: CashierSection) => {
    setCurrentSection(section);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  // Render content based on current section
  const renderContent = () => {
    switch (currentSection) {
      case 'pos':
        return <PointOfSale />;
      case 'orders':
        return <Orders />;
      case 'exchanges':
        return <Exchanges />;
      case 'returns':
        return <Returns />;
      default:
        return <PointOfSale />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                Cashier Dashboard
              </h1>
              
              {/* Navigation Tabs */}
              <nav className="flex space-x-1">
                <button
                  onClick={() => handleNavigate('pos')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentSection === 'pos'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  Point of Sale
                </button>
                <button
                  onClick={() => handleNavigate('orders')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentSection === 'orders'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  Orders
                </button>
                <button
                  onClick={() => handleNavigate('exchanges')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentSection === 'exchanges'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  Exchanges
                </button>
                <button
                  onClick={() => handleNavigate('returns')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentSection === 'returns'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  Returns
                </button>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                Welcome, <span className="font-medium">{user.name}</span>
                <span className="text-xs text-gray-500 ml-2">
                  ({user.role.name})
                </span>
              </div>
              
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1">
        {renderContent()}
      </div>
    </div>
  );
};

export default CashierDashboard;