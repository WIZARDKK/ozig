import React, { useState, useEffect } from 'react';
import { LoginPage } from './pages/auth/LoginPage';
import { Dashboard } from './pages/Dashboard';
import CashierDashboard from './pages/CashierDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { authService } from './services/auth.service';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    if (authService.isAuthenticated()) {
      // Validate token with server
      const result = await authService.validateToken();
      setIsAuthenticated(result.success);
    } else {
      setIsAuthenticated(false);
    }
    setLoading(false);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const user = authService.getCurrentUser();
  const isCashier = user?.role.name === 'CASHIER';

  return (
    <ProtectedRoute onUnauthorized={handleLogout}>
      {isCashier ? (
        <CashierDashboard onLogout={handleLogout} />
      ) : (
        <Dashboard onLogout={handleLogout} />
      )}
    </ProtectedRoute>
  );
}
