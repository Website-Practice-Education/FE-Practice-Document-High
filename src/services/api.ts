import axios from 'axios';

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL_SECURE ||
  'http://localhost:5058/api'
).replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
});

// Debug interceptor - log all responses
api.interceptors.response.use(
  (response) => {
    console.log('[API Response]', response.config.url, response.data);
    return response;
  },
  (error) => {
    console.error('[API Error]', error.config?.url, error.response?.data);
    return Promise.reject(error);
  }
);

// Add auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Flag to track if we're already handling a logout to prevent multiple logout calls
let isLoggingOut = false;

// Handle 401 responses (unauthorized)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if it's a 401 error
    if (error.response?.status === 401) {
      // Prevent multiple logout calls
      if (isLoggingOut) {
        return Promise.reject(error);
      }
      
      // Don't auto-logout for auth endpoints - let them fail naturally
      const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
                             originalRequest.url?.includes('/auth/register') ||
                             originalRequest.url?.includes('/auth/google');
      
      if (isAuthEndpoint) {
        return Promise.reject(error);
      }
      
      // For other endpoints, show a session expired message instead of auto-logout
      // This prevents unexpected logout when clicking on pages like StudyHub
      console.warn('[API] Session may have expired. Please refresh or login again.');
      
      // Only logout if we have a token (user was logged in)
      const hasToken = !!localStorage.getItem('token');
      if (hasToken) {
        // Clear auth state but don't redirect immediately
        // This allows the app to handle the error more gracefully
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Dispatch a custom event so components can handle it
        window.dispatchEvent(new CustomEvent('auth:session-expired', {
          detail: { message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' }
        }));
        
        isLoggingOut = true;
        
        // Redirect after a short delay to allow any pending requests to complete
        setTimeout(() => {
          window.location.href = '/login';
          isLoggingOut = false;
        }, 500);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
