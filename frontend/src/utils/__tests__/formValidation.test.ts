import { describe, it, expect } from 'vitest';
import {
  validateObservationForm,
  validateIndicatorResponse,
  calculateFormProgress,
  getIncompleteSteps,
} from '../formValidation';
import {
  ObservationFormData,
  ObservationForm,
  IndicatorResponse,
} from '../../types/observation';

const mockForm: ObservationForm = {
  id: '1',
  name: 'Test Form',
  code: 'TF-001',
  description: 'Test form description',
  gradeLevel: 'Grade 1',
  subject: 'Mathematics',
  isActive: true,
  lessonPhases: [
    {
      id: 'phase-1',
      name: 'Introduction',
      orderIndex: 1,
      indicators: [
        {
          id: 'ind-1',
          code: 'I.1',
          description: 'Indicator 1',
          descriptionKh: 'សូចនាករទី១',
          orderIndex: 1,
          phaseId: 'phase-1',
          rubrics: [
            {
              id: 'rub-1',
              level: 'excellent',
              levelValue: 4,
              description: 'Excellent',
              descriptionKh: 'ល្អប្រសើរ',
              indicatorId: 'ind-1',
            },
          ],
        },
      ],
    },
  ],
};

const validFormData: ObservationFormData = {
  formId: '1',
  teacherId: 'teacher-1',
  schoolId: 'school-1',
  gradeLevel: 'Grade 1',
  subject: 'Mathematics',
  numberOfStudents: 30,
  numberOfFemaleStudents: 15,
  observationDate: '2025-07-19',
  startTime: '08:00',
  endTime: '09:00',
  responses: [
    {
      indicatorId: 'ind-1',
      rubricId: 'rub-1',
      score: 4,
    },
  ],
  reflections: [
    {
      type: 'strengths',
      content: 'The teacher demonstrated excellent classroom management skills throughout the lesson.',
    },
    {
      type: 'areas_for_improvement',
      content: 'Consider incorporating more interactive activities to engage all students.',
    },
    {
      type: 'next_steps',
      content: 'Schedule a follow-up observation to monitor progress on student engagement strategies.',
    },
  ],
};

describe('validateObservationForm', () => {
  it('validates a complete and valid form', () => {
    const result = validateObservationForm(validFormData, mockForm);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects missing teacher ID', () => {
    const invalidData = { ...validFormData, teacherId: '' };
    const result = validateObservationForm(invalidData, mockForm);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'teacherId',
      message: 'Teacher selection is required',
    });
  });

  it('detects invalid number of students', () => {
    const invalidData = { ...validFormData, numberOfStudents: 0 };
    const result = validateObservationForm(invalidData, mockForm);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'numberOfStudents',
      message: 'Number of students must be at least 1',
    });
  });

  it('detects when female students exceed total students', () => {
    const invalidData = {
      ...validFormData,
      numberOfStudents: 20,
      numberOfFemaleStudents: 25,
    };
    const result = validateObservationForm(invalidData, mockForm);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'numberOfFemaleStudents',
      message: 'Number of female students cannot exceed total students',
    });
  });

  it('validates time logic', () => {
    const invalidData = {
      ...validFormData,
      startTime: '09:00',
      endTime: '08:00',
    };
    const result = validateObservationForm(invalidData, mockForm);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'endTime',
      message: 'End time must be after start time',
    });
  });

  it('validates minimum observation duration', () => {
    const invalidData = {
      ...validFormData,
      startTime: '08:00',
      endTime: '08:15',
    };
    const result = validateObservationForm(invalidData, mockForm);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'endTime',
      message: 'Observation duration must be at least 30 minutes',
    });
  });

  it('detects missing indicator responses', () => {
    const invalidData = {
      ...validFormData,
      responses: [],
    };
    const result = validateObservationForm(invalidData, mockForm);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'indicator',
      message: 'Rating required for indicator I.1',
      indicatorId: 'ind-1',
    });
  });

  it('validates reflection content length', () => {
    const invalidData = {
      ...validFormData,
      reflections: [
        {
          type: 'strengths' as const,
          content: 'Too short',
        },
        {
          type: 'areas_for_improvement' as const,
          content: 'Also too short',
        },
        {
          type: 'next_steps' as const,
          content: 'Short',
        },
      ],
    };
    const result = validateObservationForm(invalidData, mockForm);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.filter((e) => e.field.startsWith('reflection_'))).toHaveLength(3);
  });
});

describe('validateIndicatorResponse', () => {
  it('validates a valid response', () => {
    const response: IndicatorResponse = {
      indicatorId: 'ind-1',
      rubricId: 'rub-1',
      score: 4,
      comments: 'Good performance',
    };
    
    const error = validateIndicatorResponse(response, 'ind-1');
    expect(error).toBeNull();
  });

  it('detects missing rating', () => {
    const response: IndicatorResponse = {
      indicatorId: 'ind-1',
    };
    
    const error = validateIndicatorResponse(response, 'ind-1');
    expect(error).toBe('Please select a rating');
  });

  it('detects comments exceeding limit', () => {
    const response: IndicatorResponse = {
      indicatorId: 'ind-1',
      rubricId: 'rub-1',
      score: 4,
      comments: 'a'.repeat(501),
    };
    
    const error = validateIndicatorResponse(response, 'ind-1');
    expect(error).toBe('Comments cannot exceed 500 characters');
  });
});

describe('calculateFormProgress', () => {
  it('calculates 0% for empty form', () => {
    const emptyData: ObservationFormData = {
      formId: '1',
      teacherId: '',
      schoolId: '',
      gradeLevel: '',
      subject: '',
      numberOfStudents: 0,
      numberOfFemaleStudents: 0,
      observationDate: '',
      startTime: '',
      endTime: '',
      responses: [],
      reflections: [],
    };
    
    const progress = calculateFormProgress(emptyData, mockForm);
    expect(progress).toBe(0);
  });

  it('calculates 100% for complete form', () => {
    const progress = calculateFormProgress(validFormData, mockForm);
    expect(progress).toBe(100);
  });

  it('calculates partial progress correctly', () => {
    const partialData: ObservationFormData = {
      ...validFormData,
      responses: [], // Missing indicator responses
      reflections: [], // Missing reflections
    };
    
    const progress = calculateFormProgress(partialData, mockForm);
    expect(progress).toBeGreaterThan(0);
    expect(progress).toBeLessThan(100);
  });
});

describe('getIncompleteSteps', () => {
  it('returns empty array for complete form', () => {
    const steps = getIncompleteSteps(validFormData, mockForm);
    expect(steps).toHaveLength(0);
  });

  it('identifies incomplete basic information', () => {
    const incompleteData = {
      ...validFormData,
      teacherId: '',
      schoolId: '',
    };
    
    const steps = getIncompleteSteps(incompleteData, mockForm);
    expect(steps).toContain('Basic Information');
  });

  it('identifies incomplete phase indicators', () => {
    const incompleteData = {
      ...validFormData,
      responses: [],
    };
    
    const steps = getIncompleteSteps(incompleteData, mockForm);
    expect(steps).toContain('Introduction');
  });

  it('identifies incomplete reflections', () => {
    const incompleteData = {
      ...validFormData,
      reflections: [],
    };
    
    const steps = getIncompleteSteps(incompleteData, mockForm);
    expect(steps).toContain('Reflections');
  });
});