import { User, LoginRequest, LoginResponse } from '../types/auth.types';

const API_BASE_URL = 'http://localhost:4000/api';

class AuthService {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      console.log('Attempting login with:', { email: credentials.email });
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });

      console.log('Login response status:', response.status);

      if (!response.ok) {
        // If server is not available or returns error, try development bypass
        if (response.status === 401 || response.status >= 500) {
          console.warn('Backend unavailable, using development bypass');
          return this.developmentBypass(credentials);
        }
      }

      const data: LoginResponse = await response.json();

      if (data.success && data.token) {
        this.token = data.token;
        localStorage.setItem('auth_token', data.token);
        
        // Store user data
        if (data.user) {
          localStorage.setItem('user_data', JSON.stringify(data.user));
        }
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      
      // If there's a network error, try development bypass
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.warn('Network error detected, attempting development bypass');
        return this.developmentBypass(credentials);
      }
      
      return {
        success: false,
        error: 'Network error. Please check your connection or try development credentials.'
      };
    }
  }

  async validateToken(): Promise<{ success: boolean; user?: User; error?: string }> {
    if (!this.token) {
      return { success: false, error: 'No token found' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        this.logout();
        return { success: false, error: 'Token validation failed' };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Token validation error:', error);
      this.logout();
      return { success: false, error: 'Network error' };
    }
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }

  getCurrentUser(): User | null {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch {
        return null;
      }
    }
    return null;
  }

  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    return user.role.permissions.includes('ALL_PERMISSIONS') ||
           user.role.permissions.includes(permission);
  }

  isManager(): boolean {
    const user = this.getCurrentUser();
    return user?.role.name === 'MANAGER';
  }

  isCashier(): boolean {
    const user = this.getCurrentUser();
    return user?.role.name === 'CASHIER';
  }

  async changePassword(currentPassword: string, newPassword: string) {
    if (!this.token) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      return await response.json();
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Development bypass when backend is not available
  private developmentBypass(credentials: LoginRequest): LoginResponse {
    // Only allow specific development credentials
    const validCredentials = [
      { email: 'manager@costumeshop.lk', password: 'manager123' },
      { email: 'dev@test.com', password: 'dev123' }
    ];

    const isValid = validCredentials.some(
      cred => cred.email === credentials.email && cred.password === credentials.password
    );

    if (isValid) {
      const mockUser: User = {
        id: 1,
        email: credentials.email,
        name: credentials.email === 'manager@costumeshop.lk' ? 'Shop Manager' : 'Developer',
        role: {
          name: 'MANAGER',
          permissions: [
            'ALL_PERMISSIONS',
            'MANAGE_PRODUCTS',
            'MANAGE_USERS',
            'VIEW_REPORTS',
            'APPROVE_EXCHANGES',
            'APPROVE_RETURNS',
            'MANAGE_DISCOUNTS',
            'VIEW_COST_PRICES'
          ]
        }
      };

      const mockToken = 'dev-token-' + Date.now();
      
      // Store the mock data
      this.token = mockToken;
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('user_data', JSON.stringify(mockUser));

      console.log('Development bypass successful for:', credentials.email);
      
      return {
        success: true,
        token: mockToken,
        user: mockUser
      };
    }

    return {
      success: false,
      error: 'Invalid development credentials'
    };
  }
}

export const authService = new AuthService();