// Mobile App Integration Types

export interface MobileDevice {
  id: string;
  userId: string;
  deviceType: 'ios' | 'android';
  deviceModel: string;
  osVersion: string;
  appVersion: string;
  pushToken?: string;
  isActive: boolean;
  registeredAt: string;
}

export interface PushNotification {
  id: string;
  title: string;
  titleKh?: string;
  body: string;
  bodyKh?: string;
  type: NotificationType;
  data?: any;
  priority: 'high' | 'normal' | 'low';
  scheduledFor?: string;
  sentAt?: string;
  readAt?: string;
  actionUrl?: string;
}

export type NotificationType = 
  | 'observation_reminder'
  | 'observation_completed'
  | 'feedback_received'
  | 'plan_activity_due'
  | 'plan_updated'
  | 'report_ready'
  | 'app_update'
  | 'announcement';

export interface MobileAppConfig {
  apiUrl: string;
  sessionTimeout: number; // in minutes
  mediaCompressionQuality: number; // 0-1
  maxRetryAttempts: number;
  features: {
    pushNotifications: boolean;
    biometricAuth: boolean;
    mediaCompression: boolean;
    crashReporting: boolean;
    analytics: boolean;
  };
}

export interface MobileApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  serverTime: string;
}

export interface MobileBiometricAuth {
  isAvailable: boolean;
  isEnabled: boolean;
  type?: 'fingerprint' | 'faceId' | 'iris';
  lastAuthTime?: string;
  requiresReauth: boolean;
}

export interface MobileAppState {
  isActive: boolean;
  isBackground: boolean;
  lastActiveTime: string;
  currentRoute?: string;
  memoryUsage?: {
    used: number;
    available: number;
    total: number;
  };
}

export interface MobileCrashReport {
  id: string;
  timestamp: string;
  appVersion: string;
  osVersion: string;
  deviceModel: string;
  errorMessage: string;
  stackTrace: string;
  breadcrumbs: string[];
  userActions: string[];
  deviceInfo: {
    battery: number;
    orientation: 'portrait' | 'landscape';
    connectionType: string;
  };
}

export interface MobileAnalyticsEvent {
  name: string;
  category: 'user_action' | 'system' | 'error' | 'performance';
  properties?: Record<string, any>;
  timestamp: string;
  sessionId: string;
  userId?: string;
}

export interface MobileMediaUpload {
  id: string;
  uri: string;
  type: 'image' | 'video' | 'audio' | 'document';
  mimeType: string;
  size: number;
  thumbnail?: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    location?: {
      latitude: number;
      longitude: number;
    };
  };
}

export interface MobilePermissions {
  camera: 'granted' | 'denied' | 'not_determined';
  photos: 'granted' | 'denied' | 'not_determined';
  location: 'granted' | 'denied' | 'not_determined';
  notifications: 'granted' | 'denied' | 'not_determined';
  microphone: 'granted' | 'denied' | 'not_determined';
}