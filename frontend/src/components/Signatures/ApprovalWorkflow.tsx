import React, { useState } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  StepConnector,
  Typography,
  Chip,
  Paper,
  Button,
  Stack,
  Avatar,
  Tooltip,
  Alert,
  Collapse,
  IconButton,
  useTheme,
  styled,
} from '@mui/material';
import {
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Schedule as PendingIcon,
  Edit as RequestChangesIcon,
  AccountTree as DelegatedIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

interface ApprovalStep {
  stepNumber: number;
  requiredRole: string[];
  description: string;
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: Date;
  comments?: string;
  action?: 'approve' | 'reject' | 'request_changes' | 'delegate';
  delegatedTo?: string;
}

interface ApprovalWorkflowData {
  sessionId: string;
  currentStep: number;
  totalSteps: number;
  steps: ApprovalStep[];
  isCompleted: boolean;
  canProceed: boolean;
  nextApprovers: string[];
}

interface ApprovalWorkflowProps {
  workflow: ApprovalWorkflowData;
  onApprovalAction?: (action: 'approve' | 'reject' | 'request_changes' | 'delegate') => void;
  currentUserRole?: string;
  compact?: boolean;
}

const CustomStepConnector = styled(StepConnector)(({ theme }) => ({
  '& .MuiStepConnector-line': {
    borderColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[300],
    borderLeftWidth: 3,
    minHeight: 50,
  },
  '&.Mui-active .MuiStepConnector-line': {
    borderColor: theme.palette.primary.main,
  },
  '&.Mui-completed .MuiStepConnector-line': {
    borderColor: theme.palette.success.main,
  },
}));

const ApprovalWorkflow: React.FC<ApprovalWorkflowProps> = ({
  workflow,
  onApprovalAction,
  currentUserRole,
  compact = false,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const getStepIcon = (step: ApprovalStep): React.ReactNode => {
    if (!step.isCompleted) {
      return <PendingIcon />;
    }

    switch (step.action) {
      case 'approve':
        return <ApprovedIcon />;
      case 'reject':
        return <RejectedIcon />;
      case 'request_changes':
        return <RequestChangesIcon />;
      case 'delegate':
        return <DelegatedIcon />;
      default:
        return <ApprovedIcon />;
    }
  };

  const getStepColor = (step: ApprovalStep): string => {
    if (!step.isCompleted) {
      return theme.palette.grey[400];
    }

    switch (step.action) {
      case 'approve':
        return theme.palette.success.main;
      case 'reject':
        return theme.palette.error.main;
      case 'request_changes':
        return theme.palette.warning.main;
      case 'delegate':
        return theme.palette.info.main;
      default:
        return theme.palette.success.main;
    }
  };

  const getActionLabel = (action?: string): string => {
    if (!action) return '';
    return t(`approval.actions.${action}`);
  };

  const canUserApprove = (step: ApprovalStep): boolean => {
    if (!currentUserRole || !onApprovalAction) return false;
    if (step.isCompleted) return false;
    if (workflow.currentStep !== step.stepNumber) return false;
    return step.requiredRole.includes(currentUserRole);
  };

  const handleStepClick = (stepNumber: number) => {
    setExpandedStep(expandedStep === stepNumber ? null : stepNumber);
  };

  if (compact) {
    return (
      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          {t('approval.workflow.title')}
        </Typography>
        
        <Stack spacing={1}>
          {workflow.steps.map((step) => (
            <Box
              key={step.stepNumber}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                borderRadius: 1,
                backgroundColor: step.isCompleted ? 'action.hover' : 'transparent',
              }}
            >
              <Box sx={{ color: getStepColor(step) }}>
                {getStepIcon(step)}
              </Box>
              
              <Box flex={1}>
                <Typography variant="body2" fontWeight={step.isCompleted ? 500 : 400}>
                  {step.description}
                </Typography>
                {step.isCompleted && step.completedBy && (
                  <Typography variant="caption" color="text.secondary">
                    {step.completedBy} • {format(step.completedAt!, 'MMM d, yyyy')}
                  </Typography>
                )}
              </Box>

              {step.action && (
                <Chip
                  label={getActionLabel(step.action)}
                  size="small"
                  sx={{
                    backgroundColor: `${getStepColor(step)}20`,
                    color: getStepColor(step),
                  }}
                />
              )}
            </Box>
          ))}
        </Stack>

        {workflow.isCompleted && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {t('approval.workflow.completed')}
          </Alert>
        )}
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {t('approval.workflow.title')}
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Chip
            label={t('approval.workflow.progress', {
              current: workflow.currentStep,
              total: workflow.totalSteps,
            })}
            color={workflow.isCompleted ? 'success' : 'primary'}
            variant={workflow.isCompleted ? 'filled' : 'outlined'}
          />
          
          {!workflow.isCompleted && workflow.nextApprovers.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              {t('approval.workflow.nextApprovers')}: {workflow.nextApprovers.join(', ')}
            </Typography>
          )}
        </Stack>
      </Box>

      <Stepper
        activeStep={workflow.currentStep - 1}
        orientation="vertical"
        connector={<CustomStepConnector />}
      >
        {workflow.steps.map((step) => {
          const isExpanded = expandedStep === step.stepNumber;
          const canApprove = canUserApprove(step);

          return (
            <Step key={step.stepNumber} completed={step.isCompleted}>
              <StepLabel
                StepIconComponent={() => (
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      backgroundColor: getStepColor(step),
                      fontSize: '0.875rem',
                    }}
                  >
                    {getStepIcon(step)}
                  </Avatar>
                )}
                onClick={() => handleStepClick(step.stepNumber)}
                sx={{ cursor: 'pointer' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2">
                    {step.description}
                  </Typography>
                  
                  <IconButton size="small">
                    {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
                  </IconButton>
                </Box>
                
                {step.isCompleted && (
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {step.completedBy}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      •
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {format(step.completedAt!, 'MMM d, yyyy h:mm a')}
                    </Typography>
                    {step.action && (
                      <Chip
                        label={getActionLabel(step.action)}
                        size="small"
                        sx={{
                          height: 20,
                          backgroundColor: `${getStepColor(step)}20`,
                          color: getStepColor(step),
                        }}
                      />
                    )}
                  </Stack>
                )}
              </StepLabel>
              
              <StepContent>
                <Collapse in={isExpanded}>
                  <Box sx={{ mt: 2, mb: 2 }}>
                    {step.comments && (
                      <Alert
                        severity={
                          step.action === 'reject' ? 'error' :
                          step.action === 'request_changes' ? 'warning' :
                          'info'
                        }
                        sx={{ mb: 2 }}
                      >
                        <Typography variant="body2">{step.comments}</Typography>
                      </Alert>
                    )}

                    {step.delegatedTo && (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        {t('approval.workflow.delegatedTo', { name: step.delegatedTo })}
                      </Alert>
                    )}

                    <Typography variant="body2" color="text.secondary" paragraph>
                      {t('approval.workflow.requiredRoles')}: {step.requiredRole.join(', ')}
                    </Typography>

                    {canApprove && onApprovalAction && (
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={<ApprovedIcon />}
                          onClick={() => onApprovalAction('approve')}
                        >
                          {t('approval.actions.approve')}
                        </Button>
                        
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<RejectedIcon />}
                          onClick={() => onApprovalAction('reject')}
                        >
                          {t('approval.actions.reject')}
                        </Button>
                        
                        <Button
                          variant="outlined"
                          color="warning"
                          size="small"
                          startIcon={<RequestChangesIcon />}
                          onClick={() => onApprovalAction('request_changes')}
                        >
                          {t('approval.actions.request_changes')}
                        </Button>
                        
                        <Button
                          variant="outlined"
                          color="info"
                          size="small"
                          startIcon={<DelegatedIcon />}
                          onClick={() => onApprovalAction('delegate')}
                        >
                          {t('approval.actions.delegate')}
                        </Button>
                      </Stack>
                    )}
                  </Box>
                </Collapse>
              </StepContent>
            </Step>
          );
        })}
      </Stepper>

      {workflow.isCompleted && (
        <Alert severity="success" sx={{ mt: 3 }} icon={<ApprovedIcon />}>
          <Typography variant="subtitle2">{t('approval.workflow.completed')}</Typography>
          <Typography variant="body2">{t('approval.workflow.completedDescription')}</Typography>
        </Alert>
      )}

      {!workflow.isCompleted && !workflow.canProceed && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="subtitle2">{t('approval.workflow.blocked')}</Typography>
          <Typography variant="body2">{t('approval.workflow.blockedDescription')}</Typography>
        </Alert>
      )}
    </Paper>
  );
};

export default ApprovalWorkflow;