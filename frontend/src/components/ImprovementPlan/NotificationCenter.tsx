import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Badge,
  Chip,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  FormGroup,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Divider,
  Tab,
  Tabs,
  Card,
  CardContent,
  Grid,
  Tooltip,
  Menu,
  Avatar,
  useTheme,
  Collapse,
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  NotificationsActive as ActiveNotificationIcon,
  NotificationsOff as MutedIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  PhoneAndroid as PushIcon,
  Computer as InAppIcon,
  Schedule as ScheduleIcon,
  Flag as PriorityIcon,
  CheckCircle as CompleteIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  MarkEmailRead as MarkReadIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Assignment as TaskIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format, isToday, isTomorrow, isThisWeek, differenceInDays, addDays } from 'date-fns';
import {
  ImprovementPlan,
  FollowUpActivity,
  Reminder,
  NotificationSettings,
} from '../../types/improvement';

interface NotificationCenterProps {
  plans: ImprovementPlan[];
  notificationSettings: NotificationSettings;
  onSettingsUpdate: (settings: NotificationSettings) => Promise<void>;
  onReminderDismiss: (reminderId: string) => Promise<void>;
  onReminderSnooze: (reminderId: string, snoozeUntil: Date) => Promise<void>;
  currentUserId: string;
}

interface NotificationItem {
  id: string;
  type: 'reminder' | 'due_date' | 'overdue' | 'progress_update' | 'approval_needed';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  date: Date;
  relatedPlanId?: string;
  relatedActivityId?: string;
  relatedGoalId?: string;
  read: boolean;
  actionable: boolean;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  plans,
  notificationSettings,
  onSettingsUpdate,
  onReminderDismiss,
  onReminderSnooze,
  currentUserId,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['today', 'upcoming']);
  const [settings, setSettings] = useState<NotificationSettings>(notificationSettings);

  useEffect(() => {
    generateNotifications();
  }, [plans]);

  const generateNotifications = () => {
    const allNotifications: NotificationItem[] = [];

    plans.forEach(plan => {
      // Check plan due dates
      const planDaysRemaining = differenceInDays(new Date(plan.targetDate), new Date());
      if (planDaysRemaining <= 7 && planDaysRemaining >= 0) {
        allNotifications.push({
          id: `plan-due-${plan.id}`,
          type: 'due_date',
          priority: planDaysRemaining <= 3 ? 'high' : 'medium',
          title: t('notifications.planDueSoon'),
          message: t('notifications.planDueMessage', { 
            plan: plan.title, 
            days: planDaysRemaining 
          }),
          date: new Date(plan.targetDate),
          relatedPlanId: plan.id,
          read: false,
          actionable: true,
        });
      } else if (planDaysRemaining < 0) {
        allNotifications.push({
          id: `plan-overdue-${plan.id}`,
          type: 'overdue',
          priority: 'high',
          title: t('notifications.planOverdue'),
          message: t('notifications.planOverdueMessage', { 
            plan: plan.title, 
            days: Math.abs(planDaysRemaining) 
          }),
          date: new Date(plan.targetDate),
          relatedPlanId: plan.id,
          read: false,
          actionable: true,
        });
      }

      // Check activity reminders
      plan.activities.forEach(activity => {
        if (activity.status === 'scheduled' && activity.reminders) {
          activity.reminders
            .filter(r => r.status === 'pending')
            .forEach(reminder => {
              const reminderDate = new Date(reminder.scheduledDate);
              const daysUntil = differenceInDays(reminderDate, new Date());
              
              if (daysUntil <= 0) {
                allNotifications.push({
                  id: reminder.id,
                  type: 'reminder',
                  priority: 'high',
                  title: t('notifications.activityReminder'),
                  message: reminder.message || t('notifications.activityReminderMessage', {
                    activity: activity.title,
                    date: format(new Date(activity.scheduledDate), 'MMM d, yyyy'),
                  }),
                  date: reminderDate,
                  relatedPlanId: plan.id,
                  relatedActivityId: activity.id,
                  read: false,
                  actionable: true,
                });
              }
            });
        }

        // Check activity due dates
        const activityDate = new Date(activity.scheduledDate);
        const activityDaysUntil = differenceInDays(activityDate, new Date());
        
        if (activity.status === 'scheduled' && activityDaysUntil <= 3 && activityDaysUntil >= 0) {
          allNotifications.push({
            id: `activity-due-${activity.id}`,
            type: 'due_date',
            priority: activityDaysUntil === 0 ? 'high' : 'medium',
            title: t('notifications.activityDueSoon'),
            message: t('notifications.activityDueMessage', {
              activity: activity.title,
              date: format(activityDate, 'MMM d, yyyy'),
            }),
            date: activityDate,
            relatedPlanId: plan.id,
            relatedActivityId: activity.id,
            read: false,
            actionable: true,
          });
        }
      });

      // Check goals
      plan.goals.forEach(goal => {
        const goalDate = new Date(goal.dueDate);
        const goalDaysUntil = differenceInDays(goalDate, new Date());
        
        if (goal.status !== 'achieved' && goalDaysUntil <= 7 && goalDaysUntil >= 0) {
          allNotifications.push({
            id: `goal-due-${goal.id}`,
            type: 'due_date',
            priority: goalDaysUntil <= 3 ? 'high' : 'medium',
            title: t('notifications.goalDueSoon'),
            message: t('notifications.goalDueMessage', {
              goal: goal.title,
              days: goalDaysUntil,
            }),
            date: goalDate,
            relatedPlanId: plan.id,
            relatedGoalId: goal.id,
            read: false,
            actionable: true,
          });
        }
      });

      // Check for approvals needed
      if (plan.approvals) {
        const pendingApprovals = plan.approvals.filter(a => a.status === 'pending' && a.approverId === currentUserId);
        pendingApprovals.forEach(approval => {
          allNotifications.push({
            id: `approval-${approval.id}`,
            type: 'approval_needed',
            priority: 'high',
            title: t('notifications.approvalNeeded'),
            message: t('notifications.approvalNeededMessage', { plan: plan.title }),
            date: new Date(),
            relatedPlanId: plan.id,
            read: false,
            actionable: true,
          });
        });
      }
    });

    // Sort by date and priority
    allNotifications.sort((a, b) => {
      if (a.priority !== b.priority) {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.date.getTime() - b.date.getTime();
    });

    setNotifications(allNotifications);
  };

  const groupNotifications = () => {
    const groups: { [key: string]: NotificationItem[] } = {
      today: [],
      tomorrow: [],
      thisWeek: [],
      upcoming: [],
      overdue: [],
    };

    notifications.forEach(notification => {
      if (notification.type === 'overdue') {
        groups.overdue.push(notification);
      } else if (isToday(notification.date)) {
        groups.today.push(notification);
      } else if (isTomorrow(notification.date)) {
        groups.tomorrow.push(notification);
      } else if (isThisWeek(notification.date)) {
        groups.thisWeek.push(notification);
      } else {
        groups.upcoming.push(notification);
      }
    });

    return groups;
  };

  const getNotificationIcon = (type: string, priority: string) => {
    const color = priority === 'high' ? 'error' : priority === 'medium' ? 'warning' : 'info';
    
    switch (type) {
      case 'reminder':
        return <ActiveNotificationIcon color={color as any} />;
      case 'due_date':
        return <ScheduleIcon color={color as any} />;
      case 'overdue':
        return <ErrorIcon color="error" />;
      case 'approval_needed':
        return <WarningIcon color="warning" />;
      default:
        return <InfoIcon color={color as any} />;
    }
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    setSelectedNotification(notification);
    // Mark as read
    setNotifications(notifications.map(n => 
      n.id === notification.id ? { ...n, read: true } : n
    ));
  };

  const handleSnooze = async (notification: NotificationItem, duration: number) => {
    const snoozeUntil = addDays(new Date(), duration);
    if (notification.type === 'reminder') {
      await onReminderSnooze(notification.id, snoozeUntil);
    }
    // Remove from current notifications
    setNotifications(notifications.filter(n => n.id !== notification.id));
  };

  const handleDismiss = async (notification: NotificationItem) => {
    if (notification.type === 'reminder') {
      await onReminderDismiss(notification.id);
    }
    setNotifications(notifications.filter(n => n.id !== notification.id));
  };

  const handleSettingsSave = async () => {
    await onSettingsUpdate(settings);
    setShowSettings(false);
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev =>
      prev.includes(group)
        ? prev.filter(g => g !== group)
        : [...prev, group]
    );
  };

  const renderNotificationList = () => {
    const groups = groupNotifications();
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Badge badgeContent={unreadCount} color="error">
              <NotificationIcon />
            </Badge>
            <Typography variant="h6">{t('notifications.title')}</Typography>
          </Stack>
          <IconButton onClick={() => setShowSettings(true)}>
            <SettingsIcon />
          </IconButton>
        </Stack>

        {notifications.length === 0 ? (
          <Alert severity="info">{t('notifications.noNotifications')}</Alert>
        ) : (
          <List>
            {Object.entries(groups).map(([groupName, groupNotifications]) => {
              if (groupNotifications.length === 0) return null;

              const isExpanded = expandedGroups.includes(groupName);

              return (
                <React.Fragment key={groupName}>
                  <ListItem button onClick={() => toggleGroup(groupName)}>
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="subtitle1">
                            {t(`notifications.groups.${groupName}`)}
                          </Typography>
                          <Chip
                            label={groupNotifications.length}
                            size="small"
                            color={groupName === 'overdue' ? 'error' : 'default'}
                          />
                        </Stack>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => toggleGroup(groupName)}>
                        {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  
                  <Collapse in={isExpanded}>
                    <List disablePadding>
                      {groupNotifications.map((notification) => (
                        <ListItem
                          key={notification.id}
                          button
                          onClick={() => handleNotificationClick(notification)}
                          sx={{
                            pl: 4,
                            backgroundColor: notification.read ? 'transparent' : 'action.hover',
                          }}
                        >
                          <ListItemIcon>
                            {getNotificationIcon(notification.type, notification.priority)}
                          </ListItemIcon>
                          <ListItemText
                            primary={notification.title}
                            secondary={
                              <Stack spacing={0.5}>
                                <Typography variant="body2" color="text.secondary">
                                  {notification.message}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {format(notification.date, 'MMM d, yyyy h:mm a')}
                                </Typography>
                              </Stack>
                            }
                          />
                          {notification.actionable && (
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAnchorEl(e.currentTarget);
                                  setSelectedNotification(notification);
                                }}
                              >
                                <MoreVertIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          )}
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                  <Divider />
                </React.Fragment>
              );
            })}
          </List>
        )}

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl) && Boolean(selectedNotification)}
          onClose={() => setAnchorEl(null)}
        >
          {selectedNotification?.type === 'reminder' && (
            <>
              <MenuItem onClick={() => handleSnooze(selectedNotification!, 1)}>
                {t('notifications.snooze1Day')}
              </MenuItem>
              <MenuItem onClick={() => handleSnooze(selectedNotification!, 3)}>
                {t('notifications.snooze3Days')}
              </MenuItem>
              <MenuItem onClick={() => handleSnooze(selectedNotification!, 7)}>
                {t('notifications.snooze1Week')}
              </MenuItem>
              <Divider />
            </>
          )}
          <MenuItem onClick={() => handleDismiss(selectedNotification!)}>
            {t('notifications.dismiss')}
          </MenuItem>
        </Menu>
      </Box>
    );
  };

  const renderUpcomingView = () => {
    const upcomingActivities: { activity: FollowUpActivity; plan: ImprovementPlan; daysUntil: number }[] = [];

    plans.forEach(plan => {
      plan.activities
        .filter(a => a.status === 'scheduled')
        .forEach(activity => {
          const daysUntil = differenceInDays(new Date(activity.scheduledDate), new Date());
          if (daysUntil >= 0 && daysUntil <= 30) {
            upcomingActivities.push({ activity, plan, daysUntil });
          }
        });
    });

    upcomingActivities.sort((a, b) => a.daysUntil - b.daysUntil);

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {t('notifications.upcomingActivities')}
        </Typography>

        {upcomingActivities.length === 0 ? (
          <Alert severity="info">{t('notifications.noUpcomingActivities')}</Alert>
        ) : (
          <Grid container spacing={2}>
            {upcomingActivities.map(({ activity, plan, daysUntil }) => (
              <Grid item xs={12} md={6} key={activity.id}>
                <Card>
                  <CardContent>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="start">
                        <Typography variant="subtitle1">
                          {i18n.language === 'km' ? activity.titleKh || activity.title : activity.title}
                        </Typography>
                        <Chip
                          label={
                            daysUntil === 0 ? t('today') :
                            daysUntil === 1 ? t('tomorrow') :
                            t('inDays', { days: daysUntil })
                          }
                          size="small"
                          color={daysUntil <= 3 ? 'error' : daysUntil <= 7 ? 'warning' : 'default'}
                        />
                      </Stack>
                      
                      <Typography variant="body2" color="text.secondary">
                        {plan.title}
                      </Typography>
                      
                      <Stack direction="row" spacing={1}>
                        <Chip
                          icon={<CalendarIcon />}
                          label={format(new Date(activity.scheduledDate), 'MMM d, yyyy')}
                          size="small"
                          variant="outlined"
                        />
                        {activity.location && (
                          <Chip
                            icon={<LocationIcon />}
                            label={activity.location}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Stack>

                      {activity.reminders && activity.reminders.filter(r => r.status === 'pending').length > 0 && (
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <ActiveNotificationIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {t('notifications.remindersSet', { 
                              count: activity.reminders.filter(r => r.status === 'pending').length 
                            })}
                          </Typography>
                        </Stack>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    );
  };

  const renderSettings = () => {
    return (
      <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('notifications.settings')}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.planReminders}
                    onChange={(e) => setSettings({ ...settings, planReminders: e.target.checked })}
                  />
                }
                label={t('notifications.settings.planReminders')}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.activityReminders}
                    onChange={(e) => setSettings({ ...settings, activityReminders: e.target.checked })}
                  />
                }
                label={t('notifications.settings.activityReminders')}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.progressUpdateReminders}
                    onChange={(e) => setSettings({ ...settings, progressUpdateReminders: e.target.checked })}
                  />
                }
                label={t('notifications.settings.progressReminders')}
              />
            </FormGroup>

            <TextField
              fullWidth
              type="number"
              label={t('notifications.settings.reminderDaysBefore')}
              value={settings.reminderDaysBefore}
              onChange={(e) => setSettings({ ...settings, reminderDaysBefore: parseInt(e.target.value) || 1 })}
              InputProps={{
                inputProps: { min: 1, max: 30 },
              }}
            />

            <TextField
              fullWidth
              type="time"
              label={t('notifications.settings.preferredTime')}
              value={settings.preferredTime}
              onChange={(e) => setSettings({ ...settings, preferredTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t('notifications.settings.channels')}
              </Typography>
              <Stack direction="row" spacing={1}>
                {(['email', 'sms', 'push', 'in_app'] as const).map((channel) => (
                  <Chip
                    key={channel}
                    icon={
                      channel === 'email' ? <EmailIcon /> :
                      channel === 'sms' ? <SmsIcon /> :
                      channel === 'push' ? <PushIcon /> :
                      <InAppIcon />
                    }
                    label={t(`notifications.channels.${channel}`)}
                    onClick={() => {
                      const channels = settings.channels.includes(channel)
                        ? settings.channels.filter(c => c !== channel)
                        : [...settings.channels, channel];
                      setSettings({ ...settings, channels });
                    }}
                    color={settings.channels.includes(channel) ? 'primary' : 'default'}
                    variant={settings.channels.includes(channel) ? 'filled' : 'outlined'}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSettingsSave} variant="contained">{t('common.save')}</Button>
        </DialogActions>
      </Dialog>
    );
  };

  const MoreVertIcon = () => <Box>⋮</Box>;
  const LocationIcon = () => <Box>📍</Box>;

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab 
            label={
              <Badge badgeContent={notifications.filter(n => !n.read).length} color="error">
                <span>{t('notifications.all')}</span>
              </Badge>
            } 
          />
          <Tab label={t('notifications.upcoming')} />
        </Tabs>
      </Box>

      <Box sx={{ py: 2 }}>
        {tabValue === 0 && renderNotificationList()}
        {tabValue === 1 && renderUpcomingView()}
      </Box>

      {renderSettings()}
    </Paper>
  );
};

export default NotificationCenter;