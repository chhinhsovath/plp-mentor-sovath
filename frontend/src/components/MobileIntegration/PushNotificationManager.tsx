import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Badge,
  Chip,
  Switch,
  FormControlLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Tooltip,
  Collapse,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  Schedule as ScheduleIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Feedback as FeedbackIcon,
  Report as ReportIcon,
  Update as UpdateIcon,
  Campaign as AnnouncementIcon,
  MarkEmailRead as ReadIcon,
  MarkEmailUnread as UnreadIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format, formatDistanceToNow } from 'date-fns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { PushNotification, NotificationType, MobileDevice } from '../../types/mobile';

interface PushNotificationManagerProps {
  notifications: PushNotification[];
  devices: MobileDevice[];
  notificationSettings: NotificationSettings;
  onUpdateSettings: (settings: NotificationSettings) => Promise<void>;
  onSendNotification: (notification: Omit<PushNotification, 'id' | 'sentAt'>) => Promise<void>;
  onDeleteNotification: (id: string) => Promise<void>;
  onMarkAsRead: (id: string) => Promise<void>;
  onScheduleNotification: (notification: Omit<PushNotification, 'id' | 'sentAt'>) => Promise<void>;
  onTestNotification: (deviceId: string) => Promise<void>;
}

interface NotificationSettings {
  enabled: boolean;
  types: {
    [key in NotificationType]: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  sound: boolean;
  vibration: boolean;
  preview: boolean;
  grouping: boolean;
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
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const PushNotificationManager: React.FC<PushNotificationManagerProps> = ({
  notifications,
  devices,
  notificationSettings,
  onUpdateSettings,
  onSendNotification,
  onDeleteNotification,
  onMarkAsRead,
  onScheduleNotification,
  onTestNotification,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [showNewNotificationDialog, setShowNewNotificationDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<PushNotification | null>(null);
  const [expandedTypes, setExpandedTypes] = useState<NotificationType[]>([]);
  const [newNotification, setNewNotification] = useState<Partial<PushNotification>>({
    title: '',
    body: '',
    type: 'announcement',
    priority: 'normal',
  });
  const [settings, setSettings] = useState<NotificationSettings>(notificationSettings);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'observation_reminder':
      case 'observation_completed':
        return <SchoolIcon />;
      case 'feedback_received':
        return <FeedbackIcon />;
      case 'plan_activity_due':
      case 'plan_updated':
        return <AssignmentIcon />;
      case 'report_ready':
        return <ReportIcon />;
      case 'sync_completed':
      case 'sync_failed':
        return <SyncIcon />;
      case 'app_update':
        return <UpdateIcon />;
      case 'announcement':
        return <AnnouncementIcon />;
      default:
        return <NotificationsIcon />;
    }
  };

  const getNotificationColor = (type: NotificationType): any => {
    switch (type) {
      case 'observation_reminder':
      case 'plan_activity_due':
        return 'warning';
      case 'sync_failed':
        return 'error';
      case 'observation_completed':
      case 'sync_completed':
        return 'success';
      case 'app_update':
      case 'announcement':
        return 'info';
      default:
        return 'primary';
    }
  };

  const getGroupedNotifications = () => {
    const grouped: Record<NotificationType, PushNotification[]> = {} as any;
    
    notifications.forEach(notification => {
      if (!grouped[notification.type]) {
        grouped[notification.type] = [];
      }
      grouped[notification.type].push(notification);
    });

    return grouped;
  };

  const toggleTypeExpanded = (type: NotificationType) => {
    setExpandedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleSendNotification = async () => {
    if (newNotification.title && newNotification.body) {
      if (newNotification.scheduledFor) {
        await onScheduleNotification(newNotification as any);
      } else {
        await onSendNotification(newNotification as any);
      }
      setShowNewNotificationDialog(false);
      setNewNotification({
        title: '',
        body: '',
        type: 'announcement',
        priority: 'normal',
      });
    }
  };

  const handleUpdateSettings = async () => {
    await onUpdateSettings(settings);
    setShowSettingsDialog(false);
  };

  const renderNotificationList = () => {
    const groupedNotifications = getGroupedNotifications();
    const types = Object.keys(groupedNotifications) as NotificationType[];

    if (types.length === 0) {
      return (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {t('notifications.empty')}
          </Typography>
        </Box>
      );
    }

    return (
      <List>
        {types.map(type => {
          const typeNotifications = groupedNotifications[type];
          const unreadCount = typeNotifications.filter(n => !n.readAt).length;

          return (
            <Box key={type}>
              <ListItem
                button
                onClick={() => toggleTypeExpanded(type)}
                sx={{
                  backgroundColor: alpha(theme.palette.background.paper, 0.5),
                  mb: 1,
                }}
              >
                <ListItemIcon>
                  <Badge badgeContent={unreadCount} color="error">
                    {getNotificationIcon(type)}
                  </Badge>
                </ListItemIcon>
                <ListItemText
                  primary={t(`notifications.type.${type}`)}
                  secondary={t('notifications.count', { count: typeNotifications.length })}
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" size="small">
                    {expandedTypes.includes(type) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>

              <Collapse in={expandedTypes.includes(type)}>
                <List disablePadding sx={{ pl: 4 }}>
                  {typeNotifications.map(notification => (
                    <ListItem
                      key={notification.id}
                      sx={{
                        opacity: notification.readAt ? 0.7 : 1,
                        backgroundColor: notification.readAt ? 'transparent' : alpha(theme.palette.primary.main, 0.05),
                      }}
                    >
                      <ListItemIcon>
                        {notification.readAt ? <ReadIcon /> : <UnreadIcon color="primary" />}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2">
                              {i18n.language === 'km' ? notification.titleKh || notification.title : notification.title}
                            </Typography>
                            <Chip
                              label={t(`notifications.priority.${notification.priority}`)}
                              size="small"
                              color={
                                notification.priority === 'high' ? 'error' :
                                notification.priority === 'low' ? 'default' : 'primary'
                              }
                              variant="outlined"
                            />
                          </Stack>
                        }
                        secondary={
                          <Stack spacing={0.5}>
                            <Typography variant="caption">
                              {i18n.language === 'km' ? notification.bodyKh || notification.body : notification.body}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {notification.sentAt
                                ? formatDistanceToNow(new Date(notification.sentAt), { addSuffix: true })
                                : t('notifications.scheduled', {
                                    time: format(new Date(notification.scheduledFor!), 'PP p'),
                                  })}
                            </Typography>
                          </Stack>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Stack direction="row" spacing={1}>
                          {!notification.readAt && (
                            <Tooltip title={t('notifications.markAsRead')}>
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={() => onMarkAsRead(notification.id)}
                              >
                                <CheckCircle />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title={t('common.delete')}>
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={() => onDeleteNotification(notification.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </Box>
          );
        })}
      </List>
    );
  };

  const renderDeviceList = () => {
    if (devices.length === 0) {
      return (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {t('notifications.noDevices')}
          </Typography>
        </Box>
      );
    }

    return (
      <List>
        {devices.map(device => (
          <ListItem key={device.id}>
            <ListItemIcon>
              <Chip
                label={device.deviceType.toUpperCase()}
                size="small"
                color={device.isActive ? 'success' : 'default'}
              />
            </ListItemIcon>
            <ListItemText
              primary={device.deviceModel}
              secondary={
                <Stack spacing={0.5}>
                  <Typography variant="caption">
                    {t('notifications.osVersion')}: {device.osVersion} | {t('notifications.appVersion')}: {device.appVersion}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('notifications.registeredAt')}: {format(new Date(device.registeredAt), 'PP')}
                  </Typography>
                  {device.pushToken && (
                    <Chip
                      icon={<NotificationsActiveIcon />}
                      label={t('notifications.pushEnabled')}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Stack>
              }
            />
            <ListItemSecondaryAction>
              <Button
                size="small"
                variant="outlined"
                onClick={() => onTestNotification(device.id)}
                disabled={!device.pushToken || !device.isActive}
              >
                {t('notifications.test')}
              </Button>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    );
  };

  const renderStatistics = () => {
    const totalSent = notifications.filter(n => n.sentAt).length;
    const totalRead = notifications.filter(n => n.readAt).length;
    const totalScheduled = notifications.filter(n => n.scheduledFor && !n.sentAt).length;
    const readRate = totalSent > 0 ? (totalRead / totalSent) * 100 : 0;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={1}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('notifications.totalSent')}
                </Typography>
                <Typography variant="h4">{totalSent}</Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={1}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('notifications.totalRead')}
                </Typography>
                <Typography variant="h4">{totalRead}</Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={1}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('notifications.readRate')}
                </Typography>
                <Typography variant="h4">{readRate.toFixed(1)}%</Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={1}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('notifications.scheduled')}
                </Typography>
                <Typography variant="h4">{totalScheduled}</Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={2} alignItems="center">
              <Badge
                badgeContent={notifications.filter(n => !n.readAt).length}
                color="error"
              >
                <NotificationsIcon color="primary" />
              </Badge>
              <Typography variant="h6">{t('notifications.title')}</Typography>
              <Chip
                icon={
                  notificationSettings.enabled ? (
                    <NotificationsActiveIcon />
                  ) : (
                    <NotificationsOffIcon />
                  )
                }
                label={
                  notificationSettings.enabled
                    ? t('notifications.enabled')
                    : t('notifications.disabled')
                }
                color={notificationSettings.enabled ? 'success' : 'default'}
                size="small"
              />
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={() => setShowNewNotificationDialog(true)}
                size="small"
              >
                {t('notifications.send')}
              </Button>
              <IconButton onClick={() => setShowSettingsDialog(true)} size="small">
                <SettingsIcon />
              </IconButton>
            </Stack>
          </Stack>

          {/* Tabs */}
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label={t('notifications.notifications')} />
            <Tab label={t('notifications.devices')} />
            <Tab label={t('notifications.statistics')} />
          </Tabs>

          {/* Tab Panels */}
          <TabPanel value={tabValue} index={0}>
            {renderNotificationList()}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {renderDeviceList()}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {renderStatistics()}
          </TabPanel>
        </Stack>
      </Paper>

      {/* New Notification Dialog */}
      <Dialog
        open={showNewNotificationDialog}
        onClose={() => setShowNewNotificationDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('notifications.newNotification')}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label={t('notifications.title')}
              value={newNotification.title}
              onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label={t('notifications.titleKh')}
              value={newNotification.titleKh || ''}
              onChange={(e) => setNewNotification({ ...newNotification, titleKh: e.target.value })}
              helperText={t('notifications.optional')}
            />
            <TextField
              fullWidth
              label={t('notifications.body')}
              value={newNotification.body}
              onChange={(e) => setNewNotification({ ...newNotification, body: e.target.value })}
              multiline
              rows={3}
              required
            />
            <TextField
              fullWidth
              label={t('notifications.bodyKh')}
              value={newNotification.bodyKh || ''}
              onChange={(e) => setNewNotification({ ...newNotification, bodyKh: e.target.value })}
              multiline
              rows={3}
              helperText={t('notifications.optional')}
            />
            <FormControl fullWidth>
              <InputLabel>{t('notifications.type')}</InputLabel>
              <Select
                value={newNotification.type}
                onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value as NotificationType })}
                label={t('notifications.type')}
              >
                <MenuItem value="announcement">{t('notifications.type.announcement')}</MenuItem>
                <MenuItem value="observation_reminder">{t('notifications.type.observation_reminder')}</MenuItem>
                <MenuItem value="plan_activity_due">{t('notifications.type.plan_activity_due')}</MenuItem>
                <MenuItem value="app_update">{t('notifications.type.app_update')}</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>{t('notifications.priority')}</InputLabel>
              <Select
                value={newNotification.priority}
                onChange={(e) => setNewNotification({ ...newNotification, priority: e.target.value as any })}
                label={t('notifications.priority')}
              >
                <MenuItem value="low">{t('notifications.priority.low')}</MenuItem>
                <MenuItem value="normal">{t('notifications.priority.normal')}</MenuItem>
                <MenuItem value="high">{t('notifications.priority.high')}</MenuItem>
              </Select>
            </FormControl>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label={t('notifications.scheduleFor')}
                value={newNotification.scheduledFor ? new Date(newNotification.scheduledFor) : null}
                onChange={(date) => setNewNotification({ ...newNotification, scheduledFor: date?.toISOString() })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    helperText: t('notifications.scheduleHelp'),
                  },
                }}
              />
            </LocalizationProvider>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewNotificationDialog(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSendNotification}
            disabled={!newNotification.title || !newNotification.body}
          >
            {newNotification.scheduledFor ? t('notifications.schedule') : t('notifications.send')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog
        open={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('notifications.settings')}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                />
              }
              label={t('notifications.enableNotifications')}
            />
            
            <Divider />

            <Typography variant="subtitle2">{t('notifications.notificationTypes')}</Typography>
            {Object.keys(settings.types).map(type => (
              <FormControlLabel
                key={type}
                control={
                  <Switch
                    checked={settings.types[type as NotificationType]}
                    onChange={(e) => setSettings({
                      ...settings,
                      types: { ...settings.types, [type]: e.target.checked },
                    })}
                    disabled={!settings.enabled}
                  />
                }
                label={t(`notifications.type.${type}`)}
              />
            ))}

            <Divider />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.quietHours.enabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    quietHours: { ...settings.quietHours, enabled: e.target.checked },
                  })}
                  disabled={!settings.enabled}
                />
              }
              label={t('notifications.quietHours')}
            />

            {settings.quietHours.enabled && (
              <Stack direction="row" spacing={2}>
                <TextField
                  type="time"
                  label={t('notifications.startTime')}
                  value={settings.quietHours.startTime}
                  onChange={(e) => setSettings({
                    ...settings,
                    quietHours: { ...settings.quietHours, startTime: e.target.value },
                  })}
                  disabled={!settings.enabled}
                  fullWidth
                />
                <TextField
                  type="time"
                  label={t('notifications.endTime')}
                  value={settings.quietHours.endTime}
                  onChange={(e) => setSettings({
                    ...settings,
                    quietHours: { ...settings.quietHours, endTime: e.target.value },
                  })}
                  disabled={!settings.enabled}
                  fullWidth
                />
              </Stack>
            )}

            <Divider />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.sound}
                  onChange={(e) => setSettings({ ...settings, sound: e.target.checked })}
                  disabled={!settings.enabled}
                />
              }
              label={t('notifications.sound')}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.vibration}
                  onChange={(e) => setSettings({ ...settings, vibration: e.target.checked })}
                  disabled={!settings.enabled}
                />
              }
              label={t('notifications.vibration')}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.preview}
                  onChange={(e) => setSettings({ ...settings, preview: e.target.checked })}
                  disabled={!settings.enabled}
                />
              }
              label={t('notifications.preview')}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.grouping}
                  onChange={(e) => setSettings({ ...settings, grouping: e.target.checked })}
                  disabled={!settings.enabled}
                />
              }
              label={t('notifications.grouping')}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettingsDialog(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="contained" onClick={handleUpdateSettings}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Mock imports
const SyncIcon = () => <NotificationsIcon />;
const CheckCircle = () => <SuccessIcon />;

export default PushNotificationManager;