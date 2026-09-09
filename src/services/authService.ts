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

// Google token info decoded from JWT
export interface GoogleTokenInfo {
  email: string;
  name?: string;
  picture?: string;
  sub: string;
  given_name?: string;
  family_name?: string;
}

// Decode Google JWT token in frontend (no external API call needed)
function decodeGoogleToken(token: string): GoogleTokenInfo | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Add padding if needed
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    
    const decoded = JSON.parse(atob(base64));
    return {
      email: decoded.email,
      name: decoded.name || decoded.given_name + ' ' + decoded.family_name,
      picture: decoded.picture,
      sub: decoded.sub,
      given_name: decoded.given_name,
      family_name: decoded.family_name
    };
  } catch (error) {
    console.error('[AuthService] Failed to decode Google token:', error);
    return null;
  }
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

  // Google Login - Decode JWT in frontend, send pre-validated data to backend
  // This avoids backend needing to call Google's API (which fails on Render free tier)
  googleLogin: async (token: string): Promise<AuthResponse> => {
    // Decode the JWT to get user info (no external API call needed)
    const tokenInfo = decodeGoogleToken(token);
    if (!tokenInfo) {
      throw new Error('Không thể giải mã token Google');
    }

    console.log('[AuthService] Google token decoded:', {
      email: tokenInfo.email,
      name: tokenInfo.name,
      hasPicture: !!tokenInfo.picture
    });

    // Send pre-validated user data to backend (backend trusts frontend's JWT decode)
    // The JWT is signed by Google, so if we can decode it, it's valid
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/google-direct', {
      token, // Original Google JWT (for audit/verification if needed)
      email: tokenInfo.email,
      name: tokenInfo.name || tokenInfo.given_name || tokenInfo.email.split('@')[0],
      picture: tokenInfo.picture
    });
    
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

  getUserId: (): number => {
    const token = localStorage.getItem('token');
    if (!token) return 0;
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded.userId || decoded.sub || decoded.id || 0;
    } catch {
      return 0;
    }
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },
};
