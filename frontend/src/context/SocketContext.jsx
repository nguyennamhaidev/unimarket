import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const getSocketURL = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
  }
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let newSocket;
    try {
      // Initialize socket connection to backend
      const socketUrl = getSocketURL();
      newSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 10000
      });

      newSocket.on('connect_error', (err) => {
        // Silently log and fallback to polling without crashing UI
        console.warn('[Socket] Connection notice:', err.message);
      });

      setSocket(newSocket);
    } catch (err) {
      console.warn('[Socket] Initialization skipped:', err.message);
    }

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (socket && user?.id) {
      const joinChannel = () => {
        socket.emit('join_user_channel', user.id);
      };

      joinChannel();
      socket.on('connect', joinChannel);

      const handleNotification = (notif) => {
        setNotifications(prev => [notif, ...prev]);
        setUnreadCount(prev => prev + 1);
      };

      socket.on('notification', handleNotification);

      return () => {
        socket.off('connect', joinChannel);
        socket.off('notification', handleNotification);
      };
    }
  }, [socket, user]);

  return (
    <SocketContext.Provider value={{ socket, unreadCount, setUnreadCount, notifications }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

