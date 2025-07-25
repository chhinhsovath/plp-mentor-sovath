import React from 'react';
import { Box, Button, Stack } from '@mui/material';
import {
  NavigateBefore as BackIcon,
  NavigateNext as NextIcon,
  Save as SaveIcon,
  Send as SubmitIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface FormActionsProps {
  activeStep: number;
  steps: string[];
  onBack: () => void;
  onNext: () => void;
  onCancel: () => void;
  onSaveDraft?: () => void;
  isSubmitting?: boolean;
  canSubmit?: boolean;
}

const FormActions: React.FC<FormActionsProps> = ({
  activeStep,
  steps,
  onBack,
  onNext,
  onCancel,
  onSaveDraft,
  isSubmitting = false,
  canSubmit = false,
}) => {
  const { t } = useTranslation();
  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === steps.length - 1;

  return (
    <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
      <Stack
        direction="row"
        spacing={2}
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
      >
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            onClick={onCancel}
            startIcon={<CancelIcon />}
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </Button>
          
          {onSaveDraft && (
            <Button
              variant="outlined"
              onClick={onSaveDraft}
              startIcon={<SaveIcon />}
              disabled={isSubmitting}
            >
              {t('observation.actions.saveDraft')}
            </Button>
          )}
        </Stack>

        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            onClick={onBack}
            startIcon={<BackIcon />}
            disabled={isFirstStep || isSubmitting}
          >
            {t('common.back')}
          </Button>

          {!isLastStep && (
            <Button
              variant="contained"
              onClick={onNext}
              endIcon={<NextIcon />}
              disabled={isSubmitting}
            >
              {t('common.next')}
            </Button>
          )}

          {isLastStep && (
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<SubmitIcon />}
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? t('common.submitting') : t('observation.actions.submit')}
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );
};

export default FormActions;