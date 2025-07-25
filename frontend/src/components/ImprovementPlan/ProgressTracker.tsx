import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  CircularProgress,
  Stack,
  Chip,
  Button,
  IconButton,
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
  Divider,
  Tab,
  Tabs,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  Slider,
  FormHelperText,
  useTheme,
  Tooltip,
  Rating,
} from '@mui/material';
import {
  TrendingUp as ProgressIcon,
  CheckCircle as CompleteIcon,
  Warning as AtRiskIcon,
  Error as DelayedIcon,
  Schedule as OnTrackIcon,
  Update as UpdateIcon,
  Flag as GoalIcon,
  Assignment as ActivityIcon,
  AttachFile as EvidenceIcon,
  Comment as NotesIcon,
  Person as PersonIcon,
  CalendarToday as DateIcon,
  Add as AddIcon,
  Edit as EditIcon,
  PhotoCamera as CameraIcon,
  InsertDriveFile as FileIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format, differenceInDays, startOfDay } from 'date-fns';
import {
  ImprovementPlan,
  ImprovementGoal,
  FollowUpActivity,
  ProgressUpdate,
} from '../../types/improvement';

interface ProgressTrackerProps {
  plan: ImprovementPlan;
  onProgressUpdate: (update: Partial<ProgressUpdate>) => Promise<void>;
  onGoalUpdate: (goalId: string, updates: Partial<ImprovementGoal>) => Promise<void>;
  onActivityUpdate: (activityId: string, updates: Partial<FollowUpActivity>) => Promise<void>;
  currentUserId: string;
  currentUserRole: string;
  readOnly?: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`progress-tabpanel-${index}`}
      aria-labelledby={`progress-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  plan,
  onProgressUpdate,
  onGoalUpdate,
  onActivityUpdate,
  currentUserId,
  currentUserRole,
  readOnly = false,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState<ImprovementGoal | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<FollowUpActivity | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [updateType, setUpdateType] = useState<'goal' | 'activity' | 'plan'>('plan');
  const [progressData, setProgressData] = useState<Partial<ProgressUpdate>>({
    status: 'on_track',
    progressPercentage: 0,
    notes: '',
    notesKh: '',
    evidence: [],
  });

  const calculateOverallProgress = (): number => {
    const totalGoals = plan.goals.length;
    const completedGoals = plan.goals.filter(g => g.status === 'achieved').length;
    const totalActivities = plan.activities.length;
    const completedActivities = plan.activities.filter(a => a.status === 'completed').length;

    if (totalGoals === 0 && totalActivities === 0) return 0;

    const goalProgress = totalGoals > 0 ? (completedGoals / totalGoals) * 50 : 0;
    const activityProgress = totalActivities > 0 ? (completedActivities / totalActivities) * 50 : 0;

    return Math.round(goalProgress + activityProgress);
  };

  const calculateGoalProgress = (goal: ImprovementGoal): number => {
    if (!goal.targetValue || !goal.currentValue) return 0;
    return Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'on_track':
      case 'achieved':
      case 'completed':
        return theme.palette.success.main;
      case 'at_risk':
      case 'in_progress':
        return theme.palette.warning.main;
      case 'delayed':
      case 'not_achieved':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on_track':
        return <OnTrackIcon />;
      case 'at_risk':
        return <AtRiskIcon />;
      case 'delayed':
        return <DelayedIcon />;
      case 'completed':
      case 'achieved':
        return <CompleteIcon />;
      default:
        return <ProgressIcon />;
    }
  };

  const getDaysRemaining = (targetDate: string): number => {
    return differenceInDays(new Date(targetDate), startOfDay(new Date()));
  };

  const handleProgressUpdate = async () => {
    const update: Partial<ProgressUpdate> = {
      ...progressData,
      planId: plan.id,
      goalId: selectedGoal?.id,
      activityId: selectedActivity?.id,
      date: new Date().toISOString(),
      updatedBy: currentUserId,
      updatedByRole: currentUserRole,
    };

    await onProgressUpdate(update);

    // Update goal or activity status if needed
    if (selectedGoal && progressData.status) {
      await onGoalUpdate(selectedGoal.id, {
        status: progressData.status as any,
        currentValue: progressData.progressPercentage,
      });
    }

    if (selectedActivity && progressData.status) {
      await onActivityUpdate(selectedActivity.id, {
        status: progressData.status === 'completed' ? 'completed' : progressData.status as any,
      });
    }

    setShowUpdateDialog(false);
    resetProgressData();
  };

  const resetProgressData = () => {
    setProgressData({
      status: 'on_track',
      progressPercentage: 0,
      notes: '',
      notesKh: '',
      evidence: [],
    });
    setSelectedGoal(null);
    setSelectedActivity(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // In a real implementation, you would upload these files to a server
      const fileUrls = Array.from(files).map(file => URL.createObjectURL(file));
      setProgressData({
        ...progressData,
        evidence: [...(progressData.evidence || []), ...fileUrls],
      });
    }
  };

  const renderOverview = () => {
    const overallProgress = calculateOverallProgress();
    const daysRemaining = getDaysRemaining(plan.targetDate);
    const recentUpdates = plan.progress.slice(-5).reverse();

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('progress.overallProgress')}
              </Typography>
              <Box sx={{ position: 'relative', display: 'inline-flex', width: '100%', justifyContent: 'center', my: 2 }}>
                <CircularProgress
                  variant="determinate"
                  value={overallProgress}
                  size={120}
                  thickness={4}
                  sx={{ color: getStatusColor(plan.status) }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h4" component="div" color="text.secondary">
                    {`${overallProgress}%`}
                  </Typography>
                </Box>
              </Box>
              <Stack direction="row" justifyContent="center" spacing={1}>
                <Chip
                  icon={getStatusIcon(plan.status)}
                  label={t(`planStatus.${plan.status}`)}
                  color={
                    plan.status === 'active' ? 'primary' :
                    plan.status === 'completed' ? 'success' :
                    'default'
                  }
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('progress.timeline')}
              </Typography>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('progress.startDate')}
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(plan.createdDate), 'MMM d, yyyy')}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('progress.targetDate')}
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(plan.targetDate), 'MMM d, yyyy')}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('progress.daysRemaining')}
                  </Typography>
                  <Typography 
                    variant="h5" 
                    color={daysRemaining < 0 ? 'error' : daysRemaining < 30 ? 'warning' : 'success'}
                  >
                    {daysRemaining < 0 
                      ? t('progress.overdue', { days: Math.abs(daysRemaining) })
                      : t('progress.days', { days: daysRemaining })
                    }
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('progress.summary')}
              </Typography>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      {t('progress.goals')}
                    </Typography>
                    <Typography variant="body1">
                      {plan.goals.filter(g => g.status === 'achieved').length} / {plan.goals.length}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={plan.goals.length > 0 
                      ? (plan.goals.filter(g => g.status === 'achieved').length / plan.goals.length) * 100 
                      : 0
                    }
                    sx={{ mt: 1 }}
                  />
                </Box>
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      {t('progress.activities')}
                    </Typography>
                    <Typography variant="body1">
                      {plan.activities.filter(a => a.status === 'completed').length} / {plan.activities.length}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={plan.activities.length > 0 
                      ? (plan.activities.filter(a => a.status === 'completed').length / plan.activities.length) * 100 
                      : 0
                    }
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">{t('progress.recentUpdates')}</Typography>
              {!readOnly && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setUpdateType('plan');
                    setShowUpdateDialog(true);
                  }}
                >
                  {t('progress.addUpdate')}
                </Button>
              )}
            </Stack>
            
            {recentUpdates.length === 0 ? (
              <Alert severity="info">{t('progress.noUpdates')}</Alert>
            ) : (
              <Timeline position="alternate">
                {recentUpdates.map((update, index) => (
                  <TimelineItem key={update.id}>
                    <TimelineOppositeContent sx={{ m: 'auto 0' }}>
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(update.date), 'MMM d, yyyy')}
                      </Typography>
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineConnector sx={{ bgcolor: 'grey.300' }} />
                      <TimelineDot color={
                        update.status === 'completed' ? 'success' :
                        update.status === 'at_risk' ? 'warning' :
                        update.status === 'delayed' ? 'error' :
                        'primary'
                      }>
                        {getStatusIcon(update.status)}
                      </TimelineDot>
                      <TimelineConnector sx={{ bgcolor: 'grey.300' }} />
                    </TimelineSeparator>
                    <TimelineContent sx={{ py: '12px', px: 2 }}>
                      <Paper elevation={1} sx={{ p: 2 }}>
                        <Stack spacing={1}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                              label={`${update.progressPercentage}%`}
                              size="small"
                              color="primary"
                            />
                            <Typography variant="body2" color="text.secondary">
                              {t('progress.by')} {update.updatedBy}
                            </Typography>
                          </Stack>
                          <Typography variant="body2">
                            {i18n.language === 'km' ? update.notesKh || update.notes : update.notes}
                          </Typography>
                          {update.evidence && update.evidence.length > 0 && (
                            <Stack direction="row" spacing={0.5}>
                              <EvidenceIcon fontSize="small" color="action" />
                              <Typography variant="caption" color="text.secondary">
                                {t('progress.evidenceCount', { count: update.evidence.length })}
                              </Typography>
                            </Stack>
                          )}
                        </Stack>
                      </Paper>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            )}
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const renderGoalProgress = () => {
    return (
      <Grid container spacing={3}>
        {plan.goals.map((goal) => {
          const progress = calculateGoalProgress(goal);
          const daysRemaining = getDaysRemaining(goal.dueDate);

          return (
            <Grid item xs={12} md={6} key={goal.id}>
              <Card>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="start" mb={2}>
                    <Box flex={1}>
                      <Typography variant="h6" gutterBottom>
                        {i18n.language === 'km' ? goal.titleKh || goal.title : goal.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {i18n.language === 'km' ? goal.descriptionKh || goal.description : goal.description}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Chip
                        icon={getStatusIcon(goal.status)}
                        label={t(`goalStatus.${goal.status}`)}
                        size="small"
                        color={
                          goal.status === 'achieved' ? 'success' :
                          goal.status === 'not_achieved' ? 'error' :
                          'default'
                        }
                      />
                      {!readOnly && goal.status !== 'achieved' && (
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedGoal(goal);
                            setUpdateType('goal');
                            setShowUpdateDialog(true);
                          }}
                        >
                          <UpdateIcon />
                        </IconButton>
                      )}
                    </Stack>
                  </Stack>

                  <Box mb={2}>
                    <Stack direction="row" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        {t('progress.progress')}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {goal.currentValue || 0} / {goal.targetValue} ({progress}%)
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={progress}
                      sx={{
                        height: 8,
                        borderRadius: 1,
                        backgroundColor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getStatusColor(goal.status),
                        },
                      }}
                    />
                  </Box>

                  <Stack direction="row" spacing={2}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <DateIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {daysRemaining < 0
                          ? t('progress.overdue', { days: Math.abs(daysRemaining) })
                          : t('progress.dueIn', { days: daysRemaining })
                        }
                      </Typography>
                    </Stack>
                    {goal.measurementCriteria && (
                      <Tooltip title={goal.measurementCriteria}>
                        <Chip
                          icon={<NotesIcon />}
                          label={t('progress.criteria')}
                          size="small"
                          variant="outlined"
                        />
                      </Tooltip>
                    )}
                  </Stack>

                  {/* Recent updates for this goal */}
                  {plan.progress.filter(p => p.goalId === goal.id).length > 0 && (
                    <Box mt={2}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {t('progress.recentUpdates')}
                      </Typography>
                      <List dense>
                        {plan.progress
                          .filter(p => p.goalId === goal.id)
                          .slice(-3)
                          .reverse()
                          .map((update) => (
                            <ListItem key={update.id} disableGutters>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                {getStatusIcon(update.status)}
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Typography variant="body2">
                                    {i18n.language === 'km' ? update.notesKh || update.notes : update.notes}
                                  </Typography>
                                }
                                secondary={
                                  <Typography variant="caption" color="text.secondary">
                                    {format(new Date(update.date), 'MMM d')} - {update.progressPercentage}%
                                  </Typography>
                                }
                              />
                            </ListItem>
                          ))}
                      </List>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}

        {plan.goals.length === 0 && (
          <Grid item xs={12}>
            <Alert severity="info">{t('progress.noGoals')}</Alert>
          </Grid>
        )}
      </Grid>
    );
  };

  const renderActivityProgress = () => {
    const groupedActivities = {
      scheduled: plan.activities.filter(a => a.status === 'scheduled'),
      in_progress: plan.activities.filter(a => a.status === 'in_progress'),
      completed: plan.activities.filter(a => a.status === 'completed'),
      postponed: plan.activities.filter(a => a.status === 'postponed'),
      cancelled: plan.activities.filter(a => a.status === 'cancelled'),
    };

    return (
      <Stack spacing={3}>
        {Object.entries(groupedActivities).map(([status, activities]) => {
          if (activities.length === 0) return null;

          return (
            <Paper key={status} elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {t(`activityStatus.${status}`)} ({activities.length})
              </Typography>
              <List>
                {activities.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem>
                      <ListItemIcon>
                        {getActivityIcon(activity.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="subtitle1">
                              {i18n.language === 'km' ? activity.titleKh || activity.title : activity.title}
                            </Typography>
                            <Chip
                              label={t(`activityType.${activity.type}`)}
                              size="small"
                              variant="outlined"
                            />
                          </Stack>
                        }
                        secondary={
                          <Stack spacing={1} sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              {i18n.language === 'km' ? activity.descriptionKh || activity.description : activity.description}
                            </Typography>
                            <Stack direction="row" spacing={2}>
                              <Chip
                                icon={<DateIcon />}
                                label={format(new Date(activity.scheduledDate), 'MMM d, yyyy')}
                                size="small"
                              />
                              {activity.facilitator && (
                                <Chip
                                  icon={<PersonIcon />}
                                  label={activity.facilitator}
                                  size="small"
                                />
                              )}
                            </Stack>
                          </Stack>
                        }
                      />
                      {!readOnly && activity.status !== 'completed' && activity.status !== 'cancelled' && (
                        <IconButton
                          onClick={() => {
                            setSelectedActivity(activity);
                            setUpdateType('activity');
                            setShowUpdateDialog(true);
                          }}
                        >
                          <UpdateIcon />
                        </IconButton>
                      )}
                    </ListItem>
                    {index < activities.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          );
        })}

        {plan.activities.length === 0 && (
          <Alert severity="info">{t('progress.noActivities')}</Alert>
        )}
      </Stack>
    );
  };

  const getActivityIcon = (type: string) => {
    // Implementation from ActivityScheduler
    return <ActivityIcon />;
  };

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {t('progress.title')}
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label={t('progress.overview')} />
            <Tab label={t('progress.goals')} />
            <Tab label={t('progress.activities')} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {renderOverview()}
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          {renderGoalProgress()}
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          {renderActivityProgress()}
        </TabPanel>
      </Paper>

      {/* Progress Update Dialog */}
      <Dialog open={showUpdateDialog} onClose={() => setShowUpdateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {updateType === 'goal' && t('progress.updateGoal')}
          {updateType === 'activity' && t('progress.updateActivity')}
          {updateType === 'plan' && t('progress.updatePlan')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {(selectedGoal || selectedActivity) && (
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>{t('progress.updating')}:</strong>{' '}
                  {selectedGoal 
                    ? (i18n.language === 'km' ? selectedGoal.titleKh || selectedGoal.title : selectedGoal.title)
                    : (i18n.language === 'km' ? selectedActivity?.titleKh || selectedActivity?.title : selectedActivity?.title)
                  }
                </Typography>
              </Alert>
            )}

            <FormControl fullWidth>
              <InputLabel>{t('progress.status')}</InputLabel>
              <Select
                value={progressData.status}
                onChange={(e) => setProgressData({ ...progressData, status: e.target.value })}
                label={t('progress.status')}
              >
                <MenuItem value="on_track">{t('progressStatus.on_track')}</MenuItem>
                <MenuItem value="at_risk">{t('progressStatus.at_risk')}</MenuItem>
                <MenuItem value="delayed">{t('progressStatus.delayed')}</MenuItem>
                <MenuItem value="completed">{t('progressStatus.completed')}</MenuItem>
              </Select>
            </FormControl>

            <Box>
              <Typography gutterBottom>{t('progress.progressPercentage')}</Typography>
              <Stack spacing={2} direction="row" alignItems="center">
                <Slider
                  value={progressData.progressPercentage}
                  onChange={(e, value) => setProgressData({ ...progressData, progressPercentage: value as number })}
                  valueLabelDisplay="auto"
                  step={5}
                  marks
                  min={0}
                  max={100}
                />
                <Typography variant="body1" sx={{ minWidth: 50 }}>
                  {progressData.progressPercentage}%
                </Typography>
              </Stack>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={3}
              label={t('progress.notes')}
              value={progressData.notes}
              onChange={(e) => setProgressData({ ...progressData, notes: e.target.value })}
              required
            />

            {i18n.language === 'km' && (
              <TextField
                fullWidth
                multiline
                rows={3}
                label={t('progress.notesKh')}
                value={progressData.notesKh}
                onChange={(e) => setProgressData({ ...progressData, notesKh: e.target.value })}
              />
            )}

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t('progress.evidence')}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CameraIcon />}
                >
                  {t('progress.uploadPhoto')}
                  <input
                    hidden
                    accept="image/*"
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                  />
                </Button>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<FileIcon />}
                >
                  {t('progress.uploadDocument')}
                  <input
                    hidden
                    accept=".pdf,.doc,.docx"
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                  />
                </Button>
              </Stack>
              {progressData.evidence && progressData.evidence.length > 0 && (
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  {progressData.evidence.map((file, index) => (
                    <Chip
                      key={index}
                      label={`File ${index + 1}`}
                      size="small"
                      onDelete={() => {
                        setProgressData({
                          ...progressData,
                          evidence: progressData.evidence?.filter((_, i) => i !== index),
                        });
                      }}
                    />
                  ))}
                </Stack>
              )}
            </Box>

            {updateType === 'goal' && selectedGoal && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  {t('progress.currentValue')}
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={selectedGoal.currentValue || 0}
                  onChange={(e) => {
                    if (selectedGoal) {
                      setSelectedGoal({
                        ...selectedGoal,
                        currentValue: parseInt(e.target.value) || 0,
                      });
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <Typography variant="body2">
                        / {selectedGoal.targetValue}
                      </Typography>
                    ),
                  }}
                />
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUpdateDialog(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleProgressUpdate}
            variant="contained"
            disabled={!progressData.notes}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProgressTracker;