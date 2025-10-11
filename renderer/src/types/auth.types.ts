export interface User {
  id: number;
  email: string;
  name: string;
  role: {
    name: 'CASHIER' | 'MANAGER';
    permissions: string[];
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export interface ApiError {
  error: string;
}