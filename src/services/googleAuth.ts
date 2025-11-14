import axios from 'axios';

interface GoogleAuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

interface GoogleCalendarStatusResponse {
  is_connected: boolean;
  email: string;
  connected_at?: string;
  last_updated?: string;
  is_token_expired?: boolean;
  has_refresh_token?: boolean;
}

export const googleAuthService = {
  async loginWithGoogle(accessToken: string): Promise<{ success: boolean; data?: GoogleAuthResponse; message?: string }> {
    try {
      const response = await axios.post<GoogleAuthResponse>(
        "http://localhost:8000/api/auth/google/",
        { access_token: accessToken },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      console.log("Backend Response in react app:", response.data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error("Google authentication failed:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to authenticate with Google"
      };
    }
  },

  async getCalendarStatus(): Promise<{ success: boolean; data?: GoogleCalendarStatusResponse; message?: string }> {
    try {
      const token = localStorage.getItem('access_token');
      const baseApi = import.meta.env.VITE_API_URL 
        ? String(import.meta.env.VITE_API_URL).replace(/\/$/, '') 
        : 'http://127.0.0.1:8000/api';
      
      const response = await axios.get<GoogleCalendarStatusResponse>(
        `${baseApi}/auth/google-calendar/status/`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        }
      );
      
      console.log("Google Calendar Status:", response.data);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error("Failed to fetch Google Calendar status:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch calendar status"
      };
    }
  }
  
}; 