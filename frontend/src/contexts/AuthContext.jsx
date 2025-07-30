import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api.js';

const AuthContext = createContext();

// Force explicit URLs instead of relying on axios defaults
console.log('AuthContext loaded at:', new Date().toISOString());
console.log('AuthContext API_ENDPOINTS.auth:', API_ENDPOINTS.auth);

// Create a fresh axios instance to avoid any global configuration conflicts
const apiClient = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Token management
const getToken = () => localStorage.getItem('token');
const setToken = (token) => {
  localStorage.setItem('token', token);
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};
const removeToken = () => {
  localStorage.removeItem('token');
  delete apiClient.defaults.headers.common['Authorization'];
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('Initializing auth...');
      const token = getToken();
      console.log('Stored token:', token ? 'exists' : 'none');
      
      if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          console.log('Validating token...');
          const response = await apiClient.get(API_ENDPOINTS.auth + '/me');
          console.log('Token validation successful:', response.data);
          setUser(response.data.user);
        } catch (error) {
          console.error('Token validation failed:', error);
          removeToken();
        }
      } else {
        console.log('No token found, user not authenticated');
      }
      setLoading(false);
      console.log('Auth initialization complete');
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const loginUrl = API_ENDPOINTS.auth + '/login';
      console.log('🔥 CRITICAL DEBUG - Attempting login to:', loginUrl);
      console.log('🔥 API_ENDPOINTS.auth value:', API_ENDPOINTS.auth);
      
      // Try fetch instead of axios to completely bypass any axios configuration
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(errorData.message || 'Login failed');
      }
      
      const { token, user } = await response.json();
      
      setToken(token);
      setUser(user);
    } catch (error) {
      console.error('Login error details:', error);
      throw new Error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const registerUrl = API_ENDPOINTS.auth + '/register';
      console.log('Attempting registration to:', registerUrl);
      
      const response = await apiClient.post(registerUrl, userData);
      console.log('Registration response:', response.data);
      
      const { token, user } = response.data;
      
      setToken(token);
      setUser(user);
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error response:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  const updateUser = async (userData) => {
    try {
      const response = await axios.patch('/auth/preferences', userData);
      setUser(response.data.user);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Update failed');
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
