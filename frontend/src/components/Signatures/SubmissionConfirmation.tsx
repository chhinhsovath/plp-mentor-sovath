import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  LinearProgress,
  useTheme,
  IconButton,
  Fade,
  Chip,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Send as SendIcon,
  Cancel as CancelIcon,
  CheckCircleOutline as SuccessIcon,
  ContentCopy as CopyIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  GetApp as DownloadIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { ObservationSession } from '../../types/observation';

interface SubmissionConfirmationProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  session: ObservationSession;
  validationErrors?: string[];
  warnings?: string[];
}

interface SubmissionResult {
  success: boolean;
  sessionId?: string;
  referenceNumber?: string;
  submittedAt?: Date;
  nextSteps?: string[];
  error?: string;
}

const SubmissionConfirmation: React.FC<SubmissionConfirmationProps> = ({
  open,
  onClose,
  onConfirm,
  session,
  validationErrors = [],
  warnings = [],
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const submissionSteps = [
    t('submission.steps.validate'),
    t('submission.steps.prepare'),
    t('submission.steps.submit'),
    t('submission.steps.complete'),
  ];

  useEffect(() => {
    if (isSubmitting) {
      // Simulate progress
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      return () => clearInterval(timer);
    }
  }, [isSubmitting]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setActiveStep(0);
    setProgress(0);

    try {
      // Step 1: Validate
      setActiveStep(0);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Step 2: Prepare
      setActiveStep(1);
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Step 3: Submit
      setActiveStep(2);
      await onConfirm();

      // Step 4: Complete
      setActiveStep(3);
      const result: SubmissionResult = {
        success: true,
        sessionId: session.id,
        referenceNumber: `OBS-${Date.now().toString().slice(-8)}`,
        submittedAt: new Date(),
        nextSteps: [
          t('submission.nextSteps.review'),
          t('submission.nextSteps.feedback'),
          t('submission.nextSteps.followUp'),
        ],
      };
      
      setSubmissionResult(result);
      
      // Could add confetti animation here if library is added
    } catch (error) {
      setSubmissionResult({
        success: false,
        error: error instanceof Error ? error.message : t('submission.error.generic'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyReference = () => {
    if (submissionResult?.referenceNumber) {
      navigator.clipboard.writeText(submissionResult.referenceNumber);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReceipt = () => {
    // Generate a receipt PDF or download confirmation
    console.log('Download receipt');
  };

  const hasErrors = validationErrors.length > 0;
  const hasWarnings = warnings.length > 0;

  if (submissionResult) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {submissionResult.success ? (
            <Stack direction="row" spacing={2} alignItems="center">
              <SuccessIcon color="success" sx={{ fontSize: 32 }} />
              <Typography variant="h6">{t('submission.success.title')}</Typography>
            </Stack>
          ) : (
            <Stack direction="row" spacing={2} alignItems="center">
              <ErrorIcon color="error" sx={{ fontSize: 32 }} />
              <Typography variant="h6">{t('submission.error.title')}</Typography>
            </Stack>
          )}
        </DialogTitle>
        
        <DialogContent>
          {submissionResult.success ? (
            <Fade in timeout={500}>
              <Stack spacing={3}>
                <Alert severity="success" icon={<CheckIcon />}>
                  {t('submission.success.message')}
                </Alert>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('submission.success.details')}
                  </Typography>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        {t('submission.success.referenceNumber')}:
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" fontWeight="bold">
                          {submissionResult.referenceNumber}
                        </Typography>
                        <IconButton size="small" onClick={handleCopyReference}>
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        {t('submission.success.submittedAt')}:
                      </Typography>
                      <Typography variant="body2">
                        {submissionResult.submittedAt?.toLocaleString()}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        {t('submission.success.teacher')}:
                      </Typography>
                      <Typography variant="body2">
                        {session.teacherName}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>

                {submissionResult.nextSteps && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      {t('submission.success.nextSteps')}:
                    </Typography>
                    <List dense>
                      {submissionResult.nextSteps.map((step, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <CheckIcon color="primary" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={step} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Stack>
            </Fade>
          ) : (
            <Alert severity="error">
              <Typography variant="body2">
                {submissionResult.error || t('submission.error.generic')}
              </Typography>
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          {submissionResult.success && (
            <>
              <Button startIcon={<PrintIcon />} onClick={handlePrint}>
                {t('submission.actions.print')}
              </Button>
              <Button startIcon={<DownloadIcon />} onClick={handleDownloadReceipt}>
                {t('submission.actions.download')}
              </Button>
            </>
          )}
          <Button onClick={onClose} variant="contained">
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={!isSubmitting ? onClose : undefined} maxWidth="sm" fullWidth>
      <DialogTitle>{t('submission.confirm.title')}</DialogTitle>
      
      <DialogContent>
        <Stack spacing={3}>
          {!isSubmitting ? (
            <>
              <Typography variant="body2" color="text.secondary">
                {t('submission.confirm.description')}
              </Typography>

              {hasErrors && (
                <Alert severity="error" icon={<ErrorIcon />}>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('submission.confirm.errors')}
                  </Typography>
                  <List dense>
                    {validationErrors.map((error, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={error} />
                      </ListItem>
                    ))}
                  </List>
                </Alert>
              )}

              {hasWarnings && (
                <Alert severity="warning" icon={<WarningIcon />}>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('submission.confirm.warnings')}
                  </Typography>
                  <List dense>
                    {warnings.map((warning, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={warning} />
                      </ListItem>
                    ))}
                  </List>
                </Alert>
              )}

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  {t('submission.confirm.summary')}:
                </Typography>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      {t('submission.confirm.teacher')}:
                    </Typography>
                    <Typography variant="body2">{session.teacherName}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      {t('submission.confirm.observer')}:
                    </Typography>
                    <Typography variant="body2">{session.observerName}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      {t('submission.confirm.date')}:
                    </Typography>
                    <Typography variant="body2">{session.observationDate}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      {t('submission.confirm.status')}:
                    </Typography>
                    <Chip
                      label={t(`status.${session.status}`)}
                      size="small"
                      color={session.status === 'completed' ? 'success' : 'default'}
                    />
                  </Stack>
                </Stack>
              </Box>

              {!hasErrors && (
                <Alert severity="info">
                  {t('submission.confirm.readyMessage')}
                </Alert>
              )}
            </>
          ) : (
            <>
              <Stepper activeStep={activeStep} alternativeLabel>
                {submissionSteps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              <Box sx={{ mt: 3, mb: 2 }}>
                <LinearProgress variant="determinate" value={progress} />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  {t('submission.progress', { step: submissionSteps[activeStep] })}
                </Typography>
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          disabled={isSubmitting}
          startIcon={<CancelIcon />}
        >
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={hasErrors || isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : <SendIcon />}
        >
          {isSubmitting ? t('submission.submitting') : t('submission.confirm.submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubmissionConfirmation;