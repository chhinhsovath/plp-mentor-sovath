import {
  ObservationFormData,
  ObservationForm,
  FormValidationError,
  FormValidationResult,
  IndicatorResponse,
} from '../types/observation';

export const validateObservationForm = (
  data: ObservationFormData,
  form: ObservationForm
): FormValidationResult => {
  const errors: FormValidationError[] = [];

  // Validate basic metadata
  if (!data.teacherId) {
    errors.push({
      field: 'teacherId',
      message: 'Teacher selection is required',
    });
  }

  if (!data.schoolId) {
    errors.push({
      field: 'schoolId',
      message: 'School selection is required',
    });
  }

  if (!data.numberOfStudents || data.numberOfStudents < 1) {
    errors.push({
      field: 'numberOfStudents',
      message: 'Number of students must be at least 1',
    });
  }

  if (data.numberOfFemaleStudents < 0) {
    errors.push({
      field: 'numberOfFemaleStudents',
      message: 'Number of female students cannot be negative',
    });
  }

  if (data.numberOfFemaleStudents > data.numberOfStudents) {
    errors.push({
      field: 'numberOfFemaleStudents',
      message: 'Number of female students cannot exceed total students',
    });
  }

  if (!data.observationDate) {
    errors.push({
      field: 'observationDate',
      message: 'Observation date is required',
    });
  }

  if (!data.startTime) {
    errors.push({
      field: 'startTime',
      message: 'Start time is required',
    });
  }

  if (!data.endTime) {
    errors.push({
      field: 'endTime',
      message: 'End time is required',
    });
  }

  // Validate time logic
  if (data.startTime && data.endTime) {
    const [startHour, startMinute] = data.startTime.split(':').map(Number);
    const [endHour, endMinute] = data.endTime.split(':').map(Number);
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    if (endTotalMinutes <= startTotalMinutes) {
      errors.push({
        field: 'endTime',
        message: 'End time must be after start time',
      });
    }

    // Check minimum duration (e.g., 30 minutes)
    if (endTotalMinutes - startTotalMinutes < 30) {
      errors.push({
        field: 'endTime',
        message: 'Observation duration must be at least 30 minutes',
      });
    }
  }

  // Validate indicator responses
  const responseMap = new Map<string, IndicatorResponse>();
  data.responses.forEach((response) => {
    responseMap.set(response.indicatorId, response);
  });

  // Check that all indicators have responses
  form.lessonPhases.forEach((phase) => {
    phase.indicators.forEach((indicator) => {
      const response = responseMap.get(indicator.id);
      
      if (!response || (!response.rubricId && response.score === undefined)) {
        errors.push({
          field: 'indicator',
          message: `Rating required for indicator ${indicator.code}`,
          indicatorId: indicator.id,
        });
      }

      // Validate score is within valid range
      if (response && response.score !== undefined) {
        const validScores = indicator.rubrics.map((r) => r.levelValue);
        if (!validScores.includes(response.score)) {
          errors.push({
            field: 'indicator',
            message: `Invalid score for indicator ${indicator.code}`,
            indicatorId: indicator.id,
          });
        }
      }
    });
  });

  // Validate reflections
  const reflectionTypes = ['strengths', 'areas_for_improvement', 'next_steps'] as const;
  reflectionTypes.forEach((type) => {
    const reflection = data.reflections.find((r) => r.type === type);
    
    if (!reflection || !reflection.content || reflection.content.trim().length < 50) {
      errors.push({
        field: `reflection_${type}`,
        message: `${type.replace(/_/g, ' ')} reflection must be at least 50 characters`,
      });
    }

    if (reflection && reflection.content.length > 1000) {
      errors.push({
        field: `reflection_${type}`,
        message: `${type.replace(/_/g, ' ')} reflection cannot exceed 1000 characters`,
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateIndicatorResponse = (
  response: IndicatorResponse,
  indicatorId: string
): string | null => {
  if (!response.rubricId && response.score === undefined) {
    return 'Please select a rating';
  }

  if (response.comments && response.comments.length > 500) {
    return 'Comments cannot exceed 500 characters';
  }

  if (response.evidence && response.evidence.length > 500) {
    return 'Evidence cannot exceed 500 characters';
  }

  return null;
};

export const calculateFormProgress = (
  data: ObservationFormData,
  form: ObservationForm
): number => {
  let completedItems = 0;
  let totalItems = 0;

  // Basic metadata fields (7 required fields)
  const metadataFields = [
    'teacherId',
    'schoolId',
    'numberOfStudents',
    'numberOfFemaleStudents',
    'observationDate',
    'startTime',
    'endTime',
  ];
  
  totalItems += metadataFields.length;
  metadataFields.forEach((field) => {
    if (data[field as keyof ObservationFormData]) {
      completedItems++;
    }
  });

  // Indicator responses
  const totalIndicators = form.lessonPhases.reduce(
    (sum, phase) => sum + phase.indicators.length,
    0
  );
  totalItems += totalIndicators;

  const responseMap = new Map<string, IndicatorResponse>();
  data.responses.forEach((response) => {
    responseMap.set(response.indicatorId, response);
  });

  form.lessonPhases.forEach((phase) => {
    phase.indicators.forEach((indicator) => {
      const response = responseMap.get(indicator.id);
      if (response && (response.rubricId || response.score !== undefined)) {
        completedItems++;
      }
    });
  });

  // Reflections (3 required)
  totalItems += 3;
  const reflectionTypes = ['strengths', 'areas_for_improvement', 'next_steps'] as const;
  reflectionTypes.forEach((type) => {
    const reflection = data.reflections.find((r) => r.type === type);
    if (reflection && reflection.content && reflection.content.trim().length >= 50) {
      completedItems++;
    }
  });

  return Math.round((completedItems / totalItems) * 100);
};

export const getIncompleteSteps = (
  data: ObservationFormData,
  form: ObservationForm
): string[] => {
  const incompleteSteps: string[] = [];
  const validation = validateObservationForm(data, form);

  // Check basic info
  const hasBasicInfoErrors = validation.errors.some((e) =>
    ['teacherId', 'schoolId', 'numberOfStudents', 'numberOfFemaleStudents', 'observationDate', 'startTime', 'endTime'].includes(
      e.field
    )
  );
  if (hasBasicInfoErrors) {
    incompleteSteps.push('Basic Information');
  }

  // Check each phase
  form.lessonPhases.forEach((phase) => {
    const phaseHasErrors = validation.errors.some(
      (e) =>
        e.indicatorId &&
        phase.indicators.some((ind) => ind.id === e.indicatorId)
    );
    if (phaseHasErrors) {
      incompleteSteps.push(phase.name);
    }
  });

  // Check reflections
  const hasReflectionErrors = validation.errors.some((e) =>
    e.field.startsWith('reflection_')
  );
  if (hasReflectionErrors) {
    incompleteSteps.push('Reflections');
  }

  return incompleteSteps;
};