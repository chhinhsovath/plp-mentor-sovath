import axios from 'axios';
import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.example.com';

export interface NotificationPreferences {
  email: {
    enabled: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
    types: NotificationType[];
  };
  sms: {
    enabled: boolean;
    types: NotificationType[];
  };
  inApp: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
  };
}

export type NotificationType = 
  | 'mission_created'
  | 'mission_approved'
  | 'mission_rejected'
  | 'mission_reminder'
  | 'observation_created'
  | 'observation_completed'
  | 'observation_feedback'
  | 'approval_required'
  | 'approval_granted'
  | 'approval_rejected'
  | 'report_generated'
  | 'announcement'
  | 'system_alert'
  | 'deadline_approaching'
  | 'user_mention'
  | 'role_changed'
  | 'password_changed'
  | 'login_alert';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  readAt?: string;
  createdAt: string;
  expiresAt?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actions?: NotificationAction[];
  groupId?: string; // For grouping similar notifications
  category: 'mission' | 'observation' | 'approval' | 'system' | 'user' | 'announcement';
}

export interface NotificationAction {
  label: string;
  url?: string;
  action?: string;
  primary?: boolean;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<string, number>;
}

class NotificationService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private notificationSound: HTMLAudioElement | null = null;

  constructor() {
    // Initialize notification sound
    this.notificationSound = new Audio('/notification.mp3');
    this.notificationSound.volume = 0.5;
  }

  // Initialize WebSocket connection for real-time notifications
  initializeSocket(token: string) {
    this.token = token;
    
    this.socket = io(`${API_URL}/notifications`, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to notification service');
      this.reconnectAttempts = 0;
    });

    this.socket.on('notification', (notification: Notification) => {
      this.handleIncomingNotification(notification);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from notification service');
    });

    this.socket.on('reconnect_attempt', (attempt) => {
      this.reconnectAttempts = attempt;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Failed to reconnect to notification service');
    });
  }

  // Handle incoming real-time notification
  private async handleIncomingNotification(notification: Notification) {
    // Check user preferences
    const preferences = await this.getPreferences();
    
    if (!preferences.inApp.enabled) return;

    // Show browser notification if enabled
    if (preferences.inApp.desktop && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        this.showDesktopNotification(notification);
      }
    }

    // Play sound if enabled
    if (preferences.inApp.sound && this.notificationSound) {
      try {
        await this.notificationSound.play();
      } catch (error) {
        console.error('Failed to play notification sound:', error);
      }
    }

    // Emit event for UI updates
    window.dispatchEvent(new CustomEvent('new-notification', { detail: notification }));
  }

  // Show desktop notification
  private showDesktopNotification(notification: Notification) {
    const options: NotificationOptions = {
      body: notification.message,
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: notification.id,
      requireInteraction: notification.priority === 'urgent',
      actions: notification.actions?.map(action => ({
        action: action.action || action.url || '',
        title: action.label,
      })) || [],
    };

    const desktopNotification = new Notification(notification.title, options);

    desktopNotification.onclick = () => {
      window.focus();
      if (notification.actions?.[0]?.url) {
        window.location.href = notification.actions[0].url;
      }
      desktopNotification.close();
    };
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  // Get user notification preferences
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const response = await axios.get(`${API_URL}/api/notifications/preferences`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      // Return default preferences
      return {
        email: {
          enabled: true,
          frequency: 'immediate',
          types: ['mission_created', 'observation_created', 'approval_required'],
        },
        sms: {
          enabled: false,
          types: ['urgent', 'approval_required'],
        },
        inApp: {
          enabled: true,
          sound: true,
          desktop: false,
        },
      };
    }
  }

  // Update notification preferences
  async updatePreferences(preferences: NotificationPreferences): Promise<void> {
    try {
      await axios.put(
        `${API_URL}/api/notifications/preferences`,
        preferences,
        {
          headers: { Authorization: `Bearer ${this.token}` },
        }
      );
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw error;
    }
  }

  // Get notifications with pagination and filters
  async getNotifications(params: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    type?: NotificationType[];
    priority?: string[];
    startDate?: string;
    endDate?: string;
  } = {}): Promise<{
    notifications: Notification[];
    total: number;
    unread: number;
  }> {
    try {
      const response = await axios.get(`${API_URL}/api/notifications`, {
        params,
        headers: { Authorization: `Bearer ${this.token}` },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get notifications:', error);
      throw error;
    }
  }

  // Get notification statistics
  async getStats(): Promise<NotificationStats> {
    try {
      const response = await axios.get(`${API_URL}/api/notifications/stats`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get notification stats:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await axios.put(
        `${API_URL}/api/notifications/${notificationId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${this.token}` },
        }
      );
      
      // Emit event for UI updates
      window.dispatchEvent(new CustomEvent('notification-read', { detail: { id: notificationId } }));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  // Mark multiple notifications as read
  async markMultipleAsRead(notificationIds: string[]): Promise<void> {
    try {
      await axios.put(
        `${API_URL}/api/notifications/read`,
        { ids: notificationIds },
        {
          headers: { Authorization: `Bearer ${this.token}` },
        }
      );
      
      // Emit event for UI updates
      window.dispatchEvent(new CustomEvent('notifications-read', { detail: { ids: notificationIds } }));
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    try {
      await axios.put(
        `${API_URL}/api/notifications/read-all`,
        {},
        {
          headers: { Authorization: `Bearer ${this.token}` },
        }
      );
      
      // Emit event for UI updates
      window.dispatchEvent(new CustomEvent('all-notifications-read'));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await axios.delete(`${API_URL}/api/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      
      // Emit event for UI updates
      window.dispatchEvent(new CustomEvent('notification-deleted', { detail: { id: notificationId } }));
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }

  // Send notification (for admin/system use)
  async sendNotification(data: {
    userId?: string;
    userIds?: string[];
    roleIds?: string[];
    type: NotificationType;
    title: string;
    message: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    data?: any;
    actions?: NotificationAction[];
    expiresAt?: string;
  }): Promise<void> {
    try {
      await axios.post(
        `${API_URL}/api/notifications/send`,
        data,
        {
          headers: { Authorization: `Bearer ${this.token}` },
        }
      );
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }

  // Subscribe to push notifications
  async subscribeToPush(subscription: PushSubscription): Promise<void> {
    try {
      await axios.post(
        `${API_URL}/api/notifications/push/subscribe`,
        subscription,
        {
          headers: { Authorization: `Bearer ${this.token}` },
        }
      );
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribeFromPush(): Promise<void> {
    try {
      await axios.delete(`${API_URL}/api/notifications/push/unsubscribe`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      throw error;
    }
  }

  // Test notification
  async testNotification(type: 'email' | 'sms' | 'push'): Promise<void> {
    try {
      await axios.post(
        `${API_URL}/api/notifications/test`,
        { type },
        {
          headers: { Authorization: `Bearer ${this.token}` },
        }
      );
    } catch (error) {
      console.error('Failed to send test notification:', error);
      throw error;
    }
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const notificationService = new NotificationService();