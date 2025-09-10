import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('blinders_token'));

  // Set up axios interceptor for auth token
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => axios.interceptors.request.eject(interceptor);
  }, [token]);

  // Set up axios interceptor for handling auth errors
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout();
          toast.error('Session expired. Please login again.');
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await axios.get('/auth/profile');
          setUser(response.data.user);
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('blinders_token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (username, password, twoFactorToken = null) => {
    try {
      const response = await axios.post('/auth/login', {
        username,
        password,
        twoFactorToken
      });

      if (response.data.requiresTwoFactor) {
        return { requiresTwoFactor: true };
      }

      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('blinders_token', newToken);
      setToken(newToken);
      setUser(userData);
      
      toast.success(`Welcome back, ${userData.username}!`);
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
      throw new Error(message);
    }
  };

  const logout = () => {
    localStorage.removeItem('blinders_token');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  const signup = async (username, email, password) => {
    try {
      const response = await axios.post('/auth/signup', {
        username,
        email,
        password
      });
      
      // If user becomes President, auto-login
      if (response.data.user.isPresident) {
        const loginResponse = await login(username, password);
        return loginResponse;
      }
      
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Signup failed';
      toast.error(message);
      throw new Error(message);
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/auth/register', userData);
      toast.success('User registered successfully');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      toast.error(message);
      throw new Error(message);
    }
  };

  const setup2FA = async () => {
    try {
      const response = await axios.post('/auth/setup-2fa');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || '2FA setup failed';
      toast.error(message);
      throw new Error(message);
    }
  };

  const verify2FA = async (token) => {
    try {
      const response = await axios.post('/auth/verify-2fa', { token });
      toast.success('2FA enabled successfully');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || '2FA verification failed';
      toast.error(message);
      throw new Error(message);
    }
  };

  const disable2FA = async (password) => {
    try {
      const response = await axios.post('/auth/disable-2fa', { password });
      toast.success('2FA disabled successfully');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || '2FA disable failed';
      toast.error(message);
      throw new Error(message);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    login,
    logout,
    register,
    signup,
    updateUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
