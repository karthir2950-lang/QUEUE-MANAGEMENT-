import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';
import { wsService } from '../services/websocketService';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
      const count = data.filter(n => !n.is_read).length;
      setUnreadCount(count);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  // Handle incoming websocket events for notifications
  useEffect(() => {
    if (!user) return;
    
    // Connect to general queue room for global notifications if not connected
    wsService.connect('general');

    const unsubscribe = wsService.on('NOTIFICATION', (data) => {
      if (data.notification) {
        setNotifications(prev => [data.notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Optional: show a toast here if we had toast integrated globally
      }
    });
    
    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all read:", error);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      fetchNotifications,
      markAsRead,
      markAllAsRead
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
