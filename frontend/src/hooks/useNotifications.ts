import { useState, useEffect, useCallback } from 'react';
import { notificationService, Notification, NotificationStats } from '../services/notification.service';
import { useAuth } from '../contexts/AuthContext';
import { message } from 'antd';

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<NotificationStats | null>(null);

  // Initialize notification service
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('access_token');
      if (token) {
        notificationService.initializeSocket(token);
      }
    }

    return () => {
      notificationService.disconnect();
    };
  }, [user]);

  // Listen for real-time notifications
  useEffect(() => {
    const handleNewNotification = (event: CustomEvent) => {
      const notification = event.detail as Notification;
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show notification message
      message.info({
        content: notification.title,
        duration: 4,
        onClick: () => {
          // Handle notification click
          if (notification.actions?.[0]?.url) {
            window.location.href = notification.actions[0].url;
          }
        },
      });
    };

    const handleNotificationRead = (event: CustomEvent) => {
      const { id } = event.detail;
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleNotificationsRead = (event: CustomEvent) => {
      const { ids } = event.detail;
      setNotifications(prev =>
        prev.map(n => (ids.includes(n.id) ? { ...n, read: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - ids.length));
    };

    const handleAllNotificationsRead = () => {
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    };

    const handleNotificationDeleted = (event: CustomEvent) => {
      const { id } = event.detail;
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notifications.find(n => n.id === id && !n.read)) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    };

    window.addEventListener('new-notification', handleNewNotification as EventListener);
    window.addEventListener('notification-read', handleNotificationRead as EventListener);
    window.addEventListener('notifications-read', handleNotificationsRead as EventListener);
    window.addEventListener('all-notifications-read', handleAllNotificationsRead);
    window.addEventListener('notification-deleted', handleNotificationDeleted as EventListener);

    return () => {
      window.removeEventListener('new-notification', handleNewNotification as EventListener);
      window.removeEventListener('notification-read', handleNotificationRead as EventListener);
      window.removeEventListener('notifications-read', handleNotificationsRead as EventListener);
      window.removeEventListener('all-notifications-read', handleAllNotificationsRead);
      window.removeEventListener('notification-deleted', handleNotificationDeleted as EventListener);
    };
  }, [notifications]);

  // Load notifications
  const loadNotifications = useCallback(async (params?: any) => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications(params);
      setNotifications(data.notifications);
      setUnreadCount(data.unread);
      return data;
    } catch (error) {
      console.error('Failed to load notifications:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load notification stats
  const loadStats = useCallback(async () => {
    try {
      const data = await notificationService.getStats();
      setStats(data);
      return data;
    } catch (error) {
      console.error('Failed to load notification stats:', error);
      throw error;
    }
  }, []);

  // Mark as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      return true;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }, []);

  // Mark multiple as read
  const markMultipleAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      await notificationService.markMultipleAsRead(notificationIds);
      return true;
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
      throw error;
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      return true;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      return true;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }, []);

  // Request permission
  const requestPermission = useCallback(async () => {
    try {
      const granted = await notificationService.requestPermission();
      return granted;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    stats,
    loadNotifications,
    loadStats,
    markAsRead,
    markMultipleAsRead,
    markAllAsRead,
    deleteNotification,
    requestPermission,
  };
};