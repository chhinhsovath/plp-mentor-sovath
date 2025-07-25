import React, { useState, useEffect } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  MobileStepper,
  useTheme,
  useMediaQuery,
  StepButton,
  StepContent,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  KeyboardArrowLeft as KeyboardArrowLeftIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
  Save as SaveIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  ObservationForm as ObservationFormType,
  ObservationFormData,
  IndicatorResponse,
  Reflection,
  FormValidationError,
} from '../../types/observation';
import FormMetadata from './FormMetadata';
import IndicatorTable from './IndicatorTable';
import ReflectionBox from './ReflectionBox';
import FormActions from './FormActions';
import { validateObservationForm } from '../../utils/formValidation';
import { isTouchDevice, provideTouchFeedback } from '../../utils/deviceDetection';

interface ObservationFormProps {
  form: ObservationFormType;
  initialData?: Partial<ObservationFormData>;
  onSubmit: (data: ObservationFormData) => Promise<void>;
  onSaveDraft?: (data: ObservationFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const ObservationForm: React.FC<ObservationFormProps> = ({
  form,
  initialData,
  onSubmit,
  onSaveDraft,
  onCancel,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const [validationErrors, setValidationErrors] = useState<FormValidationError[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Define form steps
  const steps = [
    t('observation.steps.basicInfo'),
    ...form.lessonPhases.map((phase) => phase.name),
    t('observation.steps.reflections'),
    t('observation.steps.review'),
  ];

  // Initialize formik
  const formik = useFormik<ObservationFormData>({
    initialValues: {
      formId: form.id,
      teacherId: initialData?.teacherId || '',
      schoolId: initialData?.schoolId || '',
      gradeLevel: initialData?.gradeLevel || form.gradeLevel,
      subject: initialData?.subject || form.subject,
      numberOfStudents: initialData?.numberOfStudents || 0,
      numberOfFemaleStudents: initialData?.numberOfFemaleStudents || 0,
      observationDate: initialData?.observationDate || new Date().toISOString().split('T')[0],
      startTime: initialData?.startTime || '',
      endTime: initialData?.endTime || '',
      responses: initialData?.responses || [],
      reflections: initialData?.reflections || [
        { type: 'strengths', content: '' },
        { type: 'areas_for_improvement', content: '' },
        { type: 'next_steps', content: '' },
      ],
    },
    validationSchema: Yup.object({
      teacherId: Yup.string().required(t('validation.required')),
      schoolId: Yup.string().required(t('validation.required')),
      numberOfStudents: Yup.number()
        .min(1, t('validation.minStudents'))
        .required(t('validation.required')),
      numberOfFemaleStudents: Yup.number()
        .min(0, t('validation.minValue'))
        .max(Yup.ref('numberOfStudents'), t('validation.femaleStudentsMax'))
        .required(t('validation.required')),
      observationDate: Yup.date().required(t('validation.required')),
      startTime: Yup.string().required(t('validation.required')),
      endTime: Yup.string().required(t('validation.required')),
    }),
    onSubmit: async (values) => {
      // Validate the entire form
      const validation = validateObservationForm(values, form);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        // Find the first step with errors
        const errorStep = findStepWithError(validation.errors);
        setActiveStep(errorStep);
        return;
      }

      setValidationErrors([]);
      await onSubmit(values);
    },
  });

  // Auto-save draft every 30 seconds if form is dirty
  useEffect(() => {
    if (!onSaveDraft || !formik.dirty) return;

    const interval = setInterval(async () => {
      if (formik.dirty && !isSaving) {
        setIsSaving(true);
        try {
          await onSaveDraft(formik.values);
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setIsSaving(false);
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [formik.dirty, formik.values, onSaveDraft, isSaving]);

  const handleNext = () => {
    // Validate current step before proceeding
    if (activeStep === 0) {
      // Validate basic info
      const errors = ['teacherId', 'schoolId', 'numberOfStudents', 'numberOfFemaleStudents', 'observationDate', 'startTime', 'endTime']
        .filter((field) => formik.errors[field as keyof typeof formik.errors]);
      
      if (errors.length > 0) {
        formik.setTouched(
          errors.reduce((acc, field) => ({ ...acc, [field]: true }), {})
        );
        return;
      }
    }

    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleIndicatorResponse = (response: IndicatorResponse) => {
    const updatedResponses = [...formik.values.responses];
    const existingIndex = updatedResponses.findIndex(
      (r) => r.indicatorId === response.indicatorId
    );

    if (existingIndex >= 0) {
      updatedResponses[existingIndex] = response;
    } else {
      updatedResponses.push(response);
    }

    formik.setFieldValue('responses', updatedResponses);
  };

  const handleReflectionChange = (type: 'strengths' | 'areas_for_improvement' | 'next_steps', content: string) => {
    const updatedReflections = formik.values.reflections.map((r) =>
      r.type === type ? { ...r, content } : r
    );
    formik.setFieldValue('reflections', updatedReflections);
  };

  const findStepWithError = (errors: FormValidationError[]): number => {
    // Check if error is in basic info
    const basicInfoFields = ['teacherId', 'schoolId', 'numberOfStudents', 'numberOfFemaleStudents', 'observationDate', 'startTime', 'endTime'];
    if (errors.some((e) => basicInfoFields.includes(e.field))) {
      return 0;
    }

    // Check which phase has errors
    for (let i = 0; i < form.lessonPhases.length; i++) {
      const phase = form.lessonPhases[i];
      const phaseIndicatorIds = phase.indicators.map((ind) => ind.id);
      if (errors.some((e) => e.indicatorId && phaseIndicatorIds.includes(e.indicatorId))) {
        return i + 1; // +1 because step 0 is basic info
      }
    }

    // Check if error is in reflections
    if (errors.some((e) => e.field.startsWith('reflection'))) {
      return form.lessonPhases.length + 1;
    }

    return 0;
  };

  const getStepContent = () => {
    if (activeStep === 0) {
      // Basic Information
      return (
        <FormMetadata
          values={formik.values}
          errors={formik.errors}
          touched={formik.touched}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          setFieldValue={formik.setFieldValue}
        />
      );
    } else if (activeStep <= form.lessonPhases.length) {
      // Lesson Phase Indicators
      const phaseIndex = activeStep - 1;
      const phase = form.lessonPhases[phaseIndex];
      return (
        <IndicatorTable
          phase={phase}
          responses={formik.values.responses}
          onResponseChange={handleIndicatorResponse}
          errors={validationErrors.filter((e) => 
            e.indicatorId && phase.indicators.some((ind) => ind.id === e.indicatorId)
          )}
        />
      );
    } else if (activeStep === form.lessonPhases.length + 1) {
      // Reflections
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <ReflectionBox
            type="strengths"
            value={formik.values.reflections.find((r) => r.type === 'strengths')?.content || ''}
            onChange={(content) => handleReflectionChange('strengths', content)}
            error={validationErrors.find((e) => e.field === 'reflection_strengths')?.message}
          />
          <ReflectionBox
            type="areas_for_improvement"
            value={formik.values.reflections.find((r) => r.type === 'areas_for_improvement')?.content || ''}
            onChange={(content) => handleReflectionChange('areas_for_improvement', content)}
            error={validationErrors.find((e) => e.field === 'reflection_areas_for_improvement')?.message}
          />
          <ReflectionBox
            type="next_steps"
            value={formik.values.reflections.find((r) => r.type === 'next_steps')?.content || ''}
            onChange={(content) => handleReflectionChange('next_steps', content)}
            error={validationErrors.find((e) => e.field === 'reflection_next_steps')?.message}
          />
        </Box>
      );
    } else {
      // Review & Submit
      return (
        <Box>
          <Typography variant="h6" gutterBottom>
            {t('observation.review.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {t('observation.review.description')}
          </Typography>
          
          {validationErrors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {t('observation.review.errorsFound', { count: validationErrors.length })}
              <ul>
                {validationErrors.slice(0, 5).map((error, index) => (
                  <li key={index}>{error.message}</li>
                ))}
              </ul>
            </Alert>
          )}

          {validationErrors.length === 0 && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {t('observation.review.readyToSubmit')}
            </Alert>
          )}
        </Box>
      );
    }
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isTouch = isTouchDevice();
  
  // Handle touch feedback
  const handleTouchFeedback = () => {
    if (isTouch) {
      provideTouchFeedback();
    }
  };

  return (
    <form onSubmit={formik.handleSubmit}>
      <Paper sx={{ 
        p: isMobile ? 2 : 3,
        borderRadius: isMobile ? 2 : 3,
      }}>
        <Typography 
          variant={isMobile ? "h6" : "h5"} 
          gutterBottom
          sx={{ 
            mb: isMobile ? 2 : 3,
            fontWeight: isMobile ? 500 : 600,
          }}
        >
          {form.name}
        </Typography>
        
        {/* Desktop/Tablet Stepper */}
        {!isMobile && (
          <Stepper 
            activeStep={activeStep} 
            sx={{ mb: 4 }}
            alternativeLabel={isTablet}
          >
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        )}
        
        {/* Mobile Stepper */}
        {isMobile && (
          <Box sx={{ mb: 3 }}>
            <MobileStepper
              variant="progress"
              steps={steps.length}
              position="static"
              activeStep={activeStep}
              sx={{ 
                backgroundColor: 'transparent',
                p: 0,
                '& .MuiLinearProgress-root': {
                  width: '100%',
                  height: 6,
                  borderRadius: 3,
                },
              }}
              nextButton={
                <Button 
                  size="small" 
                  onClick={handleNext}
                  disabled={activeStep === steps.length - 1}
                  sx={{ 
                    minWidth: 'auto',
                    p: 1,
                  }}
                >
                  <KeyboardArrowRightIcon />
                </Button>
              }
              backButton={
                <Button 
                  size="small" 
                  onClick={handleBack}
                  disabled={activeStep === 0}
                  sx={{ 
                    minWidth: 'auto',
                    p: 1,
                  }}
                >
                  <KeyboardArrowLeftIcon />
                </Button>
              }
            />
            <Typography 
              variant="subtitle1" 
              align="center" 
              sx={{ 
                mt: 1,
                fontWeight: 500,
                color: 'primary.main',
              }}
            >
              {steps[activeStep]}
            </Typography>
          </Box>
        )}

        {/* Auto-save indicator */}
        {isSaving && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 2,
            p: isMobile ? 1 : 0,
            backgroundColor: isMobile ? 'rgba(0, 0, 0, 0.03)' : 'transparent',
            borderRadius: isMobile ? 1 : 0,
          }}>
            <CircularProgress size={isMobile ? 20 : 16} sx={{ mr: 1 }} />
            <Typography 
              variant={isMobile ? "body2" : "caption"} 
              color="text.secondary"
            >
              {t('observation.autoSaving')}
            </Typography>
          </Box>
        )}

        {/* Main content area */}
        <Box sx={{ 
          minHeight: isMobile ? 300 : 400,
          mb: isMobile ? 2 : 3,
        }}>
          {getStepContent()}
        </Box>

        {/* Mobile-specific action buttons */}
        {isMobile ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            mt: 3,
            pt: 2,
            borderTop: 1,
            borderColor: 'divider',
          }}>
            <Button
              variant="outlined"
              onClick={onCancel}
              sx={{ 
                minHeight: 48,
                minWidth: 100,
              }}
              onTouchStart={handleTouchFeedback}
            >
              {t('common.cancel')}
            </Button>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              {onSaveDraft && (
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => onSaveDraft(formik.values)}
                  disabled={isLoading}
                  startIcon={<SaveIcon />}
                  sx={{ 
                    minHeight: 48,
                  }}
                  onTouchStart={handleTouchFeedback}
                >
                  {t('common.saveDraft')}
                </Button>
              )}
              
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={isLoading || validationErrors.length > 0}
                  startIcon={<CheckIcon />}
                  sx={{ 
                    minHeight: 48,
                    minWidth: 120,
                  }}
                  onTouchStart={handleTouchFeedback}
                >
                  {isLoading ? t('common.submitting') : t('common.submit')}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  sx={{ 
                    minHeight: 48,
                    minWidth: 100,
                  }}
                  onTouchStart={handleTouchFeedback}
                >
                  {t('common.next')}
                </Button>
              )}
            </Box>
          </Box>
        ) : (
          <FormActions
            activeStep={activeStep}
            steps={steps}
            onBack={handleBack}
            onNext={handleNext}
            onCancel={onCancel}
            onSaveDraft={onSaveDraft ? () => onSaveDraft(formik.values) : undefined}
            isSubmitting={isLoading}
            canSubmit={activeStep === steps.length - 1 && validationErrors.length === 0}
          />
        )}
      </Paper>
    </form>
  );
};

export default ObservationForm;