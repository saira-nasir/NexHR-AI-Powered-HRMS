// src/lib/api.ts
import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { toast } from "@/components/ui/use-toast";

// Use environment variable or fallback with full URL for development
const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Added from File 1 for explicitness
  withCredentials: false, 
  // Add timeout to prevent long hanging requests (from File 2)
  timeout: 15000, // Increased timeout for slower connections
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // ✅ Safer header assignment (inspired by File 1's check)
      if (!config.headers) {
        config.headers = {} as any;
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Handle FormData: remove Content-Type header so axios can set it with boundary
    if (config.data instanceof FormData) {
      if (config.headers) {
        delete (config.headers as any)['Content-Type'];
      }
    }
    
    // ✅ Improved logging (combines File 1's full URL + File 2's data)
    const fullUrl = `${config.baseURL}${config.url}`;
    console.log(`➡️ API Request: ${config.method?.toUpperCase()} ${fullUrl}`, {
      data: config.data,
      headers: config.headers,
    });
    
    return config;
  },
  (error: AxiosError) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`API Response from ${response.config.url}:`, {
      status: response.status,
      data: response.data
    });
    
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Log detailed error information
    console.error('❌ API Response Error:', {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data
    });
    try {
      console.error('API Response Error (stringified):', JSON.stringify(error.response?.data, null, 2));
    } catch (e) {
      // ignore stringify errors
    }
    
    // Network error handling
    if (!error.response) {
      console.error('Network error detected:', error);
      
      // Special handling for CORS errors
      if (error.message === 'Network Error' && originalRequest?.url) {
        const requestUrl = (originalRequest.baseURL || '') + originalRequest.url;
        if (requestUrl.includes('127.0.0.1') || requestUrl.includes('localhost')) {
          toast({
            title: "Local Server Connection Error",
            description: "Cannot connect to your local development server. Make sure your Django server is running and CORS is configured correctly.",
            variant: "destructive",
          });
          console.error('CORS ERROR HELP: Make sure your Django server has django-cors-headers installed and properly configured.');
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
        const response = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken
        });
        
        // Update tokens
        const { access } = response.data;
        localStorage.setItem('access_token', access);
        
        // Update header and retry
        api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${access}`;
        }
        
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

// Helper functions for common API operations
export const apiGet = async (url: string) => {
  const response = await api.get(url);
  return response.data;
};

export const apiPost = async (url: string, data: any) => {
  const response = await api.post(url, data);
  return response.data;
};

export const apiPut = async (url: string, data: any) => {
  const response = await api.put(url, data);
  return response.data;
};

export const apiDelete = async (url: string) => {
  const response = await api.delete(url);
  return response.data;
};

// Helper function for posting FormData (multipart/form-data)
// Note: Don't set Content-Type manually - axios will automatically set it with boundary parameter
// The Authorization header will be added automatically by the request interceptor
export const apiPostFormData = async (url: string, formData: FormData) => {
  const response = await api.post(url, formData);
  return response.data;
};

export default api;