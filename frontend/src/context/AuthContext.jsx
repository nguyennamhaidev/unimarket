import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('unimarket_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('unimarket_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      localStorage.setItem('unimarket_user', JSON.stringify(res.data.user));
    } catch (err) {
      console.error('Failed to fetch current user', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (account, password) => {
    const res = await api.post('/auth/login', { account, password });
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('unimarket_token', newToken);
    localStorage.setItem('unimarket_user', JSON.stringify(newUser));
    return newUser;
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('unimarket_token', newToken);
    localStorage.setItem('unimarket_user', JSON.stringify(newUser));
    return newUser;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('unimarket_token');
    localStorage.removeItem('unimarket_user');
  };

  const updateProfile = async (data) => {
    const res = await api.put('/auth/profile', data);
    setUser(prev => ({ ...prev, ...res.data.user }));
    localStorage.setItem('unimarket_user', JSON.stringify({ ...user, ...res.data.user }));
    return res.data;
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout,
      refreshUser,
      updateProfile,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'ADMIN'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
