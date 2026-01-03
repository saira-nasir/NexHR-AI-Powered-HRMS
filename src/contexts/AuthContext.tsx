import React, { createContext, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { toast } from "@/components/ui/use-toast";
import { useDispatch, useSelector } from 'react-redux';
import { setUser, setPermissions, clearUser } from '../store/authSlice';
import { RootState } from '../store';

interface User {
  email: string;
  firstName?: string;
  lastName?: string;
}

interface AuthContextType {
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshAccessToken: () => Promise<boolean>;
  loginWithGoogle: (accessToken: string) => Promise<{ success: boolean; data?: GoogleAuthResponse; message?: string }>;
  reloadUser: () => Promise<void>;
}


interface GoogleAuthResponse {
  access: string;
  refresh: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isTokenExpired = (token: string) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch (e) {
    return true;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = React.useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false);
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const navigate = useNavigate();

  useEffect(() => {
    const storedAccessToken = localStorage.getItem('access_token');
    if (storedAccessToken) {
      if (!isTokenExpired(storedAccessToken)) {
        setAccessToken(storedAccessToken);
        setIsAuthenticated(true);
        fetchUserData(storedAccessToken);
      } else {
        refreshAccessToken();
      }
    }
  }, []);

  const fetchUserData = async (token: string) => {
    try {
      const response = await api.get('/auth/profile/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.status === 200) {
        dispatch(setUser(response.data));
        // Check for permissions in response
        if (response.data.permissions && Array.isArray(response.data.permissions)) {
          dispatch(setPermissions(response.data.permissions));
        }
        console.log("response data in /profile", response.data)
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };


  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        handleLogout();
        return false;
      }
      const response = await api.post('/auth/token/refresh/', { refresh: refreshToken });
      if (response.status === 200) {
        const { access } = response.data;
        localStorage.setItem('access_token', access);
        setAccessToken(access);
        setIsAuthenticated(true);
        await fetchUserData(access);
        return true;
      } else {
        handleLogout();
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      handleLogout();
      return false;
    }
  };


  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login/', { email, password });
      if (response.status === 200) {
        const { access, refresh } = response.data;
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        setAccessToken(access);
        setIsAuthenticated(true);
        console.log("is authenticated set to true in auth context")
        await fetchUserData(access);
        return { success: true };
      }
      return {
        success: false,
        message: "Invalid credentials"
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.detail || "An error occurred during login"
      };
    }
  };


  const loginWithGoogle = async (accessToken: string) => {
    try {
      const response = await api.post<GoogleAuthResponse>('/auth/google/', { access_token: accessToken });
      if (response.status === 200) {
        const { access, refresh } = response.data;
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        setAccessToken(access);
        setIsAuthenticated(true);
        await fetchUserData(access);
        return { success: true };
      }
      // return { success: false, message: "Failed to authenticate with Google" };
    } catch (error: any) {
      console.error("Google authentication failed:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to authenticate with Google"
      };
    }
  };


  const handleLogout = () => {
    setIsAuthenticated(false);
    setAccessToken(null);
    dispatch(clearUser());
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  };

  const logout = () => {
    api.post('/auth/logout/', {
      refresh_token: localStorage.getItem('refresh_token')
    }).catch(err => console.error('Logout error:', err));
    handleLogout();
    navigate('/login');
  };

  const reloadUser = async () => {
    if (accessToken) {
      await fetchUserData(accessToken);
    }
  };

  const value = {
    login,
    logout,
    isAuthenticated,
    accessToken,
    refreshAccessToken,
    loginWithGoogle,
    reloadUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};