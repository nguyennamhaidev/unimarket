import axios from 'axios';

// Determine backend API URL dynamically
const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // If running locally on localhost
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000/api';
  }
  // 🔴 ĐÃ THAY Ở DÒNG NÀY:
  return 'https://unimarket-dnwj.onrender.com/api';
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

// Response interceptor: handle 401 gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Session expired or invalid
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath === '/login' || currentPath === '/register';
      const hadToken = !!localStorage.getItem('unimarket_token');

      // Only redirect if not already on auth page and a token was present
      if (!isAuthPage && hadToken) {
        localStorage.removeItem('unimarket_token');
        localStorage.removeItem('unimarket_user');
        // Let React state update or navigate cleanly without hard reloading if possible
        if (!window.location.search.includes('expired=true')) {
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}&expired=true`;
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;