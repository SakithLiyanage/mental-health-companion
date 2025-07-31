import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(undefined);

// Configure axios defaults
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://mental-health-companion-wine.vercel.app/api';
axios.defaults.baseURL = API_BASE_URL;

// Token management
const getToken = () => localStorage.getItem('token');
const setToken = (token) => {
  localStorage.setItem('token', token);
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};
const removeToken = () => {
  localStorage.removeItem('token');
  delete axios.defaults.headers.common['Authorization'];
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
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          console.log('Validating token...');
          const response = await axios.get('/auth/me');
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
      const response = await axios.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      setToken(token);
      setUser(user);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      console.log('Attempting registration with data:', userData);
      console.log('API Base URL:', API_BASE_URL);
      
      const response = await axios.post('/auth/register', userData);
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
