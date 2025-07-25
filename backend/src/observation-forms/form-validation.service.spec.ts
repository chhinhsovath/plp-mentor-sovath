import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FormValidationService } from './form-validation.service';
import { ObservationForm } from '../entities/observation-form.entity';
import { ObservationSession } from '../entities/observation-session.entity';
import { LessonPhase } from '../entities/lesson-phase.entity';
import { Indicator, RubricType } from '../entities/indicator.entity';
import { CreateObservationFormDto } from './dto/create-observation-form.dto';
import { UpdateObservationFormDto } from './dto/update-observation-form.dto';

describe('FormValidationService', () => {
  let service: FormValidationService;
  let observationFormRepository: Repository<ObservationForm>;
  let observationSessionRepository: Repository<ObservationSession>;
  let lessonPhaseRepository: Repository<LessonPhase>;
  let indicatorRepository: Repository<Indicator>;

  const validCreateFormDto: CreateObservationFormDto = {
    formCode: 'G1-KH',
    title: 'Grade 1 Khmer Form',
    subject: 'Khmer',
    gradeRange: '1',
    lessonPhases: [
      {
        title: 'Introduction Phase',
        sectionOrder: 1,
        indicators: [
          {
            indicatorNumber: '1.1',
            indicatorText: 'Teacher introduces lesson objectives clearly',
            maxScore: 3,
            rubricType: 'scale',
            scales: [
              { scaleLabel: '1', scaleDescription: 'Poor' },
              { scaleLabel: '2', scaleDescription: 'Good' },
              { scaleLabel: '3', scaleDescription: 'Excellent' },
            ],
          },
        ],
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormValidationService,
        {
          provide: getRepositoryToken(ObservationForm),
          useValue: {
            findOne: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ObservationSession),
          useValue: {
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(LessonPhase),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Indicator),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<FormValidationService>(FormValidationService);
    observationFormRepository = module.get<Repository<ObservationForm>>(
      getRepositoryToken(ObservationForm),
    );
    observationSessionRepository = module.get<Repository<ObservationSession>>(
      getRepositoryToken(ObservationSession),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateCreateForm', () => {
    it('should validate a valid form DTO', async () => {
      jest.spyOn(observationFormRepository, 'findOne').mockResolvedValue(null);

      const result = await service.validateCreateForm(validCreateFormDto);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid form code format', async () => {
      const invalidDto = { ...validCreateFormDto, formCode: 'INVALID' };
      jest.spyOn(observationFormRepository, 'findOne').mockResolvedValue(null);

      const result = await service.validateCreateForm(invalidDto);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'formCode',
          code: 'INVALID_FORM_CODE_FORMAT',
        }),
      );
    });

    it('should reject duplicate form code', async () => {
      jest.spyOn(observationFormRepository, 'findOne').mockResolvedValue({
        id: 'existing-id',
        formCode: 'G1-KH',
      } as ObservationForm);

      const result = await service.validateCreateForm(validCreateFormDto);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'formCode',
          code: 'DUPLICATE_FORM_CODE',
        }),
      );
    });

    it('should warn about non-standard subject', async () => {
      const nonStandardDto = { ...validCreateFormDto, subject: 'Custom Subject' };
      jest.spyOn(observationFormRepository, 'findOne').mockResolvedValue(null);

      const result = await service.validateCreateForm(nonStandardDto);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: 'subject',
          code: 'NON_STANDARD_SUBJECT',
        }),
      );
    });

    it('should reject invalid grade range', async () => {
      const invalidGradeDto = { ...validCreateFormDto, gradeRange: '7' };
      jest.spyOn(observationFormRepository, 'findOne').mockResolvedValue(null);

      const result = await service.validateCreateForm(invalidGradeDto);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'gradeRange',
          code: 'INVALID_GRADE_RANGE',
        }),
      );
    });

    it('should reject form without phases or domains', async () => {
      const emptyDto = {
        ...validCreateFormDto,
        lessonPhases: [],
        competencyDomains: [],
      };
      jest.spyOn(observationFormRepository, 'findOne').mockResolvedValue(null);

      const result = await service.validateCreateForm(emptyDto);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'structure',
          code: 'NO_CONTENT_STRUCTURE',
        }),
      );
    });

    it('should warn about too many indicators', async () => {
      const manyIndicatorsDto = {
        ...validCreateFormDto,
        lessonPhases: [
          {
            title: 'Phase 1',
            sectionOrder: 1,
            indicators: Array(35).fill({
              indicatorNumber: '1.1',
              indicatorText: 'Test indicator',
              maxScore: 1,
              rubricType: 'checkbox',
            }),
          },
        ],
      };
      jest.spyOn(observationFormRepository, 'findOne').mockResolvedValue(null);

      const result = await service.validateCreateForm(manyIndicatorsDto);

      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: 'indicators',
          code: 'TOO_MANY_INDICATORS',
        }),
      );
    });
  });

  describe('validateIndicator', () => {
    it('should validate a valid scale indicator', async () => {
      const indicator = {
        indicatorNumber: '1.1',
        indicatorText: 'This is a valid indicator text',
        rubricType: RubricType.SCALE,
        maxScore: 3,
        scales: [
          { scaleLabel: '1', scaleDescription: 'Poor' },
          { scaleLabel: '2', scaleDescription: 'Good' },
          { scaleLabel: '3', scaleDescription: 'Excellent' },
        ],
      };

      const result = await service.validateIndicator(indicator);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a valid checkbox indicator', async () => {
      const indicator = {
        indicatorNumber: '2.1',
        indicatorText: 'This is a checkbox indicator',
        rubricType: RubricType.CHECKBOX,
        maxScore: 1,
      };

      const result = await service.validateIndicator(indicator);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid indicator number format', async () => {
      const indicator = {
        indicatorNumber: 'ABC',
        indicatorText: 'Test indicator',
        rubricType: RubricType.SCALE,
        maxScore: 3,
      };

      const result = await service.validateIndicator(indicator);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'indicatorNumber',
          code: 'INVALID_INDICATOR_NUMBER',
        }),
      );
    });

    it('should reject checkbox indicator with maxScore not 1', async () => {
      const indicator = {
        indicatorNumber: '1.1',
        indicatorText: 'Test checkbox',
        rubricType: RubricType.CHECKBOX,
        maxScore: 3,
      };

      const result = await service.validateIndicator(indicator);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'maxScore',
          code: 'INVALID_CHECKBOX_SCORE',
        }),
      );
    });

    it('should reject scale indicator without scales', async () => {
      const indicator = {
        indicatorNumber: '1.1',
        indicatorText: 'Test scale indicator',
        rubricType: RubricType.SCALE,
        maxScore: 3,
      };

      const result = await service.validateIndicator(indicator);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'scales',
          code: 'MISSING_SCALES',
        }),
      );
    });

    it('should reject scale count mismatch', async () => {
      const indicator = {
        indicatorNumber: '1.1',
        indicatorText: 'Test indicator',
        rubricType: RubricType.SCALE,
        maxScore: 3,
        scales: [
          { scaleLabel: '1', scaleDescription: 'Poor' },
          { scaleLabel: '2', scaleDescription: 'Good' },
        ],
      };

      const result = await service.validateIndicator(indicator);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'scales',
          code: 'SCALE_COUNT_MISMATCH',
        }),
      );
    });

    it('should reject duplicate scale labels', async () => {
      const indicator = {
        indicatorNumber: '1.1',
        indicatorText: 'Test indicator',
        rubricType: RubricType.SCALE,
        maxScore: 2,
        scales: [
          { scaleLabel: '1', scaleDescription: 'Poor' },
          { scaleLabel: '1', scaleDescription: 'Good' },
        ],
      };

      const result = await service.validateIndicator(indicator);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'scales',
          code: 'DUPLICATE_SCALE_LABELS',
        }),
      );
    });

    it('should reject too short indicator text', async () => {
      const indicator = {
        indicatorNumber: '1.1',
        indicatorText: 'Short',
        rubricType: RubricType.CHECKBOX,
        maxScore: 1,
      };

      const result = await service.validateIndicator(indicator);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'indicatorText',
          code: 'INDICATOR_TEXT_TOO_SHORT',
        }),
      );
    });
  });

  describe('validateUpdateForm', () => {
    it('should validate valid update', async () => {
      const updateDto: UpdateObservationFormDto = {
        title: 'Updated Title',
      };

      jest.spyOn(observationFormRepository, 'findOne')
        .mockResolvedValueOnce({ id: 'form-id', formCode: 'G1-KH' } as ObservationForm);
      jest.spyOn(observationSessionRepository, 'count').mockResolvedValue(0);

      const result = await service.validateUpdateForm('form-id', updateDto);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject update for non-existent form', async () => {
      jest.spyOn(observationFormRepository, 'findOne').mockResolvedValue(null);

      const result = await service.validateUpdateForm('invalid-id', {});

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'id',
          code: 'FORM_NOT_FOUND',
        }),
      );
    });

    it('should warn when updating form in use', async () => {
      jest.spyOn(observationFormRepository, 'findOne')
        .mockResolvedValue({ id: 'form-id' } as ObservationForm);
      jest.spyOn(observationSessionRepository, 'count').mockResolvedValue(5);

      const result = await service.validateUpdateForm('form-id', { title: 'New Title' });

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: 'form',
          code: 'FORM_IN_USE',
        }),
      );
    });
  });

  describe('validateFormDeletion', () => {
    it('should allow deletion of unused form', async () => {
      jest.spyOn(observationFormRepository, 'findOne')
        .mockResolvedValue({ id: 'form-id' } as ObservationForm);
      jest.spyOn(observationSessionRepository, 'count').mockResolvedValue(0);

      const result = await service.validateFormDeletion('form-id');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject deletion of form in use', async () => {
      jest.spyOn(observationFormRepository, 'findOne')
        .mockResolvedValue({ id: 'form-id' } as ObservationForm);
      jest.spyOn(observationSessionRepository, 'count').mockResolvedValue(1);

      const result = await service.validateFormDeletion('form-id');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'form',
          code: 'FORM_IN_USE',
        }),
      );
    });
  });

  describe('validateFormForSession', () => {
    it('should validate form ready for session', async () => {
      const completeForm = {
        id: 'form-id',
        lessonPhases: [
          {
            id: 'phase-1',
            title: 'Phase 1',
            indicators: [
              {
                id: 'indicator-1',
                indicatorNumber: '1.1',
                rubricType: RubricType.SCALE,
                isActive: true,
                scales: [
                  { scaleLabel: '1', scaleDescription: 'Poor' },
                  { scaleLabel: '2', scaleDescription: 'Good' },
                  { scaleLabel: '3', scaleDescription: 'Excellent' },
                ],
              },
            ],
          },
        ],
      };

      jest.spyOn(observationFormRepository, 'findOne')
        .mockResolvedValue(completeForm as any);

      const result = await service.validateFormForSession('form-id');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject form with no indicators', async () => {
      const emptyForm = {
        id: 'form-id',
        lessonPhases: [],
      };

      jest.spyOn(observationFormRepository, 'findOne')
        .mockResolvedValue(emptyForm as any);

      const result = await service.validateFormForSession('form-id');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'form',
          code: 'NO_INDICATORS',
        }),
      );
    });

    it('should warn about inactive indicators', async () => {
      const formWithInactiveIndicator = {
        id: 'form-id',
        lessonPhases: [
          {
            id: 'phase-1',
            title: 'Phase 1',
            indicators: [
              {
                id: 'indicator-1',
                indicatorNumber: '1.1',
                rubricType: RubricType.CHECKBOX,
                isActive: false,
              },
            ],
          },
        ],
      };

      jest.spyOn(observationFormRepository, 'findOne')
        .mockResolvedValue(formWithInactiveIndicator as any);

      const result = await service.validateFormForSession('form-id');

      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: 'indicator.indicator-1',
          code: 'INACTIVE_INDICATOR',
        }),
      );
    });
  });
});