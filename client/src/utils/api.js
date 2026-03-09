import axios from 'axios';

const DEFAULT_API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://qrscanner-1-zju4.onrender.com/api'
    : 'http://localhost:5000/api';

const API_BASE_URL = (process.env.REACT_APP_API_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60s for Render free tier cold starts
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
