import axios, { AxiosError } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

// Extend AxiosRequestConfig to include skipErrorToast
declare module 'axios' {
  export interface AxiosRequestConfig {
    skipErrorToast?: boolean;
  }
}

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v2',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000, // 5 minutes for video uploads
});

// Request interceptor - add auth token to all requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('authToken');
    
    if (token && config.headers) {
      // Check if it's a guest token
      if (token.startsWith('guest_token_')) {
        // For guest users, use device_id instead of auth token
        const deviceId = localStorage.getItem('device_id');
        if (deviceId) {
          config.headers['X-Device-ID'] = deviceId;
        }
      } else {
        // For regular users, use bearer token
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle common errors globally
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Check if error toast should be skipped
    if (error.config?.skipErrorToast) {
      return Promise.reject(error);
    }

    // Handle different error types
    if (error.response) {
      const status = error.response.status;
      const data: any = error.response.data;
      
      switch (status) {
        case 401:
          // Unauthorized - clear auth and redirect to login
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
          toast.error('Session expired. Please login again.');
          break;
          
        case 410:
          // Gone - analysis complete (progress endpoint behavior)
          // Don't show error, let the component handle navigation
          break;
          
        case 413:
          // File too large
          toast.error('File size exceeds maximum allowed (500MB)');
          break;
          
        case 400:
          // Bad request - show server message
          toast.error(data?.message || 'Invalid request');
          break;
          
        case 500:
          // Server error
          toast.error('Server error. Please try again later.');
          break;
          
        default:
          // Generic error
          toast.error(data?.message || 'An error occurred');
      }
    } else if (error.request) {
      // Network error - no response received
      toast.error('Network error. Please check your connection.');
    } else {
      // Other errors
      toast.error('An unexpected error occurred');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
