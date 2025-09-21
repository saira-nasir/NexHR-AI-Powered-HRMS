
import axios from 'axios';
import { toast } from "@/components/ui/use-toast";

// Use environment variable or fallback with full URL for development
const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout to prevent long hanging requests
  timeout: 15000, // Increased timeout for slower connections
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log all outgoing requests for debugging
    console.log(`API Request to ${config.url}:`, { 
      method: config.method, 
      data: config.data,
      headers: config.headers,
      baseURL: config.baseURL
    });
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    console.log(`API Response from ${response.config.url}:`, {
      status: response.status,
      data: response.data
    });
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log detailed error information
    console.error('API Response Error:', {
      url: originalRequest?.url,
      method: originalRequest?.method,
      data: originalRequest?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data
    });
    
    // Network error handling
    if (!error.response) {
      console.error('Network error detected:', error);
      
      // Special handling for CORS errors
      if (error.message === 'Network Error' && originalRequest?.url) {
        const requestUrl = originalRequest.baseURL + originalRequest.url;
        if (requestUrl.includes('127.0.0.1') || requestUrl.includes('localhost')) {
          toast({
            title: "Local Server Connection Error",
            description: "Cannot connect to your local development server. Make sure your Django server is running and CORS is configured correctly.",
            variant: "destructive",
          });
          console.error('CORS ERROR HELP: Make sure your Django server has django-cors-headers installed and properly configured with:');
          console.error('1. CORS_ALLOW_ALL_ORIGINS = True or CORS_ALLOWED_ORIGINS = ["https://preview--hr-hub-navigator.lovable.app"]');
          console.error('2. CORS_ALLOW_CREDENTIALS = True');
          console.error('3. corsheaders.middleware.CorsMiddleware added to MIDDLEWARE (before other middleware)');
          return Promise.reject(error);
        }
      }
      
      toast({
        title: "Network Error",
        description: "Cannot connect to the server. Please check your connection and try again.",
        variant: "destructive",
      });
      return Promise.reject(error);
    }
    
    // If the error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (!refreshToken) {
          // No refresh token, redirect to login
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        // Try to refresh token
        const response = await axios.post(`${BASE_URL}/auth/refresh/`, {
          refresh: refreshToken
        });
        
        // Update tokens
        const { access } = response.data;
        localStorage.setItem('access_token', access);
        
        // Update header and retry
        api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        originalRequest.headers['Authorization'] = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to handle API errors in a consistent way
export const handleApiError = (error: any, defaultMessage = "An unexpected error occurred") => {
  console.error('API error:', error);
  
  if (!error.response) {
    // Network error
    return {
      success: false,
      message: "Cannot connect to the server. Please check your connection and try again."
    };
  }
  
  if (error.response.data) {
    // Get the first error message from the response
    const errorData = error.response.data;
    let errorMessage = defaultMessage;
    
    if (typeof errorData === 'string') {
      errorMessage = errorData;
    } else if (errorData.detail) {
      errorMessage = errorData.detail;
    } else if (errorData.non_field_errors) {
      errorMessage = errorData.non_field_errors[0];
    } else {
      // Look for the first error in any field
      const firstErrorField = Object.keys(errorData)[0];
      if (firstErrorField && errorData[firstErrorField]) {
        const fieldErrors = errorData[firstErrorField];
        errorMessage = Array.isArray(fieldErrors) ? fieldErrors[0] : fieldErrors;
      }
    }
    
    return {
      success: false,
      message: errorMessage,
      errors: errorData
    };
  }
  
  return {
    success: false,
    message: defaultMessage
  };
};

export default api;
