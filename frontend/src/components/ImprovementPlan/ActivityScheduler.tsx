import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  Tooltip,
  Badge,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  useMediaQuery,
  Fab,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  NotificationsActive as ReminderIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon,
  Postpone as PostponeIcon,
  PlayArrow as StartIcon,
  Add as AddIcon,
  ViewList as ListView,
  ViewModule as GridView,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Description as MaterialIcon,
  Link as LinkIcon,
  VideoLibrary as VideoIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format, addDays, isBefore, isAfter, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
  FollowUpActivity,
  Reminder,
  ActivityMaterial,
  ImprovementPlan,
} from '../../types/improvement';

const localizer = momentLocalizer(moment);

interface ActivitySchedulerProps {
  plan: ImprovementPlan;
  activities: FollowUpActivity[];
  onActivityUpdate: (activityId: string, updates: Partial<FollowUpActivity>) => Promise<void>;
  onActivityDelete: (activityId: string) => Promise<void>;
  onActivityAdd: (activity: Partial<FollowUpActivity>) => Promise<void>;
  onReminderUpdate: (activityId: string, reminders: Reminder[]) => Promise<void>;
  readOnly?: boolean;
}

const ActivityScheduler: React.FC<ActivitySchedulerProps> = ({
  plan,
  activities,
  onActivityUpdate,
  onActivityDelete,
  onActivityAdd,
  onReminderUpdate,
  readOnly = false,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [view, setView] = useState<'calendar' | 'list' | 'grid'>('calendar');
  const [filter, setFilter] = useState<string>('all');
  const [selectedActivity, setSelectedActivity] = useState<FollowUpActivity | null>(null);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [showMaterialDialog, setShowMaterialDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const getActivityColor = (activity: FollowUpActivity): string => {
    switch (activity.status) {
      case 'completed':
        return theme.palette.success.main;
      case 'in_progress':
        return theme.palette.info.main;
      case 'cancelled':
        return theme.palette.error.main;
      case 'postponed':
        return theme.palette.warning.main;
      default:
        return theme.palette.primary.main;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'coaching':
        return <PersonIcon />;
      case 'training':
        return <SchoolIcon />;
      case 'peer_observation':
        return <GroupIcon />;
      case 'workshop':
        return <GroupIcon />;
      case 'self_study':
        return <PersonIcon />;
      default:
        return <ScheduleIcon />;
    }
  };

  const filterActivities = (): FollowUpActivity[] => {
    let filtered = [...activities];

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(a => a.status === filter);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        a.title?.toLowerCase().includes(term) ||
        a.description?.toLowerCase().includes(term) ||
        a.facilitator?.toLowerCase().includes(term) ||
        a.location?.toLowerCase().includes(term)
      );
    }

    // Sort by date
    return filtered.sort((a, b) => 
      new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    );
  };

  const getUpcomingReminders = (): { activity: FollowUpActivity; daysUntil: number }[] => {
    const upcoming: { activity: FollowUpActivity; daysUntil: number }[] = [];
    
    activities.forEach(activity => {
      if (activity.status === 'scheduled' && activity.scheduledDate) {
        const daysUntil = differenceInDays(new Date(activity.scheduledDate), new Date());
        if (daysUntil >= 0 && daysUntil <= 7) {
          upcoming.push({ activity, daysUntil });
        }
      }
    });

    return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
  };

  const handleStatusChange = async (activity: FollowUpActivity, newStatus: string) => {
    await onActivityUpdate(activity.id, { status: newStatus as any });
  };

  const handlePostpone = async (activity: FollowUpActivity, newDate: string) => {
    await onActivityUpdate(activity.id, {
      status: 'postponed',
      scheduledDate: newDate,
    });
  };

  const renderCalendarView = () => {
    const events = filterActivities().map(activity => ({
      id: activity.id,
      title: i18n.language === 'km' ? activity.titleKh || activity.title : activity.title,
      start: new Date(activity.scheduledDate),
      end: addDays(new Date(activity.scheduledDate), 0),
      resource: activity,
    }));

    return (
      <Box sx={{ height: 600 }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          titleAccessor="title"
          onSelectEvent={(event) => {
            setSelectedActivity(event.resource);
            setShowActivityDialog(true);
          }}
          eventPropGetter={(event) => ({
            style: {
              backgroundColor: getActivityColor(event.resource),
              borderRadius: '4px',
              opacity: 0.9,
              color: 'white',
              border: '0px',
              display: 'block',
            },
          })}
          views={['month', 'week', 'day']}
          defaultView="month"
          popup
          messages={{
            next: t('calendar.next'),
            previous: t('calendar.previous'),
            today: t('calendar.today'),
            month: t('calendar.month'),
            week: t('calendar.week'),
            day: t('calendar.day'),
          }}
        />
      </Box>
    );
  };

  const renderListView = () => {
    const filteredActivities = filterActivities();
    const upcomingReminders = getUpcomingReminders();

    return (
      <Box>
        {upcomingReminders.length > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {t('activities.upcomingReminders')}
            </Typography>
            <Stack spacing={1}>
              {upcomingReminders.map(({ activity, daysUntil }) => (
                <Typography key={activity.id} variant="body2">
                  • {activity.title} - {
                    daysUntil === 0 ? t('activities.today') :
                    daysUntil === 1 ? t('activities.tomorrow') :
                    t('activities.inDays', { days: daysUntil })
                  }
                </Typography>
              ))}
            </Stack>
          </Alert>
        )}

        <List>
          {filteredActivities.map((activity, index) => (
            <React.Fragment key={activity.id}>
              <ListItem
                sx={{
                  backgroundColor: activity.status === 'completed' ? 'action.selected' : 'transparent',
                }}
              >
                <ListItemIcon>
                  <Badge
                    badgeContent={activity.reminders?.filter(r => r.status === 'pending').length}
                    color="error"
                  >
                    {getActivityIcon(activity.type)}
                  </Badge>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle1">
                        {i18n.language === 'km' ? activity.titleKh || activity.title : activity.title}
                      </Typography>
                      <Chip
                        label={t(`activityStatus.${activity.status}`)}
                        size="small"
                        color={
                          activity.status === 'completed' ? 'success' :
                          activity.status === 'cancelled' ? 'error' :
                          activity.status === 'postponed' ? 'warning' :
                          'default'
                        }
                      />
                    </Stack>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {i18n.language === 'km' ? activity.descriptionKh || activity.description : activity.description}
                      </Typography>
                      <Stack direction="row" spacing={2} mt={1}>
                        <Chip
                          icon={<CalendarIcon />}
                          label={format(new Date(activity.scheduledDate), 'MMM d, yyyy')}
                          size="small"
                          variant="outlined"
                        />
                        {activity.duration && (
                          <Chip
                            icon={<ScheduleIcon />}
                            label={`${activity.duration} ${t('minutes')}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {activity.location && (
                          <Chip
                            icon={<LocationIcon />}
                            label={activity.location}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {activity.facilitator && (
                          <Chip
                            icon={<PersonIcon />}
                            label={activity.facilitator}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Stack direction="row" spacing={1}>
                    {activity.status === 'scheduled' && !readOnly && (
                      <>
                        <Tooltip title={t('activities.start')}>
                          <IconButton
                            edge="end"
                            color="primary"
                            onClick={() => handleStatusChange(activity, 'in_progress')}
                          >
                            <StartIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('activities.postpone')}>
                          <IconButton
                            edge="end"
                            color="warning"
                            onClick={() => {
                              setSelectedActivity(activity);
                              // Show postpone dialog
                            }}
                          >
                            <PostponeIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    {activity.status === 'in_progress' && !readOnly && (
                      <Tooltip title={t('activities.complete')}>
                        <IconButton
                          edge="end"
                          color="success"
                          onClick={() => handleStatusChange(activity, 'completed')}
                        >
                          <CompleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title={t('activities.viewDetails')}>
                      <IconButton
                        edge="end"
                        onClick={() => {
                          setSelectedActivity(activity);
                          setShowActivityDialog(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    {!readOnly && (
                      <Tooltip title={t('common.delete')}>
                        <IconButton
                          edge="end"
                          color="error"
                          onClick={() => onActivityDelete(activity.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </ListItemSecondaryAction>
              </ListItem>
              {index < filteredActivities.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>

        {filteredActivities.length === 0 && (
          <Alert severity="info">{t('activities.noActivities')}</Alert>
        )}
      </Box>
    );
  };

  const renderGridView = () => {
    const filteredActivities = filterActivities();

    return (
      <Grid container spacing={2}>
        {filteredActivities.map((activity) => (
          <Grid item xs={12} sm={6} md={4} key={activity.id}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="start" mb={1}>
                  <Box>
                    {getActivityIcon(activity.type)}
                  </Box>
                  <Chip
                    label={t(`activityStatus.${activity.status}`)}
                    size="small"
                    color={
                      activity.status === 'completed' ? 'success' :
                      activity.status === 'cancelled' ? 'error' :
                      activity.status === 'postponed' ? 'warning' :
                      'default'
                    }
                  />
                </Stack>
                
                <Typography variant="h6" gutterBottom>
                  {i18n.language === 'km' ? activity.titleKh || activity.title : activity.title}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  {i18n.language === 'km' ? activity.descriptionKh || activity.description : activity.description}
                </Typography>

                <Stack spacing={1}>
                  <Stack direction="row" spacing={1}>
                    <CalendarIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {format(new Date(activity.scheduledDate), 'MMM d, yyyy')}
                    </Typography>
                  </Stack>
                  
                  {activity.location && (
                    <Stack direction="row" spacing={1}>
                      <LocationIcon fontSize="small" color="action" />
                      <Typography variant="body2">{activity.location}</Typography>
                    </Stack>
                  )}
                  
                  {activity.facilitator && (
                    <Stack direction="row" spacing={1}>
                      <PersonIcon fontSize="small" color="action" />
                      <Typography variant="body2">{activity.facilitator}</Typography>
                    </Stack>
                  )}

                  {activity.materials && activity.materials.length > 0 && (
                    <Stack direction="row" spacing={1}>
                      <MaterialIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {t('activities.materialsCount', { count: activity.materials.length })}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </CardContent>
              
              <CardActions>
                {activity.status === 'scheduled' && !readOnly && (
                  <Button
                    size="small"
                    color="primary"
                    onClick={() => handleStatusChange(activity, 'in_progress')}
                  >
                    {t('activities.start')}
                  </Button>
                )}
                {activity.status === 'in_progress' && !readOnly && (
                  <Button
                    size="small"
                    color="success"
                    onClick={() => handleStatusChange(activity, 'completed')}
                  >
                    {t('activities.complete')}
                  </Button>
                )}
                <Button
                  size="small"
                  onClick={() => {
                    setSelectedActivity(activity);
                    setShowActivityDialog(true);
                  }}
                >
                  {t('activities.details')}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5">{t('activities.title')}</Typography>
          
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              size="small"
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
              }}
              sx={{ minWidth: 200 }}
            />
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>{t('activities.filter')}</InputLabel>
              <Select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                label={t('activities.filter')}
              >
                <MenuItem value="all">{t('common.all')}</MenuItem>
                <MenuItem value="scheduled">{t('activityStatus.scheduled')}</MenuItem>
                <MenuItem value="in_progress">{t('activityStatus.in_progress')}</MenuItem>
                <MenuItem value="completed">{t('activityStatus.completed')}</MenuItem>
                <MenuItem value="postponed">{t('activityStatus.postponed')}</MenuItem>
                <MenuItem value="cancelled">{t('activityStatus.cancelled')}</MenuItem>
              </Select>
            </FormControl>

            <ToggleButtonGroup
              value={view}
              exclusive
              onChange={(e, newView) => newView && setView(newView)}
              size="small"
            >
              <ToggleButton value="calendar">
                <CalendarIcon />
              </ToggleButton>
              <ToggleButton value="list">
                <ListView />
              </ToggleButton>
              <ToggleButton value="grid">
                <GridView />
              </ToggleButton>
            </ToggleButtonGroup>
            
            {!readOnly && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setSelectedActivity(null);
                  setShowActivityDialog(true);
                }}
              >
                {t('activities.add')}
              </Button>
            )}
          </Stack>
        </Stack>

        {view === 'calendar' && renderCalendarView()}
        {view === 'list' && renderListView()}
        {view === 'grid' && renderGridView()}
      </Paper>

      {/* Activity Details/Edit Dialog */}
      <ActivityDetailsDialog
        open={showActivityDialog}
        onClose={() => {
          setShowActivityDialog(false);
          setSelectedActivity(null);
        }}
        activity={selectedActivity}
        onSave={async (updates) => {
          if (selectedActivity) {
            await onActivityUpdate(selectedActivity.id, updates);
          } else {
            await onActivityAdd(updates);
          }
          setShowActivityDialog(false);
          setSelectedActivity(null);
        }}
        onShowReminders={() => {
          setShowActivityDialog(false);
          setShowReminderDialog(true);
        }}
        onShowMaterials={() => {
          setShowActivityDialog(false);
          setShowMaterialDialog(true);
        }}
        readOnly={readOnly}
        plan={plan}
      />

      {/* Reminder Management Dialog */}
      {selectedActivity && (
        <ReminderDialog
          open={showReminderDialog}
          onClose={() => {
            setShowReminderDialog(false);
            setShowActivityDialog(true);
          }}
          activity={selectedActivity}
          onSave={async (reminders) => {
            await onReminderUpdate(selectedActivity.id, reminders);
            setShowReminderDialog(false);
            setShowActivityDialog(true);
          }}
          readOnly={readOnly}
        />
      )}

      {/* Material Management Dialog */}
      {selectedActivity && (
        <MaterialDialog
          open={showMaterialDialog}
          onClose={() => {
            setShowMaterialDialog(false);
            setShowActivityDialog(true);
          }}
          activity={selectedActivity}
          onSave={async (materials) => {
            await onActivityUpdate(selectedActivity.id, { materials });
            setShowMaterialDialog(false);
            setShowActivityDialog(true);
          }}
          readOnly={readOnly}
        />
      )}

      {/* Floating Action Button for Mobile */}
      {isMobile && !readOnly && (
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
          onClick={() => {
            setSelectedActivity(null);
            setShowActivityDialog(true);
          }}
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  );
};

// Activity Details Dialog Component
const ActivityDetailsDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  activity: FollowUpActivity | null;
  onSave: (updates: Partial<FollowUpActivity>) => Promise<void>;
  onShowReminders: () => void;
  onShowMaterials: () => void;
  readOnly: boolean;
  plan: ImprovementPlan;
}> = ({ open, onClose, activity, onSave, onShowReminders, onShowMaterials, readOnly, plan }) => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState<Partial<FollowUpActivity>>({});

  useEffect(() => {
    if (activity) {
      setFormData(activity);
    } else {
      setFormData({
        title: '',
        titleKh: '',
        description: '',
        descriptionKh: '',
        type: 'coaching',
        scheduledDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
        duration: 60,
        location: '',
        facilitator: '',
        participants: [],
        status: 'scheduled',
      });
    }
  }, [activity]);

  const handleSubmit = async () => {
    await onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {activity 
          ? readOnly ? t('activities.viewActivity') : t('activities.editActivity')
          : t('activities.addActivity')
        }
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('activities.title')}
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              disabled={readOnly}
              required
            />
          </Grid>

          {i18n.language === 'km' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('activities.titleKh')}
                value={formData.titleKh || ''}
                onChange={(e) => setFormData({ ...formData, titleKh: e.target.value })}
                disabled={readOnly}
              />
            </Grid>
          )}

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label={t('activities.description')}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={readOnly}
              required
            />
          </Grid>

          {i18n.language === 'km' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label={t('activities.descriptionKh')}
                value={formData.descriptionKh || ''}
                onChange={(e) => setFormData({ ...formData, descriptionKh: e.target.value })}
                disabled={readOnly}
              />
            </Grid>
          )}

          <Grid item xs={12} md={6}>
            <FormControl fullWidth disabled={readOnly}>
              <InputLabel>{t('activities.type')}</InputLabel>
              <Select
                value={formData.type || 'coaching'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                label={t('activities.type')}
              >
                <MenuItem value="coaching">{t('activityType.coaching')}</MenuItem>
                <MenuItem value="training">{t('activityType.training')}</MenuItem>
                <MenuItem value="peer_observation">{t('activityType.peer_observation')}</MenuItem>
                <MenuItem value="self_study">{t('activityType.self_study')}</MenuItem>
                <MenuItem value="workshop">{t('activityType.workshop')}</MenuItem>
                <MenuItem value="other">{t('activityType.other')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth disabled={readOnly}>
              <InputLabel>{t('activities.linkedGoal')}</InputLabel>
              <Select
                value={formData.goalId || ''}
                onChange={(e) => setFormData({ ...formData, goalId: e.target.value })}
                label={t('activities.linkedGoal')}
              >
                <MenuItem value="">
                  <em>{t('activities.noLinkedGoal')}</em>
                </MenuItem>
                {plan.goals.map((goal) => (
                  <MenuItem key={goal.id} value={goal.id}>
                    {i18n.language === 'km' ? goal.titleKh || goal.title : goal.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="date"
              label={t('activities.scheduledDate')}
              value={formData.scheduledDate || ''}
              onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              disabled={readOnly}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label={t('activities.duration')}
              value={formData.duration || 60}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
              InputProps={{
                endAdornment: <Typography variant="body2">{t('minutes')}</Typography>,
              }}
              disabled={readOnly}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('activities.location')}
              value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              disabled={readOnly}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('activities.facilitator')}
              value={formData.facilitator || ''}
              onChange={(e) => setFormData({ ...formData, facilitator: e.target.value })}
              disabled={readOnly}
            />
          </Grid>

          {activity && (
            <>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={readOnly}>
                  <InputLabel>{t('activities.status')}</InputLabel>
                  <Select
                    value={formData.status || 'scheduled'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    label={t('activities.status')}
                  >
                    <MenuItem value="scheduled">{t('activityStatus.scheduled')}</MenuItem>
                    <MenuItem value="in_progress">{t('activityStatus.in_progress')}</MenuItem>
                    <MenuItem value="completed">{t('activityStatus.completed')}</MenuItem>
                    <MenuItem value="postponed">{t('activityStatus.postponed')}</MenuItem>
                    <MenuItem value="cancelled">{t('activityStatus.cancelled')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    startIcon={<ReminderIcon />}
                    onClick={onShowReminders}
                    fullWidth
                  >
                    {t('activities.manageReminders')} 
                    {activity.reminders && activity.reminders.length > 0 && ` (${activity.reminders.length})`}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<MaterialIcon />}
                    onClick={onShowMaterials}
                    fullWidth
                  >
                    {t('activities.manageMaterials')}
                    {activity.materials && activity.materials.length > 0 && ` (${activity.materials.length})`}
                  </Button>
                </Stack>
              </Grid>

              {formData.status === 'completed' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label={t('activities.completionNotes')}
                    value={formData.completionNotes || ''}
                    onChange={(e) => setFormData({ ...formData, completionNotes: e.target.value })}
                    disabled={readOnly}
                  />
                </Grid>
              )}
            </>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        {!readOnly && (
          <Button onClick={handleSubmit} variant="contained">
            {activity ? t('common.update') : t('common.create')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

// Reminder Dialog Component
const ReminderDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  activity: FollowUpActivity;
  onSave: (reminders: Reminder[]) => Promise<void>;
  readOnly: boolean;
}> = ({ open, onClose, activity, onSave, readOnly }) => {
  const { t } = useTranslation();
  const [reminders, setReminders] = useState<Reminder[]>(activity.reminders || []);
  const [newReminder, setNewReminder] = useState<Partial<Reminder>>({
    type: 'email',
    scheduledDate: format(addDays(new Date(activity.scheduledDate), -1), 'yyyy-MM-dd'),
    message: '',
    messageKh: '',
    recipients: [],
    status: 'pending',
  });

  const handleAddReminder = () => {
    setReminders([
      ...reminders,
      {
        ...newReminder,
        id: Date.now().toString(),
        activityId: activity.id,
      } as Reminder,
    ]);
    setNewReminder({
      type: 'email',
      scheduledDate: format(addDays(new Date(activity.scheduledDate), -1), 'yyyy-MM-dd'),
      message: '',
      messageKh: '',
      recipients: [],
      status: 'pending',
    });
  };

  const handleDeleteReminder = (reminderId: string) => {
    setReminders(reminders.filter(r => r.id !== reminderId));
  };

  const handleSave = async () => {
    await onSave(reminders);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('activities.reminders')}</DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          {!readOnly && (
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                {t('activities.addReminder')}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{t('activities.reminderType')}</InputLabel>
                    <Select
                      value={newReminder.type}
                      onChange={(e) => setNewReminder({ ...newReminder, type: e.target.value as any })}
                      label={t('activities.reminderType')}
                    >
                      <MenuItem value="email">{t('reminderType.email')}</MenuItem>
                      <MenuItem value="sms">{t('reminderType.sms')}</MenuItem>
                      <MenuItem value="push">{t('reminderType.push')}</MenuItem>
                      <MenuItem value="in_app">{t('reminderType.in_app')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label={t('activities.reminderDate')}
                    value={newReminder.scheduledDate}
                    onChange={(e) => setNewReminder({ ...newReminder, scheduledDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleAddReminder}
                    disabled={!newReminder.scheduledDate}
                  >
                    {t('common.add')}
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          )}

          <List>
            {reminders.map((reminder) => (
              <ListItem key={reminder.id}>
                <ListItemIcon>
                  <ReminderIcon color={reminder.status === 'sent' ? 'success' : 'action'} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={t(`reminderType.${reminder.type}`)}
                        size="small"
                        variant="outlined"
                      />
                      <Typography variant="body2">
                        {format(new Date(reminder.scheduledDate), 'MMM d, yyyy')}
                      </Typography>
                      <Chip
                        label={t(`reminderStatus.${reminder.status}`)}
                        size="small"
                        color={reminder.status === 'sent' ? 'success' : 'default'}
                      />
                    </Stack>
                  }
                  secondary={reminder.message}
                />
                {!readOnly && reminder.status === 'pending' && (
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleDeleteReminder(reminder.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            ))}
          </List>

          {reminders.length === 0 && (
            <Alert severity="info">{t('activities.noReminders')}</Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.close')}</Button>
        {!readOnly && (
          <Button onClick={handleSave} variant="contained">
            {t('common.save')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

// Material Dialog Component
const MaterialDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  activity: FollowUpActivity;
  onSave: (materials: ActivityMaterial[]) => Promise<void>;
  readOnly: boolean;
}> = ({ open, onClose, activity, onSave, readOnly }) => {
  const { t } = useTranslation();
  const [materials, setMaterials] = useState<ActivityMaterial[]>(activity.materials || []);
  const [newMaterial, setNewMaterial] = useState<Partial<ActivityMaterial>>({
    name: '',
    type: 'document',
    url: '',
    description: '',
  });

  const handleAddMaterial = () => {
    setMaterials([
      ...materials,
      {
        ...newMaterial,
        id: Date.now().toString(),
        activityId: activity.id,
      } as ActivityMaterial,
    ]);
    setNewMaterial({
      name: '',
      type: 'document',
      url: '',
      description: '',
    });
  };

  const handleDeleteMaterial = (materialId: string) => {
    setMaterials(materials.filter(m => m.id !== materialId));
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <MaterialIcon />;
      case 'video':
        return <VideoIcon />;
      case 'link':
        return <LinkIcon />;
      default:
        return <MaterialIcon />;
    }
  };

  const handleSave = async () => {
    await onSave(materials);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('activities.materials')}</DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          {!readOnly && (
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                {t('activities.addMaterial')}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t('activities.materialName')}
                    value={newMaterial.name}
                    onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{t('activities.materialType')}</InputLabel>
                    <Select
                      value={newMaterial.type}
                      onChange={(e) => setNewMaterial({ ...newMaterial, type: e.target.value as any })}
                      label={t('activities.materialType')}
                    >
                      <MenuItem value="document">{t('materialType.document')}</MenuItem>
                      <MenuItem value="video">{t('materialType.video')}</MenuItem>
                      <MenuItem value="link">{t('materialType.link')}</MenuItem>
                      <MenuItem value="other">{t('materialType.other')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t('activities.materialUrl')}
                    value={newMaterial.url}
                    onChange={(e) => setNewMaterial({ ...newMaterial, url: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                    label={t('activities.materialDescription')}
                    value={newMaterial.description}
                    onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleAddMaterial}
                    disabled={!newMaterial.name || !newMaterial.url}
                  >
                    {t('common.add')}
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          )}

          <List>
            {materials.map((material) => (
              <ListItem key={material.id}>
                <ListItemIcon>
                  {getMaterialIcon(material.type)}
                </ListItemIcon>
                <ListItemText
                  primary={material.name}
                  secondary={
                    <Stack spacing={0.5}>
                      <Typography variant="body2" color="text.secondary">
                        {material.description}
                      </Typography>
                      <Typography
                        variant="body2"
                        component="a"
                        href={material.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: 'primary.main' }}
                      >
                        {material.url}
                      </Typography>
                    </Stack>
                  }
                />
                {!readOnly && (
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleDeleteMaterial(material.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            ))}
          </List>

          {materials.length === 0 && (
            <Alert severity="info">{t('activities.noMaterials')}</Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.close')}</Button>
        {!readOnly && (
          <Button onClick={handleSave} variant="contained">
            {t('common.save')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ActivityScheduler;