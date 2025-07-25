import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  StepIcon,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  RadioGroup,
  Radio,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Tooltip,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  School as SchoolIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Refresh as RestartIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Quiz as QuizIcon,
  VideoLibrary as VideoIcon,
  Article as ArticleIcon,
  Task as TaskIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Star as StarIcon,
  EmojiEvents as TrophyIcon,
  Certificate as CertificateIcon,
  Feedback as FeedbackIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format, addDays, differenceInDays } from 'date-fns';
import {
  User,
  UserRole,
} from '../../types/userManagement';

interface OnboardingStep {
  id: string;
  title: string;
  titleKh?: string;
  description: string;
  descriptionKh?: string;
  type: 'form' | 'training' | 'quiz' | 'document' | 'video' | 'task';
  isRequired: boolean;
  estimatedDuration: number; // in minutes
  prerequisites: string[];
  content?: any;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';
  completedAt?: string;
  score?: number;
  maxScore?: number;
  attempts?: number;
  maxAttempts?: number;
}

interface OnboardingWorkflow {
  id: string;
  name: string;
  nameKh?: string;
  description: string;
  descriptionKh?: string;
  targetRole: string;
  steps: OnboardingStep[];
  estimatedDuration: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface OnboardingProgress {
  userId: string;
  workflowId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  currentStepId?: string;
  startedAt?: string;
  completedAt?: string;
  completionRate: number;
  timeSpent: number; // in minutes
  stepProgress: Record<string, OnboardingStep>;
}

interface TrainingMaterial {
  id: string;
  type: 'video' | 'document' | 'quiz' | 'interactive';
  title: string;
  titleKh?: string;
  description: string;
  descriptionKh?: string;
  url?: string;
  content?: any;
  duration: number;
  isRequired: boolean;
  tags: string[];
}

interface UserOnboardingWorkflowProps {
  workflows: OnboardingWorkflow[];
  userProgress: OnboardingProgress[];
  trainingMaterials: TrainingMaterial[];
  currentUser: User;
  selectedUser?: User;
  onStartWorkflow: (workflowId: string, userId: string) => Promise<void>;
  onCompleteStep: (progressId: string, stepId: string, data?: any) => Promise<void>;
  onSkipStep: (progressId: string, stepId: string) => Promise<void>;
  onRestartWorkflow: (progressId: string) => Promise<void>;
  onCreateWorkflow: (workflow: Omit<OnboardingWorkflow, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateWorkflow: (workflowId: string, updates: Partial<OnboardingWorkflow>) => Promise<void>;
  onDeleteWorkflow: (workflowId: string) => Promise<void>;
  canManageWorkflows?: boolean;
  canViewAllProgress?: boolean;
}

const UserOnboardingWorkflow: React.FC<UserOnboardingWorkflowProps> = ({
  workflows,
  userProgress,
  trainingMaterials,
  currentUser,
  selectedUser,
  onStartWorkflow,
  onCompleteStep,
  onSkipStep,
  onRestartWorkflow,
  onCreateWorkflow,
  onUpdateWorkflow,
  onDeleteWorkflow,
  canManageWorkflows = false,
  canViewAllProgress = false,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<'progress' | 'workflows' | 'materials'>('progress');
  const [selectedWorkflow, setSelectedWorkflow] = useState<OnboardingWorkflow | null>(null);
  const [selectedProgress, setSelectedProgress] = useState<OnboardingProgress | null>(null);
  const [showWorkflowDialog, setShowWorkflowDialog] = useState(false);
  const [showStepDialog, setShowStepDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep | null>(null);
  const [stepData, setStepData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const targetUser = selectedUser || currentUser;
  const userProgressData = userProgress.filter(p => 
    p.userId === targetUser.id || (canViewAllProgress && !selectedUser)
  );

  const activeWorkflows = workflows.filter(w => w.isActive);
  const userWorkflows = activeWorkflows.filter(w => 
    w.targetRole === targetUser.role.name || w.targetRole === 'all'
  );

  const getStepIcon = (step: OnboardingStep) => {
    switch (step.type) {
      case 'form': return <PersonIcon />;
      case 'training': return <SchoolIcon />;
      case 'quiz': return <QuizIcon />;
      case 'document': return <ArticleIcon />;
      case 'video': return <VideoIcon />;
      case 'task': return <TaskIcon />;
      default: return <AssignmentIcon />;
    }
  };

  const getStepStatusColor = (status: OnboardingStep['status']) => {
    switch (status) {
      case 'completed': return theme.palette.success.main;
      case 'in_progress': return theme.palette.primary.main;
      case 'failed': return theme.palette.error.main;
      case 'skipped': return theme.palette.warning.main;
      default: return theme.palette.grey[400];
    }
  };

  const getProgressColor = (rate: number) => {
    if (rate >= 80) return theme.palette.success.main;
    if (rate >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const handleStartWorkflow = async (workflowId: string) => {
    setLoading(true);
    try {
      await onStartWorkflow(workflowId, targetUser.id);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteStep = async (progressId: string, stepId: string) => {
    setLoading(true);
    try {
      await onCompleteStep(progressId, stepId, stepData);
      setShowStepDialog(false);
      setStepData({});
    } finally {
      setLoading(false);
    }
  };

  const renderProgressOverview = () => (
    <Grid container spacing={3}>
      {userProgressData.map((progress) => {
        const workflow = workflows.find(w => w.id === progress.workflowId);
        if (!workflow) return null;

        const completedSteps = Object.values(progress.stepProgress).filter(
          step => step.status === 'completed'
        ).length;
        const totalSteps = workflow.steps.length;
        const progressRate = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

        return (
          <Grid item xs={12} md={6} lg={4} key={progress.workflowId}>
            <Card
              sx={{
                cursor: 'pointer',
                '&:hover': { boxShadow: theme.shadows[4] },
                border: progress.status === 'in_progress' ? `2px solid ${theme.palette.primary.main}` : 'none',
              }}
              onClick={() => setSelectedProgress(progress)}
            >
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Typography variant="h6" gutterBottom>
                      {i18n.language === 'km' ? workflow.nameKh || workflow.name : workflow.name}
                    </Typography>
                    <Chip
                      label={t(`onboarding.status.${progress.status}`)}
                      size="small"
                      color={progress.status === 'completed' ? 'success' : 
                             progress.status === 'in_progress' ? 'primary' : 'default'}
                    />
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    {i18n.language === 'km' ? workflow.descriptionKh || workflow.description : workflow.description}
                  </Typography>

                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="caption">
                        {t('onboarding.progress')}: {completedSteps}/{totalSteps}
                      </Typography>
                      <Typography variant="caption">
                        {Math.round(progressRate)}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={progressRate}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: alpha(getProgressColor(progressRate), 0.2),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getProgressColor(progressRate),
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>

                  <Stack direction="row" spacing={2} alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TimeIcon fontSize="small" color="action" />
                      <Typography variant="caption">
                        {progress.timeSpent} / {workflow.estimatedDuration} {t('common.minutes')}
                      </Typography>
                    </Stack>
                    {progress.completedAt && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TrophyIcon fontSize="small" color="success" />
                        <Typography variant="caption">
                          {format(new Date(progress.completedAt), 'PPp')}
                        </Typography>
                      </Stack>
                    )}
                  </Stack>
                </Stack>
              </CardContent>

              <CardActions>
                {progress.status === 'not_started' && (
                  <Button
                    startIcon={<StartIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartWorkflow(workflow.id);
                    }}
                    disabled={loading}
                  >
                    {t('onboarding.start')}
                  </Button>
                )}
                {progress.status === 'in_progress' && (
                  <Button
                    startIcon={<PlayArrow />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProgress(progress);
                    }}
                    color="primary"
                  >
                    {t('onboarding.continue')}
                  </Button>
                )}
                {progress.status === 'completed' && (
                  <Button
                    startIcon={<ViewIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProgress(progress);
                    }}
                  >
                    {t('onboarding.review')}
                  </Button>
                )}
                <Button
                  startIcon={<RestartIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestartWorkflow(progress.workflowId);
                  }}
                  disabled={loading}
                >
                  {t('onboarding.restart')}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        );
      })}

      {/* Available Workflows */}
      {userWorkflows
        .filter(workflow => !userProgressData.some(p => p.workflowId === workflow.id))
        .map((workflow) => (
          <Grid item xs={12} md={6} lg={4} key={workflow.id}>
            <Card variant="outlined" sx={{ opacity: 0.8 }}>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Typography variant="h6" gutterBottom>
                      {i18n.language === 'km' ? workflow.nameKh || workflow.name : workflow.name}
                    </Typography>
                    <Chip
                      label={t('onboarding.available')}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    {i18n.language === 'km' ? workflow.descriptionKh || workflow.description : workflow.description}
                  </Typography>

                  <Stack direction="row" spacing={2} alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <ScheduleIcon fontSize="small" color="action" />
                      <Typography variant="caption">
                        {workflow.estimatedDuration} {t('common.minutes')}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TaskIcon fontSize="small" color="action" />
                      <Typography variant="caption">
                        {workflow.steps.length} {t('onboarding.steps')}
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>
              </CardContent>

              <CardActions>
                <Button
                  startIcon={<StartIcon />}
                  onClick={() => handleStartWorkflow(workflow.id)}
                  disabled={loading}
                  variant="contained"
                >
                  {t('onboarding.start')}
                </Button>
                <Button
                  startIcon={<ViewIcon />}
                  onClick={() => setSelectedWorkflow(workflow)}
                >
                  {t('onboarding.preview')}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
    </Grid>
  );

  const renderWorkflowDetail = () => {
    if (!selectedProgress) return null;

    const workflow = workflows.find(w => w.id === selectedProgress.workflowId);
    if (!workflow) return null;

    return (
      <Card>
        <CardContent>
          <Stack spacing={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h5">
                {i18n.language === 'km' ? workflow.nameKh || workflow.name : workflow.name}
              </Typography>
              <Button onClick={() => setSelectedProgress(null)}>
                {t('common.back')}
              </Button>
            </Stack>

            <Stepper orientation="vertical">
              {workflow.steps.map((step, index) => {
                const stepProgress = selectedProgress.stepProgress[step.id] || step;
                const isActive = selectedProgress.currentStepId === step.id;
                const canStart = step.prerequisites.every(prereq =>
                  selectedProgress.stepProgress[prereq]?.status === 'completed'
                );

                return (
                  <Step key={step.id} active={isActive} completed={stepProgress.status === 'completed'}>
                    <StepLabel
                      StepIconComponent={() => (
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            backgroundColor: getStepStatusColor(stepProgress.status),
                          }}
                        >
                          {getStepIcon(step)}
                        </Avatar>
                      )}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="subtitle1">
                          {i18n.language === 'km' ? step.titleKh || step.title : step.title}
                        </Typography>
                        {step.isRequired && (
                          <Chip label={t('onboarding.required')} size="small" color="error" />
                        )}
                        {stepProgress.score !== undefined && (
                          <Chip
                            label={`${stepProgress.score}/${stepProgress.maxScore}`}
                            size="small"
                            color={stepProgress.score >= (stepProgress.maxScore || 0) * 0.7 ? 'success' : 'warning'}
                          />
                        )}
                      </Stack>
                    </StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {i18n.language === 'km' ? step.descriptionKh || step.description : step.description}
                      </Typography>

                      <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                        <TimeIcon fontSize="small" color="action" />
                        <Typography variant="caption">
                          {step.estimatedDuration} {t('common.minutes')}
                        </Typography>
                        {stepProgress.completedAt && (
                          <>
                            <CheckIcon fontSize="small" color="success" />
                            <Typography variant="caption">
                              {t('onboarding.completedAt')} {format(new Date(stepProgress.completedAt), 'PPp')}
                            </Typography>
                          </>
                        )}
                      </Stack>

                      <Stack direction="row" spacing={1}>
                        {stepProgress.status === 'pending' && canStart && (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<StartIcon />}
                            onClick={() => {
                              setCurrentStep(step);
                              setShowStepDialog(true);
                            }}
                          >
                            {t('onboarding.start')}
                          </Button>
                        )}
                        {stepProgress.status === 'in_progress' && (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<PlayArrow />}
                            onClick={() => {
                              setCurrentStep(step);
                              setShowStepDialog(true);
                            }}
                          >
                            {t('onboarding.continue')}
                          </Button>
                        )}
                        {stepProgress.status === 'completed' && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<ViewIcon />}
                            onClick={() => {
                              setCurrentStep(step);
                              setShowStepDialog(true);
                            }}
                          >
                            {t('onboarding.review')}
                          </Button>
                        )}
                        {!step.isRequired && stepProgress.status === 'pending' && (
                          <Button
                            variant="text"
                            size="small"
                            onClick={() => onSkipStep(selectedProgress.workflowId, step.id)}
                          >
                            {t('onboarding.skip')}
                          </Button>
                        )}
                      </Stack>
                    </StepContent>
                  </Step>
                );
              })}
            </Stepper>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  const renderStepDialog = () => {
    if (!currentStep) return null;

    return (
      <Dialog
        open={showStepDialog}
        onClose={() => setShowStepDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {i18n.language === 'km' ? currentStep.titleKh || currentStep.title : currentStep.title}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Typography variant="body1">
              {i18n.language === 'km' ? currentStep.descriptionKh || currentStep.description : currentStep.description}
            </Typography>

            {currentStep.type === 'form' && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {t('onboarding.completeProfile')}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={t('profile.specialization')}
                      value={stepData.specialization || ''}
                      onChange={(e) => setStepData({ ...stepData, specialization: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={t('profile.experience')}
                      type="number"
                      value={stepData.experience || ''}
                      onChange={(e) => setStepData({ ...stepData, experience: e.target.value })}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {currentStep.type === 'quiz' && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {t('onboarding.quiz')}
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  {t('onboarding.quizInstructions')}
                </Alert>
                {/* Quiz questions would be rendered here */}
                <Typography variant="body2">
                  {t('onboarding.quizPlaceholder')}
                </Typography>
              </Box>
            )}

            {currentStep.type === 'document' && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {t('onboarding.reviewDocument')}
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, minHeight: 200 }}>
                  <Typography variant="body2">
                    {t('onboarding.documentContent')}
                  </Typography>
                </Paper>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={stepData.acknowledged || false}
                      onChange={(e) => setStepData({ ...stepData, acknowledged: e.target.checked })}
                    />
                  }
                  label={t('onboarding.acknowledge')}
                />
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStepDialog(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={() => selectedProgress && handleCompleteStep(selectedProgress.workflowId, currentStep.id)}
            disabled={loading}
          >
            {t('onboarding.complete')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={2} alignItems="center">
              <SchoolIcon color="primary" />
              <Typography variant="h5">{t('onboarding.title')}</Typography>
              {selectedUser && (
                <Chip
                  label={`${selectedUser.firstName} ${selectedUser.lastName}`}
                  variant="outlined"
                />
              )}
            </Stack>
            {canManageWorkflows && (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => setShowWorkflowDialog(true)}
              >
                {t('onboarding.manageWorkflows')}
              </Button>
            )}
          </Stack>

          {/* Progress Overview or Workflow Detail */}
          {selectedProgress ? renderWorkflowDetail() : renderProgressOverview()}
        </Stack>
      </Paper>

      {/* Step Dialog */}
      {renderStepDialog()}
    </Box>
  );
};

export default UserOnboardingWorkflow;