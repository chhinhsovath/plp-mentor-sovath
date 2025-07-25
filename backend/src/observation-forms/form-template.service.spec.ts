import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { FormTemplateService } from './form-template.service';
import { ObservationForm } from '../entities/observation-form.entity';
import { User, UserRole } from '../entities/user.entity';
import { RubricType } from '../entities/indicator.entity';

describe('FormTemplateService', () => {
  let service: FormTemplateService;
  let observationFormRepository: Repository<ObservationForm>;

  const mockObservationForm = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    formCode: 'G1-KH',
    title: 'ទម្រង់សង្កេតថ្នាក់ទី១ - ភាសាខ្មែរ',
    subject: 'Khmer',
    gradeRange: '1',
    lessonPhases: [
      {
        id: 'phase-1',
        title: 'សកម្មភាពទី១',
        sectionOrder: 1,
        indicators: [
          {
            id: 'indicator-1',
            indicatorNumber: '1.1',
            indicatorText: 'Test indicator',
            rubricType: RubricType.SCALE,
            maxScore: 3,
            isActive: true,
            scales: [
              { scaleLabel: '1', scaleDescription: 'Needs improvement' },
              { scaleLabel: '2', scaleDescription: 'Satisfactory' },
              { scaleLabel: '3', scaleDescription: 'Excellent' },
            ],
          },
        ],
      },
    ],
    competencyDomains: [],
  };

  const mockUser: Partial<User> = {
    id: 'user-123',
    username: 'teacher1',
    role: UserRole.TEACHER,
    assignedGrades: ['1', '2'],
    assignedSubjects: ['Khmer', 'Mathematics'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormTemplateService,
        {
          provide: getRepositoryToken(ObservationForm),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FormTemplateService>(FormTemplateService);
    observationFormRepository = module.get<Repository<ObservationForm>>(
      getRepositoryToken(ObservationForm),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAvailableTemplates', () => {
    it('should return templates for a specific grade', async () => {
      const templates = await service.getAvailableTemplates('1');
      
      expect(templates).toBeDefined();
      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0].gradeLevel).toBe('1');
    });

    it('should filter templates by grade and subject', async () => {
      const templates = await service.getAvailableTemplates('1', 'Khmer');
      
      expect(templates).toBeDefined();
      expect(templates.every(t => t.gradeLevel === '1' && t.subject === 'Khmer')).toBe(true);
    });

    it('should return empty array for non-existent grade', async () => {
      const templates = await service.getAvailableTemplates('99');
      
      expect(templates).toEqual([]);
    });
  });

  describe('getTemplateByCode', () => {
    it('should return template for valid code', async () => {
      const template = await service.getTemplateByCode('G1-KH');
      
      expect(template).toBeDefined();
      expect(template.formCode).toBe('G1-KH');
      expect(template.gradeLevel).toBe('1');
      expect(template.subject).toBe('Khmer');
    });

    it('should throw NotFoundException for invalid code', async () => {
      await expect(service.getTemplateByCode('INVALID')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getRecommendedForms', () => {
    it('should return forms based on teacher assigned grades and subjects', async () => {
      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockObservationForm]),
      };

      jest.spyOn(observationFormRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.getRecommendedForms(mockUser as User);

      expect(result).toEqual([mockObservationForm]);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'form.gradeRange IN (:...grades)',
        { grades: ['1', '2'] }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'form.subject IN (:...subjects)',
        { subjects: ['Khmer', 'Mathematics'] }
      );
    });

    it('should return all forms for administrator', async () => {
      const adminUser = { ...mockUser, role: UserRole.ADMINISTRATOR };
      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockObservationForm]),
      };

      jest.spyOn(observationFormRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.getRecommendedForms(adminUser as User);

      expect(result).toEqual([mockObservationForm]);
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
    });
  });

  describe('getFormMetadata', () => {
    it('should calculate form metadata correctly', async () => {
      jest.spyOn(observationFormRepository, 'findOne')
        .mockResolvedValue(mockObservationForm as any);

      const metadata = await service.getFormMetadata(mockObservationForm.id);

      expect(metadata).toEqual({
        totalIndicators: 1,
        indicatorsByPhase: [
          { phase: 'សកម្មភាពទី១', count: 1 }
        ],
        rubricTypes: [
          { type: RubricType.SCALE, count: 1 }
        ],
        estimatedCompletionTime: 2, // 1 indicator * 2 minutes
      });
    });

    it('should throw NotFoundException for non-existent form', async () => {
      jest.spyOn(observationFormRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getFormMetadata('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('generateFormPreview', () => {
    it('should generate form preview correctly', async () => {
      jest.spyOn(observationFormRepository, 'findOne')
        .mockResolvedValue(mockObservationForm as any);

      const preview = await service.generateFormPreview(mockObservationForm.id);

      expect(preview).toEqual({
        formInfo: {
          code: 'G1-KH',
          title: 'ទម្រង់សង្កេតថ្នាក់ទី១ - ភាសាខ្មែរ',
          subject: 'Khmer',
          grade: '1',
        },
        structure: [
          {
            type: 'phase',
            title: 'សកម្មភាពទី១',
            indicatorCount: 1,
            sampleIndicators: ['Test indicator'],
          },
        ],
      });
    });
  });

  describe('validateFormCompleteness', () => {
    it('should validate complete form as valid', async () => {
      jest.spyOn(observationFormRepository, 'findOne')
        .mockResolvedValue(mockObservationForm as any);

      const validation = await service.validateFormCompleteness(mockObservationForm.id);

      expect(validation).toEqual({
        isComplete: true,
        missingElements: [],
        warnings: [],
      });
    });

    it('should detect missing phases', async () => {
      const formWithNoPhases = { ...mockObservationForm, lessonPhases: [] };
      jest.spyOn(observationFormRepository, 'findOne')
        .mockResolvedValue(formWithNoPhases as any);

      const validation = await service.validateFormCompleteness(mockObservationForm.id);

      expect(validation.isComplete).toBe(false);
      expect(validation.missingElements).toContain('Form must have at least one lesson phase');
    });

    it('should detect phases without indicators', async () => {
      const formWithEmptyPhase = {
        ...mockObservationForm,
        lessonPhases: [
          { ...mockObservationForm.lessonPhases[0], indicators: [] },
        ],
      };
      jest.spyOn(observationFormRepository, 'findOne')
        .mockResolvedValue(formWithEmptyPhase as any);

      const validation = await service.validateFormCompleteness(mockObservationForm.id);

      expect(validation.isComplete).toBe(false);
      expect(validation.missingElements[0]).toContain('has no indicators');
    });

    it('should warn about too many indicators', async () => {
      const formWithManyIndicators = {
        ...mockObservationForm,
        lessonPhases: [
          {
            ...mockObservationForm.lessonPhases[0],
            indicators: Array(35).fill(mockObservationForm.lessonPhases[0].indicators[0]),
          },
        ],
      };
      jest.spyOn(observationFormRepository, 'findOne')
        .mockResolvedValue(formWithManyIndicators as any);

      const validation = await service.validateFormCompleteness(mockObservationForm.id);

      expect(validation.warnings).toContain(
        'Form has 35 indicators, which may be too many for a single observation'
      );
    });

    it('should detect missing scale definitions', async () => {
      const formWithMissingScales = {
        ...mockObservationForm,
        lessonPhases: [
          {
            ...mockObservationForm.lessonPhases[0],
            indicators: [
              {
                ...mockObservationForm.lessonPhases[0].indicators[0],
                scales: [],
              },
            ],
          },
        ],
      };
      jest.spyOn(observationFormRepository, 'findOne')
        .mockResolvedValue(formWithMissingScales as any);

      const validation = await service.validateFormCompleteness(mockObservationForm.id);

      expect(validation.isComplete).toBe(false);
      expect(validation.missingElements[0]).toContain('has no scale definitions');
    });

    it('should warn about scale count mismatch', async () => {
      const formWithScaleMismatch = {
        ...mockObservationForm,
        lessonPhases: [
          {
            ...mockObservationForm.lessonPhases[0],
            indicators: [
              {
                ...mockObservationForm.lessonPhases[0].indicators[0],
                maxScore: 3,
                scales: [
                  { scaleLabel: '1', scaleDescription: 'Poor' },
                  { scaleLabel: '2', scaleDescription: 'Good' },
                ],
              },
            ],
          },
        ],
      };
      jest.spyOn(observationFormRepository, 'findOne')
        .mockResolvedValue(formWithScaleMismatch as any);

      const validation = await service.validateFormCompleteness(mockObservationForm.id);

      expect(validation.warnings[0]).toContain('has 2 scales but maxScore is 3');
    });
  });
});