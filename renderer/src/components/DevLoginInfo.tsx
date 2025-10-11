import React from 'react';
import { AlertCircle, Server, Key } from 'lucide-react';

interface DevLoginInfoProps {
  show: boolean;
  onClose: () => void;
}

export const DevLoginInfo: React.FC<DevLoginInfoProps> = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-2 mb-4">
          <Server className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900">Backend Server Unavailable</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
            <div>
              <p className="text-sm text-gray-700">
                The backend server is not responding. You can use development credentials to continue testing the frontend.
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Key className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">Development Credentials:</span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div>
                <strong>Manager Account:</strong>
                <div className="font-mono text-xs bg-white p-2 rounded border mt-1">
                  Email: manager@costumeshop.lk<br/>
                  Password: manager123
                </div>
              </div>
              
              <div>
                <strong>Developer Account:</strong>
                <div className="font-mono text-xs bg-white p-2 rounded border mt-1">
                  Email: dev@test.com<br/>
                  Password: dev123
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              <strong>Note:</strong> These credentials only work when the backend is unavailable. 
              To use real authentication, please start the backend server.
            </p>
          </div>
        </div>
        
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};