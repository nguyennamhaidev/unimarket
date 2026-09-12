import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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
