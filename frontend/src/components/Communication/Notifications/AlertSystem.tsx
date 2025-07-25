import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Snackbar,
  Alert,
  AlertTitle,
  IconButton,
  Button,
  Stack,
  Typography,
  Badge,
  Fade,
  Slide,
  useTheme,
  Portal,
} from '@mui/material';
import {
  Close as CloseIcon,
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Schedule as ScheduleIcon,
  Message as MessageIcon,
  VideoCall as VideoCallIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import {
  Notification,
  NotificationType,
  NotificationPriority,
} from '../../../types/communication';

interface AlertSystemProps {
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onDismiss: (notificationId: string) => void;
  onDismissAll: () => void;
  maxVisible?: number;
  autoHideDuration?: number;
  enableSound?: boolean;
  position?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
}

interface AlertItem {
  id: string;
  notification: Notification;
  timestamp: number;
  dismissed: boolean;
}

const AlertSystem: React.FC<AlertSystemProps> = ({
  notifications,
  onNotificationClick,
  onDismiss,
  onDismissAll,
  maxVisible = 5,
  autoHideDuration = 6000,
  enableSound = true,
  position = { vertical: 'top', horizontal: 'right' },
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  // Initialize audio context for notification sounds
  useEffect(() => {
    if (enableSound && typeof window !== 'undefined') {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(ctx);
        
        return () => {
          ctx.close();
        };
      } catch (error) {
        console.warn('Audio context not supported:', error);
      }
    }
  }, [enableSound]);

  // Play notification sound
  const playNotificationSound = useCallback((priority: NotificationPriority) => {
    if (!audioContext || !enableSound) return;

    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different frequencies for different priorities
      const frequencies = {
        urgent: [800, 1000, 800],
        high: [600, 800],
        medium: [500],
        low: [400],
      };
      
      const freqs = frequencies[priority] || frequencies.medium;
      const duration = 0.1;
      
      freqs.forEach((freq, index) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.frequency.value = freq;
        osc.type = 'sine';
        
        gain.gain.setValueAtTime(0, audioContext.currentTime + index * duration);
        gain.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + index * duration + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + (index + 1) * duration);
        
        osc.start(audioContext.currentTime + index * duration);
        osc.stop(audioContext.currentTime + (index + 1) * duration);
      });
    } catch (error) {
      console.warn('Error playing notification sound:', error);
    }
  }, [audioContext, enableSound]);

  // Add new notifications to alerts
  useEffect(() => {
    const now = Date.now();
    const newAlerts = notifications
      .filter(notification => {
        // Only show recent notifications that aren't already displayed
        const isRecent = now - new Date(notification.createdAt).getTime() < 30000; // 30 seconds
        const notAlreadyShown = !alerts.some(alert => alert.notification.id === notification.id);
        return isRecent && notAlreadyShown && notification.status === 'delivered';
      })
      .map(notification => ({
        id: notification.id,
        notification,
        timestamp: now,
        dismissed: false,
      }));

    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev, ...newAlerts].slice(-maxVisible));
      
      // Play sound for highest priority notification
      const highestPriority = newAlerts.reduce((highest, alert) => {
        const priorities = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorities[alert.notification.priority] > priorities[highest.notification.priority] 
          ? alert : highest;
      });
      
      playNotificationSound(highestPriority.notification.priority);
    }
  }, [notifications, alerts, maxVisible, playNotificationSound]);

  // Auto-dismiss alerts
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setAlerts(prev => prev.filter(alert => {
        const age = now - alert.timestamp;
        const shouldKeep = age < autoHideDuration && !alert.dismissed;
        
        if (!shouldKeep && !alert.dismissed) {
          // Auto-dismiss
          onDismiss(alert.notification.id);
        }
        
        return shouldKeep;
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [autoHideDuration, onDismiss]);

  const handleAlertClick = (alert: AlertItem) => {
    onNotificationClick(alert.notification);
    handleDismiss(alert.id);
  };

  const handleDismiss = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, dismissed: true }
          : alert
      )
    );
    
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      onDismiss(alertId);
    }, 300);
  };

  const getAlertSeverity = (priority: NotificationPriority, type: NotificationType) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'info';
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'message':
      case 'mention':
        return <MessageIcon />;
      case 'meeting_invite':
      case 'meeting_reminder':
        return <VideoCallIcon />;
      case 'observation_due':
      case 'observation_completed':
      case 'plan_due':
      case 'plan_approved':
      case 'plan_rejected':
        return <AssignmentIcon />;
      case 'deadline_reminder':
        return <ScheduleIcon />;
      case 'security_alert':
        return <ErrorIcon />;
      case 'system_announcement':
        return <InfoIcon />;
      case 'achievement':
        return <SuccessIcon />;
      default:
        return <NotificationsIcon />;
    }
  };

  const getPositionStyles = () => {
    const { vertical, horizontal } = position;
    
    return {
      position: 'fixed' as const,
      zIndex: theme.zIndex.snackbar,
      [vertical]: 24,
      [horizontal === 'center' ? 'left' : horizontal]: horizontal === 'center' ? '50%' : 24,
      transform: horizontal === 'center' ? 'translateX(-50%)' : 'none',
      width: horizontal === 'center' ? 'auto' : 400,
      maxWidth: '90vw',
    };
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <Portal>
      <Box sx={getPositionStyles()}>
        <Stack spacing={1}>
          {alerts.map((alert, index) => {
            const { notification } = alert;
            const title = i18n.language === 'km' && notification.titleKh 
              ? notification.titleKh 
              : notification.title;
            const message = i18n.language === 'km' && notification.messageKh 
              ? notification.messageKh 
              : notification.message;

            return (
              <Fade
                key={alert.id}
                in={!alert.dismissed}
                timeout={300}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <Alert
                  severity={getAlertSeverity(notification.priority, notification.type)}
                  icon={getNotificationIcon(notification.type)}
                  action={
                    <Stack direction="row" spacing={1} alignItems="center">
                      {notification.data.actionRequired && (
                        <Button
                          size="small"
                          color="inherit"
                          onClick={() => handleAlertClick(alert)}
                        >
                          {t('notifications.viewDetails')}
                        </Button>
                      )}
                      <IconButton
                        size="small"
                        color="inherit"
                        onClick={() => handleDismiss(alert.id)}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  }
                  sx={{
                    width: '100%',
                    cursor: notification.data.actionRequired ? 'pointer' : 'default',
                    boxShadow: theme.shadows[6],
                    '&:hover': notification.data.actionRequired ? {
                      boxShadow: theme.shadows[8],
                    } : {},
                    transition: 'box-shadow 0.2s ease-in-out',
                  }}
                  onClick={notification.data.actionRequired ? () => handleAlertClick(alert) : undefined}
                >
                  <AlertTitle sx={{ fontWeight: 600 }}>
                    {title}
                    {notification.priority === 'urgent' && (
                      <Badge
                        badgeContent="!"
                        color="error"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </AlertTitle>
                  <Typography variant="body2">
                    {message}
                  </Typography>
                  
                  {notification.data.actionRequired && (
                    <Typography variant="caption" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                      {t('notifications.tapToView')}
                    </Typography>
                  )}
                </Alert>
              </Fade>
            );
          })}

          {alerts.length > 3 && (
            <Fade in timeout={300}>
              <Alert
                severity="info"
                action={
                  <Button
                    size="small"
                    color="inherit"
                    onClick={onDismissAll}
                  >
                    {t('notifications.dismissAll')}
                  </Button>
                }
                sx={{
                  boxShadow: theme.shadows[4],
                }}
              >
                <Typography variant="body2">
                  {t('notifications.moreNotifications', { count: alerts.length - 3 })}
                </Typography>
              </Alert>
            </Fade>
          )}
        </Stack>
      </Box>
    </Portal>
  );
};

// Hook for managing alert system state
export const useAlertSystem = () => {
  const [enableSound, setEnableSound] = useState(true);
  const [position, setPosition] = useState<{
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  }>({ vertical: 'top', horizontal: 'right' });

  const toggleSound = useCallback(() => {
    setEnableSound(prev => !prev);
  }, []);

  const updatePosition = useCallback((newPosition: typeof position) => {
    setPosition(newPosition);
  }, []);

  return {
    enableSound,
    position,
    toggleSound,
    updatePosition,
  };
};

export default AlertSystem;