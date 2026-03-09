import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      // Token is already set in api interceptor
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await api.post('/admin/login', {
        email,
        password
      });
      
      const { token: newToken, admin: adminData } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setAdmin(adminData);
      return { success: true };
    } catch (error) {
      const status = error.response?.status;
      const data = error.response?.data;
      const baseURL = api?.defaults?.baseURL;

      let message =
        (typeof data === 'object' && data?.message) ? data.message : undefined;

      if (!message && typeof data === 'string' && data.trim()) {
        message = `Request failed (HTTP ${status ?? '??'}).`;
      }

      if (!message) {
        if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
          message = `Cannot reach the server. Your API base URL is set to: ${baseURL || '(not set)'} . On Vercel, set REACT_APP_API_URL to https://YOUR-RENDER-SERVICE.onrender.com/api and redeploy.`;
        } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          message = 'Request timed out. If using Render free tier, the server may be waking up—try again in 30 seconds.';
        } else if (status) {
          message = `Login failed (HTTP ${status}). Your API base URL is: ${baseURL || '(not set)'} .`;
        } else {
          message = `Login failed. Make sure REACT_APP_API_URL points to your backend. Current API base URL: ${baseURL || '(not set)'}.`;
        }
      }
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setAdmin(null);
  };

  const value = {
    admin,
    token,
    login,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
