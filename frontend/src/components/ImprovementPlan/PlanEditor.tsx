import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Stack,
  IconButton,
  Alert,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  FormHelperText,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  CheckCircle as CompleteIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Flag as PriorityIcon,
  Target as GoalIcon,
  Assignment as ActivityIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { format, addDays, addMonths } from 'date-fns';
import {
  ImprovementPlan,
  ImprovementGoal,
  FollowUpActivity,
  Resource,
  PlanTemplate,
} from '../../types/improvement';
import { ObservationSession } from '../../types/observation';

interface PlanEditorProps {
  session?: ObservationSession;
  existingPlan?: ImprovementPlan;
  templates?: PlanTemplate[];
  onSave: (plan: Partial<ImprovementPlan>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const PlanEditor: React.FC<PlanEditorProps> = ({
  session,
  existingPlan,
  templates = [],
  onSave,
  onCancel,
  isLoading = false,
}) => {
  const { t, i18n } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const [goals, setGoals] = useState<Partial<ImprovementGoal>[]>(existingPlan?.goals || []);
  const [activities, setActivities] = useState<Partial<FollowUpActivity>[]>(existingPlan?.activities || []);
  const [resources, setResources] = useState<Partial<Resource>[]>(existingPlan?.resources || []);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Partial<ImprovementGoal> | null>(null);
  const [editingActivity, setEditingActivity] = useState<Partial<FollowUpActivity> | null>(null);

  const steps = [
    t('improvement.steps.basicInfo'),
    t('improvement.steps.goals'),
    t('improvement.steps.activities'),
    t('improvement.steps.resources'),
    t('improvement.steps.review'),
  ];

  const validationSchema = Yup.object({
    title: Yup.string().required(t('validation.required')),
    description: Yup.string().required(t('validation.required')),
    priority: Yup.string().required(t('validation.required')),
    targetDate: Yup.date()
      .min(new Date(), t('validation.futureDate'))
      .required(t('validation.required')),
  });

  const formik = useFormik({
    initialValues: {
      title: existingPlan?.title || '',
      titleKh: existingPlan?.titleKh || '',
      description: existingPlan?.description || '',
      descriptionKh: existingPlan?.descriptionKh || '',
      priority: existingPlan?.priority || 'medium',
      targetDate: existingPlan?.targetDate || format(addMonths(new Date(), 3), 'yyyy-MM-dd'),
    },
    validationSchema,
    onSubmit: async (values) => {
      const plan: Partial<ImprovementPlan> = {
        ...values,
        sessionId: session?.id || existingPlan?.sessionId || '',
        teacherId: session?.teacherId || existingPlan?.teacherId || '',
        teacherName: session?.teacherName || existingPlan?.teacherName || '',
        observerId: session?.observerId || existingPlan?.observerId || '',
        observerName: session?.observerName || existingPlan?.observerName || '',
        schoolId: session?.schoolId || existingPlan?.schoolId || '',
        schoolName: session?.schoolName || existingPlan?.schoolName || '',
        status: existingPlan?.status || 'draft',
        goals: goals as ImprovementGoal[],
        activities: activities as FollowUpActivity[],
        resources: resources as Resource[],
        progress: existingPlan?.progress || [],
        approvals: existingPlan?.approvals || [],
      };

      await onSave(plan);
    },
  });

  useEffect(() => {
    if (selectedTemplate && templates.length > 0) {
      const template = templates.find(t => t.id === selectedTemplate);
      if (template) {
        setGoals(template.goals || []);
        setActivities(template.activities || []);
      }
    }
  }, [selectedTemplate, templates]);

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      formik.handleSubmit();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleAddGoal = (goal: Partial<ImprovementGoal>) => {
    if (editingGoal) {
      setGoals(goals.map(g => g.id === editingGoal.id ? goal : g));
    } else {
      setGoals([...goals, { ...goal, id: Date.now().toString() }]);
    }
    setShowGoalDialog(false);
    setEditingGoal(null);
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals(goals.filter(g => g.id !== goalId));
    // Also remove activities associated with this goal
    setActivities(activities.filter(a => a.goalId !== goalId));
  };

  const handleAddActivity = (activity: Partial<FollowUpActivity>) => {
    if (editingActivity) {
      setActivities(activities.map(a => a.id === editingActivity.id ? activity : a));
    } else {
      setActivities([...activities, { ...activity, id: Date.now().toString() }]);
    }
    setShowActivityDialog(false);
    setEditingActivity(null);
  };

  const handleDeleteActivity = (activityId: string) => {
    setActivities(activities.filter(a => a.id !== activityId));
  };

  const renderBasicInfo = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('improvement.basicInfo.title')}
      </Typography>

      {templates.length > 0 && (
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>{t('improvement.basicInfo.template')}</InputLabel>
          <Select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            label={t('improvement.basicInfo.template')}
          >
            <MenuItem value="">
              <em>{t('improvement.basicInfo.noTemplate')}</em>
            </MenuItem>
            {templates.map((template) => (
              <MenuItem key={template.id} value={template.id}>
                {i18n.language === 'km' ? template.nameKh || template.name : template.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label={t('improvement.basicInfo.planTitle')}
            name="title"
            value={formik.values.title}
            onChange={formik.handleChange}
            error={formik.touched.title && Boolean(formik.errors.title)}
            helperText={formik.touched.title && formik.errors.title}
          />
        </Grid>

        {i18n.language === 'km' && (
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('improvement.basicInfo.planTitleKh')}
              name="titleKh"
              value={formik.values.titleKh}
              onChange={formik.handleChange}
            />
          </Grid>
        )}

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label={t('improvement.basicInfo.description')}
            name="description"
            value={formik.values.description}
            onChange={formik.handleChange}
            error={formik.touched.description && Boolean(formik.errors.description)}
            helperText={formik.touched.description && formik.errors.description}
          />
        </Grid>

        {i18n.language === 'km' && (
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label={t('improvement.basicInfo.descriptionKh')}
              name="descriptionKh"
              value={formik.values.descriptionKh}
              onChange={formik.handleChange}
            />
          </Grid>
        )}

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>{t('improvement.basicInfo.priority')}</InputLabel>
            <Select
              name="priority"
              value={formik.values.priority}
              onChange={formik.handleChange}
              error={formik.touched.priority && Boolean(formik.errors.priority)}
              label={t('improvement.basicInfo.priority')}
            >
              <MenuItem value="high">{t('priority.high')}</MenuItem>
              <MenuItem value="medium">{t('priority.medium')}</MenuItem>
              <MenuItem value="low">{t('priority.low')}</MenuItem>
            </Select>
            {formik.touched.priority && formik.errors.priority && (
              <FormHelperText error>{formik.errors.priority}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="date"
            label={t('improvement.basicInfo.targetDate')}
            name="targetDate"
            value={formik.values.targetDate}
            onChange={formik.handleChange}
            error={formik.touched.targetDate && Boolean(formik.errors.targetDate)}
            helperText={formik.touched.targetDate && formik.errors.targetDate}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {session && (
          <Grid item xs={12}>
            <Alert severity="info">
              <Stack spacing={1}>
                <Typography variant="body2">
                  <strong>{t('improvement.basicInfo.linkedSession')}:</strong>
                </Typography>
                <Box display="flex" gap={2} flexWrap="wrap">
                  <Chip
                    icon={<PersonIcon />}
                    label={`${t('teacher')}: ${session.teacherName}`}
                    size="small"
                  />
                  <Chip
                    icon={<SchoolIcon />}
                    label={`${t('school')}: ${session.schoolName}`}
                    size="small"
                  />
                  <Chip
                    icon={<CalendarIcon />}
                    label={`${t('date')}: ${session.observationDate}`}
                    size="small"
                  />
                </Box>
              </Stack>
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );

  const renderGoals = () => (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">{t('improvement.goals.title')}</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingGoal(null);
            setShowGoalDialog(true);
          }}
        >
          {t('improvement.goals.addGoal')}
        </Button>
      </Stack>

      {goals.length === 0 ? (
        <Alert severity="info">{t('improvement.goals.noGoals')}</Alert>
      ) : (
        <List>
          {goals.map((goal, index) => (
            <React.Fragment key={goal.id}>
              <ListItem>
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <GoalIcon color="primary" />
                      <Typography variant="subtitle1">
                        {i18n.language === 'km' ? goal.titleKh || goal.title : goal.title}
                      </Typography>
                    </Stack>
                  }
                  secondary={
                    <Box mt={1}>
                      <Typography variant="body2" color="text.secondary">
                        {i18n.language === 'km' ? goal.descriptionKh || goal.description : goal.description}
                      </Typography>
                      <Stack direction="row" spacing={1} mt={1}>
                        <Chip
                          label={`${t('dueDate')}: ${goal.dueDate ? format(new Date(goal.dueDate), 'MMM d, yyyy') : '-'}`}
                          size="small"
                          variant="outlined"
                        />
                        {goal.targetValue && (
                          <Chip
                            label={`${t('target')}: ${goal.targetValue}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => {
                      setEditingGoal(goal);
                      setShowGoalDialog(true);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    onClick={() => handleDeleteGoal(goal.id!)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              {index < goals.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  );

  const renderActivities = () => (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">{t('improvement.activities.title')}</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingActivity(null);
            setShowActivityDialog(true);
          }}
        >
          {t('improvement.activities.addActivity')}
        </Button>
      </Stack>

      {activities.length === 0 ? (
        <Alert severity="info">{t('improvement.activities.noActivities')}</Alert>
      ) : (
        <Grid container spacing={2}>
          {activities.map((activity) => (
            <Grid item xs={12} md={6} key={activity.id}>
              <Paper elevation={2} sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="start">
                  <Box flex={1}>
                    <Typography variant="subtitle1" gutterBottom>
                      {i18n.language === 'km' ? activity.titleKh || activity.title : activity.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {i18n.language === 'km' ? activity.descriptionKh || activity.description : activity.description}
                    </Typography>
                    <Stack direction="row" spacing={1} mt={1}>
                      <Chip
                        label={t(`activityType.${activity.type}`)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={activity.scheduledDate ? format(new Date(activity.scheduledDate), 'MMM d') : '-'}
                        size="small"
                        icon={<CalendarIcon />}
                      />
                      {activity.duration && (
                        <Chip
                          label={`${activity.duration} ${t('minutes')}`}
                          size="small"
                        />
                      )}
                    </Stack>
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditingActivity(activity);
                        setShowActivityDialog(true);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteActivity(activity.id!)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  const renderResources = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('improvement.resources.title')}
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        {t('improvement.resources.description')}
      </Alert>
      {/* Resources section would be implemented similarly */}
      <Typography variant="body2" color="text.secondary">
        {t('improvement.resources.comingSoon')}
      </Typography>
    </Box>
  );

  const renderReview = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('improvement.review.title')}
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              {t('improvement.review.planDetails')}
            </Typography>
            <Typography variant="h6" gutterBottom>
              {formik.values.title}
            </Typography>
            <Typography variant="body2" paragraph>
              {formik.values.description}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Stack spacing={1}>
              <Typography variant="caption" color="text.secondary">
                {t('priority')}
              </Typography>
              <Chip
                label={t(`priority.${formik.values.priority}`)}
                color={
                  formik.values.priority === 'high' ? 'error' :
                  formik.values.priority === 'medium' ? 'warning' : 'default'
                }
                icon={<PriorityIcon />}
              />
            </Stack>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Stack spacing={1}>
              <Typography variant="caption" color="text.secondary">
                {t('targetDate')}
              </Typography>
              <Typography variant="body1">
                {format(new Date(formik.values.targetDate), 'MMMM d, yyyy')}
              </Typography>
            </Stack>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={3}>
              <Grid item xs={4} textAlign="center">
                <Typography variant="h4" color="primary">
                  {goals.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('improvement.review.totalGoals')}
                </Typography>
              </Grid>
              <Grid item xs={4} textAlign="center">
                <Typography variant="h4" color="primary">
                  {activities.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('improvement.review.totalActivities')}
                </Typography>
              </Grid>
              <Grid item xs={4} textAlign="center">
                <Typography variant="h4" color="primary">
                  {resources.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('improvement.review.totalResources')}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {goals.length === 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('improvement.review.noGoalsWarning')}
        </Alert>
      )}

      {activities.length === 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('improvement.review.noActivitiesWarning')}
        </Alert>
      )}
    </Box>
  );

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderBasicInfo();
      case 1:
        return renderGoals();
      case 2:
        return renderActivities();
      case 3:
        return renderResources();
      case 4:
        return renderReview();
      default:
        return null;
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {existingPlan ? t('improvement.editPlan') : t('improvement.createPlan')}
      </Typography>

      <Stepper activeStep={activeStep} orientation="vertical" sx={{ mt: 3 }}>
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
            <StepContent>
              <Box sx={{ mb: 2 }}>
                {getStepContent(index)}
              </Box>
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  startIcon={index === steps.length - 1 ? <SaveIcon /> : <NextIcon />}
                  disabled={isLoading}
                  sx={{ mr: 1 }}
                >
                  {index === steps.length - 1 ? t('common.save') : t('common.next')}
                </Button>
                <Button
                  disabled={index === 0}
                  onClick={handleBack}
                  startIcon={<BackIcon />}
                  sx={{ mr: 1 }}
                >
                  {t('common.back')}
                </Button>
                <Button
                  onClick={onCancel}
                  startIcon={<CancelIcon />}
                >
                  {t('common.cancel')}
                </Button>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {/* Goal Dialog */}
      <GoalDialog
        open={showGoalDialog}
        onClose={() => {
          setShowGoalDialog(false);
          setEditingGoal(null);
        }}
        onSave={handleAddGoal}
        goal={editingGoal}
        existingIndicators={session?.responses?.map(r => r.indicatorId) || []}
      />

      {/* Activity Dialog */}
      <ActivityDialog
        open={showActivityDialog}
        onClose={() => {
          setShowActivityDialog(false);
          setEditingActivity(null);
        }}
        onSave={handleAddActivity}
        activity={editingActivity}
        goals={goals}
      />
    </Paper>
  );
};

// Goal Dialog Component
const GoalDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onSave: (goal: Partial<ImprovementGoal>) => void;
  goal?: Partial<ImprovementGoal> | null;
  existingIndicators: string[];
}> = ({ open, onClose, onSave, goal, existingIndicators }) => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState<Partial<ImprovementGoal>>(
    goal || {
      title: '',
      titleKh: '',
      description: '',
      descriptionKh: '',
      targetIndicators: [],
      measurementCriteria: '',
      targetValue: 0,
      status: 'pending',
      dueDate: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
    }
  );

  useEffect(() => {
    if (goal) {
      setFormData(goal);
    }
  }, [goal]);

  const handleSubmit = () => {
    onSave(formData);
    setFormData({
      title: '',
      titleKh: '',
      description: '',
      descriptionKh: '',
      targetIndicators: [],
      measurementCriteria: '',
      targetValue: 0,
      status: 'pending',
      dueDate: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{goal ? t('improvement.goals.editGoal') : t('improvement.goals.addGoal')}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('improvement.goals.goalTitle')}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </Grid>

          {i18n.language === 'km' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('improvement.goals.goalTitleKh')}
                value={formData.titleKh}
                onChange={(e) => setFormData({ ...formData, titleKh: e.target.value })}
              />
            </Grid>
          )}

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label={t('improvement.goals.description')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </Grid>

          {i18n.language === 'km' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label={t('improvement.goals.descriptionKh')}
                value={formData.descriptionKh}
                onChange={(e) => setFormData({ ...formData, descriptionKh: e.target.value })}
              />
            </Grid>
          )}

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label={t('improvement.goals.targetValue')}
              value={formData.targetValue}
              onChange={(e) => setFormData({ ...formData, targetValue: parseInt(e.target.value) || 0 })}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="date"
              label={t('improvement.goals.dueDate')}
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label={t('improvement.goals.measurementCriteria')}
              value={formData.measurementCriteria}
              onChange={(e) => setFormData({ ...formData, measurementCriteria: e.target.value })}
              helperText={t('improvement.goals.measurementCriteriaHelp')}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!formData.title || !formData.description}
        >
          {goal ? t('common.update') : t('common.add')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Activity Dialog Component
const ActivityDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onSave: (activity: Partial<FollowUpActivity>) => void;
  activity?: Partial<FollowUpActivity> | null;
  goals: Partial<ImprovementGoal>[];
}> = ({ open, onClose, onSave, activity, goals }) => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState<Partial<FollowUpActivity>>(
    activity || {
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
      reminders: [],
    }
  );

  useEffect(() => {
    if (activity) {
      setFormData(activity);
    }
  }, [activity]);

  const handleSubmit = () => {
    onSave(formData);
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
      reminders: [],
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{activity ? t('improvement.activities.editActivity') : t('improvement.activities.addActivity')}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('improvement.activities.activityTitle')}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </Grid>

          {i18n.language === 'km' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('improvement.activities.activityTitleKh')}
                value={formData.titleKh}
                onChange={(e) => setFormData({ ...formData, titleKh: e.target.value })}
              />
            </Grid>
          )}

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label={t('improvement.activities.description')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </Grid>

          {i18n.language === 'km' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label={t('improvement.activities.descriptionKh')}
                value={formData.descriptionKh}
                onChange={(e) => setFormData({ ...formData, descriptionKh: e.target.value })}
              />
            </Grid>
          )}

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>{t('improvement.activities.type')}</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                label={t('improvement.activities.type')}
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
            <FormControl fullWidth>
              <InputLabel>{t('improvement.activities.linkedGoal')}</InputLabel>
              <Select
                value={formData.goalId || ''}
                onChange={(e) => setFormData({ ...formData, goalId: e.target.value })}
                label={t('improvement.activities.linkedGoal')}
              >
                <MenuItem value="">
                  <em>{t('improvement.activities.noLinkedGoal')}</em>
                </MenuItem>
                {goals.map((goal) => (
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
              label={t('improvement.activities.scheduledDate')}
              value={formData.scheduledDate}
              onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label={t('improvement.activities.duration')}
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
              InputProps={{
                endAdornment: <Typography variant="body2">{t('minutes')}</Typography>,
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('improvement.activities.location')}
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('improvement.activities.facilitator')}
              value={formData.facilitator}
              onChange={(e) => setFormData({ ...formData, facilitator: e.target.value })}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!formData.title || !formData.description}
        >
          {activity ? t('common.update') : t('common.add')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PlanEditor;