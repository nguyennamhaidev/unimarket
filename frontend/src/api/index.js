import axios from 'axios';

// Determine backend API URL dynamically
const getBaseURL = () => {
  let url = import.meta.env.VITE_API_URL;
  
  if (!url) {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      url = 'http://localhost:5000/api';
    } else {
      url = 'https://unimarket-dnwj.onrender.com/api';
    }
  }

  // Xóa dấu / ở cuối nếu có để tránh lỗi đúp dấu gạch chéo
  return url.replace(/\/+$/, '');
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
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath === '/login' || currentPath === '/register';
      const hadToken = !!localStorage.getItem('unimarket_token');

      if (!isAuthPage && hadToken) {
        localStorage.removeItem('unimarket_token');
        localStorage.removeItem('unimarket_user');
        if (!window.location.search.includes('expired=true')) {
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}&expired=true`;
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;