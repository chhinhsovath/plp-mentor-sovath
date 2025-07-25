import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Button,
  Chip,
  Badge,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Tabs,
  Tab,
  Tooltip,
  Alert,
  useTheme,
  alpha,
  Fade,
  Collapse,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  Circle as DotIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  DoneAll as MarkAllReadIcon,
  FilterList as FilterIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  Message as MessageIcon,
  EventNote as EventIcon,
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  Security as SecurityIcon,
  EmojiEvents as AchievementIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  VideoCall as VideoCallIcon,
  AttachFile as FileIcon,
  Announcement as AnnouncementIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import {
  Notification,
  NotificationType,
  NotificationCategory,
  NotificationPriority,
  NotificationStatus,
  NotificationPreferences,
} from '../../../types/communication';
import { User } from '../../../types/userManagement';

interface NotificationCenterProps {
  notifications: Notification[];
  preferences: NotificationPreferences;
  currentUser: User;
  onMarkAsRead: (notificationIds: string[]) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  onDeleteNotification: (notificationId: string) => Promise<void>;
  onDeleteAllRead: () => Promise<void>;
  onUpdatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  onNotificationClick: (notification: Notification) => void;
  onRefresh: () => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
  anchorEl?: HTMLElement | null;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notification-tabpanel-${index}`}
      aria-labelledby={`notification-tab-${index}`}
      {...other}
    >
      {value === index && children}
    </div>
  );
};

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  preferences,
  currentUser,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onDeleteAllRead,
  onUpdatePreferences,
  onNotificationClick,
  onRefresh,
  isOpen,
  onClose,
  anchorEl,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [filterCategory, setFilterCategory] = useState<NotificationCategory | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'read'>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [anchorElMenu, setAnchorElMenu] = useState<null | HTMLElement>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(n => n.category === filterCategory);
    }

    // Filter by status
    if (filterStatus === 'unread') {
      filtered = filtered.filter(n => !n.readAt);
    } else if (filterStatus === 'read') {
      filtered = filtered.filter(n => !!n.readAt);
    }

    // Sort by priority and timestamp
    return filtered.sort((a, b) => {
      const priorityOrder = { urgent: 3, high: 2, medium: 1, low: 0 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [notifications, filterCategory, filterStatus]);

  const unreadCount = notifications.filter(n => !n.readAt).length;

  const groupedNotifications = useMemo(() => {
    const groups: Record<string, Notification[]> = {};
    
    filteredNotifications.forEach(notification => {
      const date = new Date(notification.createdAt);
      let groupKey = '';
      
      if (isToday(date)) {
        groupKey = t('notifications.today');
      } else if (isYesterday(date)) {
        groupKey = t('notifications.yesterday');
      } else {
        groupKey = format(date, 'MMMM dd, yyyy');
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notification);
    });
    
    return groups;
  }, [filteredNotifications, t]);

  const getNotificationIcon = (type: NotificationType, category: NotificationCategory) => {
    switch (category) {
      case 'chat':
        return <MessageIcon />;
      case 'observations':
        return <AssignmentIcon />;
      case 'planning':
        return <EventIcon />;
      case 'meetings':
        return <VideoCallIcon />;
      case 'system':
        return <InfoIcon />;
      case 'security':
        return <SecurityIcon />;
      case 'achievements':
        return <AchievementIcon />;
      case 'deadlines':
        return <ScheduleIcon />;
      default:
        switch (type) {
          case 'message':
          case 'mention':
            return <MessageIcon />;
          case 'meeting_invite':
          case 'meeting_reminder':
            return <VideoCallIcon />;
          case 'user_joined':
          case 'user_left':
            return <PersonIcon />;
          case 'file_shared':
            return <FileIcon />;
          case 'system_announcement':
            return <AnnouncementIcon />;
          case 'security_alert':
            return <SecurityIcon />;
          case 'achievement':
            return <AchievementIcon />;
          default:
            return <InfoIcon />;
        }
    }
  };

  const getNotificationColor = (priority: NotificationPriority, isRead: boolean) => {
    if (isRead) return theme.palette.text.secondary;
    
    switch (priority) {
      case 'urgent':
        return theme.palette.error.main;
      case 'high':
        return theme.palette.warning.main;
      case 'medium':
        return theme.palette.info.main;
      case 'low':
        return theme.palette.text.primary;
      default:
        return theme.palette.text.primary;
    }
  };

  const getPriorityChip = (priority: NotificationPriority) => {
    const colors = {
      urgent: 'error',
      high: 'warning',
      medium: 'info',
      low: 'default',
    } as const;

    return (
      <Chip
        label={t(`notifications.priority.${priority}`)}
        size="small"
        color={colors[priority]}
        variant="outlined"
        sx={{ height: 20, fontSize: '0.7rem' }}
      />
    );
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.readAt) {
      onMarkAsRead([notification.id]);
    }
    onNotificationClick(notification);
  };

  const handleBulkAction = (action: string) => {
    switch (action) {
      case 'markAllRead':
        onMarkAllAsRead();
        break;
      case 'deleteAllRead':
        onDeleteAllRead();
        break;
    }
  };

  const renderNotificationItem = (notification: Notification) => {
    const isRead = !!notification.readAt;
    const iconColor = getNotificationColor(notification.priority, isRead);
    const title = i18n.language === 'km' && notification.titleKh ? notification.titleKh : notification.title;
    const message = i18n.language === 'km' && notification.messageKh ? notification.messageKh : notification.message;

    return (
      <ListItem
        key={notification.id}
        button
        onClick={() => handleNotificationClick(notification)}
        sx={{
          backgroundColor: isRead ? 'transparent' : alpha(theme.palette.primary.main, 0.05),
          borderLeft: isRead ? 'none' : `3px solid ${iconColor}`,
          '&:hover': {
            backgroundColor: alpha(theme.palette.action.hover, 0.1),
          },
        }}
      >
        <ListItemAvatar>
          <Avatar
            sx={{
              backgroundColor: alpha(iconColor, 0.1),
              color: iconColor,
              width: 40,
              height: 40,
            }}
          >
            {getNotificationIcon(notification.type, notification.category)}
          </Avatar>
        </ListItemAvatar>

        <ListItemText
          primary={
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: isRead ? 400 : 600,
                  color: isRead ? 'text.secondary' : 'text.primary',
                  flex: 1,
                  mr: 1,
                }}
              >
                {title}
              </Typography>
              <Stack direction="row" spacing={0.5} alignItems="center">
                {notification.priority !== 'low' && getPriorityChip(notification.priority)}
                <Typography variant="caption" color="text.secondary">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </Typography>
              </Stack>
            </Stack>
          }
          secondary={
            <Box>
              <Typography
                variant="body2"
                color={isRead ? 'text.secondary' : 'text.primary'}
                sx={{
                  mt: 0.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {message}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                <Chip
                  label={t(`notifications.category.${notification.category}`)}
                  size="small"
                  variant="outlined"
                  sx={{ height: 18, fontSize: '0.65rem' }}
                />
                {notification.data.actionRequired && (
                  <Chip
                    label={t('notifications.actionRequired')}
                    size="small"
                    color="warning"
                    sx={{ height: 18, fontSize: '0.65rem' }}
                  />
                )}
              </Stack>
            </Box>
          }
        />

        <ListItemSecondaryAction>
          <Stack direction="row" alignItems="center">
            {!isRead && (
              <DotIcon
                sx={{
                  color: theme.palette.primary.main,
                  fontSize: 12,
                  mr: 1,
                }}
              />
            )}
            <IconButton
              edge="end"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setAnchorElMenu(e.currentTarget);
                setSelectedNotification(notification);
              }}
            >
              <MoreIcon />
            </IconButton>
          </Stack>
        </ListItemSecondaryAction>
      </ListItem>
    );
  };

  const renderNotificationsList = () => {
    if (filteredNotifications.length === 0) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <NotificationsOffIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t('notifications.noNotifications')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filterStatus === 'unread'
              ? t('notifications.noUnreadNotifications')
              : t('notifications.allCaughtUp')
            }
          </Typography>
        </Box>
      );
    }

    return (
      <List sx={{ p: 0 }}>
        {Object.entries(groupedNotifications).map(([groupKey, groupNotifications]) => (
          <React.Fragment key={groupKey}>
            <ListItem sx={{ backgroundColor: 'grey.50', py: 1 }}>
              <Typography variant="caption" fontWeight="medium" color="text.secondary">
                {groupKey}
              </Typography>
            </ListItem>
            {groupNotifications.map(renderNotificationItem)}
          </React.Fragment>
        ))}
      </List>
    );
  };

  const renderFilters = () => (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>{t('notifications.category')}</InputLabel>
        <Select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as NotificationCategory | 'all')}
          label={t('notifications.category')}
        >
          <MenuItem value="all">{t('common.all')}</MenuItem>
          <MenuItem value="chat">{t('notifications.category.chat')}</MenuItem>
          <MenuItem value="observations">{t('notifications.category.observations')}</MenuItem>
          <MenuItem value="planning">{t('notifications.category.planning')}</MenuItem>
          <MenuItem value="meetings">{t('notifications.category.meetings')}</MenuItem>
          <MenuItem value="system">{t('notifications.category.system')}</MenuItem>
          <MenuItem value="security">{t('notifications.category.security')}</MenuItem>
          <MenuItem value="achievements">{t('notifications.category.achievements')}</MenuItem>
          <MenuItem value="deadlines">{t('notifications.category.deadlines')}</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 100 }}>
        <InputLabel>{t('notifications.status')}</InputLabel>
        <Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'all' | 'unread' | 'read')}
          label={t('notifications.status')}
        >
          <MenuItem value="all">{t('common.all')}</MenuItem>
          <MenuItem value="unread">{t('notifications.unread')}</MenuItem>
          <MenuItem value="read">{t('notifications.read')}</MenuItem>
        </Select>
      </FormControl>

      <Box sx={{ flexGrow: 1 }} />

      <Button
        size="small"
        onClick={() => handleBulkAction('markAllRead')}
        disabled={unreadCount === 0}
        startIcon={<MarkAllReadIcon />}
      >
        {t('notifications.markAllRead')}
      </Button>

      <IconButton onClick={() => setShowSettings(true)}>
        <SettingsIcon />
      </IconButton>
    </Stack>
  );

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { height: '80vh', maxHeight: 800 },
        }}
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" alignItems="center" spacing={2}>
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
              <Typography variant="h6">{t('notifications.title')}</Typography>
            </Stack>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab 
              label={
                <Badge badgeContent={unreadCount} color="error">
                  {t('notifications.all')}
                </Badge>
              } 
            />
            <Tab label={t('notifications.unread')} onClick={() => setFilterStatus('unread')} />
            <Tab label={t('notifications.archive')} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {renderFilters()}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {renderNotificationsList()}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {renderFilters()}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {renderNotificationsList()}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              {t('notifications.archiveFeature')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('notifications.archiveDescription')}
            </Typography>
          </Box>
        </TabPanel>
      </Dialog>

      {/* Notification Context Menu */}
      <Menu
        anchorEl={anchorElMenu}
        open={Boolean(anchorElMenu)}
        onClose={() => {
          setAnchorElMenu(null);
          setSelectedNotification(null);
        }}
      >
        {selectedNotification && (
          <>
            {!selectedNotification.readAt ? (
              <MenuItem onClick={() => {
                onMarkAsRead([selectedNotification.id]);
                setAnchorElMenu(null);
                setSelectedNotification(null);
              }}>
                <CheckIcon sx={{ mr: 1 }} />
                {t('notifications.markAsRead')}
              </MenuItem>
            ) : (
              <MenuItem onClick={() => {
                // Mark as unread functionality
                setAnchorElMenu(null);
                setSelectedNotification(null);
              }}>
                <DotIcon sx={{ mr: 1 }} />
                {t('notifications.markAsUnread')}
              </MenuItem>
            )}
            <MenuItem onClick={() => {
              onDeleteNotification(selectedNotification.id);
              setAnchorElMenu(null);
              setSelectedNotification(null);
            }}>
              <DeleteIcon sx={{ mr: 1 }} />
              {t('notifications.delete')}
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Settings Dialog */}
      <Dialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('notifications.settings')}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Typography variant="h6">{t('notifications.preferences')}</Typography>
            
            {/* Notification channel preferences */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t('notifications.channels')}
              </Typography>
              <Stack spacing={1}>
                {Object.entries(preferences.channels).map(([channel, enabled]) => (
                  <Stack key={channel} direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">
                      {t(`notifications.channels.${channel}`)}
                    </Typography>
                    <Button
                      size="small"
                      variant={enabled ? 'contained' : 'outlined'}
                      onClick={() => onUpdatePreferences({
                        channels: { ...preferences.channels, [channel]: !enabled }
                      })}
                    >
                      {enabled ? t('common.enabled') : t('common.disabled')}
                    </Button>
                  </Stack>
                ))}
              </Stack>
            </Box>

            {/* Category preferences */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t('notifications.categories')}
              </Typography>
              <Stack spacing={1}>
                {Object.entries(preferences.categories).map(([category, settings]) => (
                  <Stack key={category} direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">
                      {t(`notifications.category.${category}`)}
                    </Typography>
                    <Button
                      size="small"
                      variant={settings.enabled ? 'contained' : 'outlined'}
                      onClick={() => onUpdatePreferences({
                        categories: {
                          ...preferences.categories,
                          [category]: { ...settings, enabled: !settings.enabled }
                        }
                      })}
                    >
                      {settings.enabled ? t('common.enabled') : t('common.disabled')}
                    </Button>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NotificationCenter;