import api from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  fullName?: string;
  grade?: number;
}

export interface AuthResponse {
  token: string;
  email: string;
  fullName: string;
  role: string;
  expiresAt?: string;
  user?: {
    id: number;
    email: string;
    fullName: string;
    role: string;
  };
  message?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}

export const AuthService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', { email, password } as LoginRequest);
    // API returns wrapped response: { success, message, data: { token, email, ... }, errors }
    const data = response.data.data;
    if (data.token) {
      localStorage.setItem('token', data.token);
      // Also store user info for compatibility
      localStorage.setItem('user', JSON.stringify({
        email: data.email,
        fullName: data.fullName,
        role: data.role
      }));
    }
    return data;
  },

  googleLogin: async (token: string): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/google', { token });
    // API returns wrapped response: { success, message, data: { token, email, ... }, errors }
    const data = response.data.data;
    if (data.token) {
      localStorage.setItem('token', data.token);
      // Also store user info for compatibility
      localStorage.setItem('user', JSON.stringify({
        email: data.email,
        fullName: data.fullName,
        role: data.role
      }));
    }
    return data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    // API returns wrapped response: { success, message, data: { token, email, ... }, errors }
    const responseData = response.data.data;
    if (responseData.token) {
      localStorage.setItem('token', responseData.token);
      localStorage.setItem('user', JSON.stringify({
        email: responseData.email,
        fullName: responseData.fullName,
        role: responseData.role
      }));
    }
    return responseData;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  getCurrentUser: (): AuthResponse['user'] | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },
};
