import axios from 'axios';

// Dynamically determine baseURL
const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return '/api'; // Proxied by Vite to localhost:5000 in dev
    }
  }
  return 'https://unimarket-backend-w17a.onrender.com/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('unimarket_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor: handle 401
api.interceptors.response.use((response) => response, (error) => {
  if (error.response && error.response.status === 401) {
    // Session expired or invalid
    const currentPath = window.location.pathname;
    if (currentPath !== '/login' && currentPath !== '/register' && localStorage.getItem('unimarket_token')) {
      localStorage.removeItem('unimarket_token');
      localStorage.removeItem('unimarket_user');
      window.location.href = '/login?expired=true';
    }
  }
  return Promise.reject(error);
});

export default api;
