import React, { useEffect, useState } from 'react';
import { authService } from '../services/auth.service';
import { User } from '../types/auth.types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  onUnauthorized: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPermission,
  onUnauthorized 
}) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    validateAccess();
  }, [requiredPermission]);

  const validateAccess = async () => {
    try {
      if (!authService.isAuthenticated()) {
        onUnauthorized();
        return;
      }

      // Validate token with server
      const result = await authService.validateToken();
      
      if (!result.success) {
        onUnauthorized();
        return;
      }

      setUser(result.user || null);

      // Check specific permission if required
      if (requiredPermission && !authService.hasPermission(requiredPermission)) {
        // Show permission denied instead of redirect
        setUser(null);
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error('Access validation error:', error);
      onUnauthorized();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating access...</p>
        </div>
      </div>
    );
  }

  if (requiredPermission && !authService.hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this section.
          </p>
          <p className="text-sm text-gray-500">
            Required permission: <code className="bg-gray-100 px-2 py-1 rounded">{requiredPermission}</code>
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};