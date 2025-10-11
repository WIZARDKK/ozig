import React, { useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
import { dashboardService } from '../services/dashboard.service';
import ProductsPage from './products/ProductsPage';
import CategoriesPage from './categories/CategoriesPage';
import BarcodesPage from './barcodes/BarcodesPage';
import ExchangeManagement from './exchanges/ExchangeManagement';

interface DashboardProps {
  onLogout: () => void;
}

type DashboardSection = 'home' | 'products' | 'categories' | 'barcodes' | 'orders' | 'pos' | 'exchanges' | 'returns' | 'reports';

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const user = authService.getCurrentUser();
  const [currentSection, setCurrentSection] = useState<DashboardSection>('home');
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      const response = await dashboardService.getQuickStats();
      if (response.success && response.stats) {
        setDashboardStats(response.stats);
      } else {
        console.warn('Dashboard stats failed, using defaults');
        // Set default values if service fails
        setDashboardStats({
          todaysSales: 0,
          totalOrders: 0,
          lowStockItems: 0,
          pendingReturns: 0
        });
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      // Set default values on error
      setDashboardStats({
        todaysSales: 0,
        totalOrders: 0,
        lowStockItems: 0,
        pendingReturns: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    onLogout();
  };

  const handleNavigate = (section: DashboardSection) => {
    setCurrentSection(section);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  // Render content based on current section
  const renderContent = () => {
    switch (currentSection) {
      case 'products':
        return <ProductsPage />;
      case 'categories':
        return <CategoriesPage />;
      case 'barcodes':
        return <BarcodesPage />;
      case 'exchanges':
        return <ExchangeManagement />;
      case 'home':
      default:
        return renderHomeContent();
    }
  };

  const renderHomeContent = () => (
    <>
      {/* Main Content */}
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* POS Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Point of Sale</h3>
              <p className="text-gray-600 text-sm mb-4">Process customer transactions</p>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded font-medium">
                Open POS
              </button>
            </div>

            {/* Products Section */}
            {authService.hasPermission('MANAGE_PRODUCTS') && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Products</h3>
                <p className="text-gray-600 text-sm mb-4">Manage costume inventory</p>
                <button 
                  onClick={() => handleNavigate('products')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded font-medium"
                >
                  Manage Products
                </button>
              </div>
            )}

            {/* Categories Section */}
            {authService.hasPermission('MANAGE_PRODUCTS') && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Categories</h3>
                <p className="text-gray-600 text-sm mb-4">Manage product categories</p>
                <button 
                  onClick={() => handleNavigate('categories')}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded font-medium"
                >
                  Manage Categories
                </button>
              </div>
            )}

            {/* Barcodes Section */}
            {authService.hasPermission('MANAGE_PRODUCTS') && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Barcodes</h3>
                <p className="text-gray-600 text-sm mb-4">Generate and manage product barcodes</p>
                <button 
                  onClick={() => handleNavigate('barcodes')}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded font-medium"
                >
                  Manage Barcodes
                </button>
              </div>
            )}

            {/* Orders Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Orders</h3>
              <p className="text-gray-600 text-sm mb-4">View order history</p>
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded font-medium">
                View Orders
              </button>
            </div>

            {/* Exchanges Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Exchanges</h3>
              <p className="text-gray-600 text-sm mb-4">Comprehensive exchange management system</p>
              <button 
                onClick={() => handleNavigate('exchanges')}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded font-medium"
              >
                Manage Exchanges
              </button>
            </div>

            {/* Returns Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Returns</h3>
              <p className="text-gray-600 text-sm mb-4">Process returns and damages</p>
              <button className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded font-medium">
                Process Returns
              </button>
            </div>

            {/* Reports Section */}
            {authService.hasPermission('VIEW_REPORTS') && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Reports</h3>
                <p className="text-gray-600 text-sm mb-4">Sales and inventory reports</p>
                <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded font-medium">
                  View Reports
                </button>
              </div>
            )}

          </div>

          {/* Quick Stats */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {loading ? '...' : dashboardStats ? `LKR ${dashboardStats.todaysSales.toLocaleString()}` : '--'}
              </div>
              <div className="text-sm text-gray-600">Today's Sales</div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {loading ? '...' : dashboardStats ? dashboardStats.totalOrders.toLocaleString() : '--'}
              </div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {loading ? '...' : dashboardStats ? dashboardStats.lowStockItems.toLocaleString() : '--'}
              </div>
              <div className="text-sm text-gray-600">Low Stock Items</div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {loading ? '...' : dashboardStats ? dashboardStats.pendingReturns.toLocaleString() : '--'}
              </div>
              <div className="text-sm text-gray-600">Pending Returns</div>
            </div>
          </div>

          {/* User Permissions Debug Info (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 bg-gray-100 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">User Permissions (Dev Mode)</h4>
              <div className="text-sm text-gray-600">
                <p><strong>Role:</strong> {user.role.name}</p>
                <p><strong>Permissions:</strong></p>
                <ul className="list-disc list-inside mt-1">
                  {user.role.permissions.map(permission => (
                    <li key={permission}>{permission}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleNavigate('home')}
                className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors"
              >
                Costume Shop POS
              </button>
              
              {currentSection !== 'home' && (
                <nav className="flex items-center space-x-2 text-sm text-gray-500">
                  <button 
                    onClick={() => handleNavigate('home')}
                    className="hover:text-blue-600"
                  >
                    Home
                  </button>
                  <span>›</span>
                  <span className="text-gray-900 font-medium capitalize">
                    {currentSection}
                  </span>
                </nav>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                Welcome, <span className="font-medium">{user.name}</span>
                <span className="text-xs text-gray-500 ml-2">
                  ({user.role.name})
                </span>
              </div>
              
              {currentSection === 'home' && (
                <>
                  <button
                    onClick={loadDashboardStats}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-1 rounded text-sm font-medium transition duration-200"
                  >
                    {loading ? 'Loading...' : 'Refresh'}
                  </button>
                  
                  {!loading && dashboardStats && (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      ✓ Data Loaded
                    </span>
                  )}
                </>
              )}
              
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
      {renderContent()}
    </div>
  );
};