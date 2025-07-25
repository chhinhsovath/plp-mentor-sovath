import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ObservationFormsService } from './observation-forms.service';
import { ObservationForm } from '../entities/observation-form.entity';
import { LessonPhase } from '../entities/lesson-phase.entity';
import { CompetencyDomain } from '../entities/competency-domain.entity';
import { Indicator, RubricType } from '../entities/indicator.entity';
import { IndicatorScale } from '../entities/indicator-scale.entity';

describe('ObservationFormsService', () => {
  let service: ObservationFormsService;
  let observationFormRepository: Repository<ObservationForm>;
  let lessonPhaseRepository: Repository<LessonPhase>;
  let competencyDomainRepository: Repository<CompetencyDomain>;
  let indicatorRepository: Repository<Indicator>;
  let indicatorScaleRepository: Repository<IndicatorScale>;

  const mockObservationForm = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    formCode: 'G1-KH',
    title: 'ទម្រង់សង្កេតថ្នាក់ទី១ - ភាសាខ្មែរ',
    subject: 'Khmer',
    gradeRange: '1',
    createdAt: new Date(),
    lessonPhases: [],
    competencyDomains: [],
  };

  const mockCreateFormDto = {
    formCode: 'G2-KH',
    title: 'ទម្រង់សង្កេតថ្នាក់ទី២ - ភាសាខ្មែរ',
    subject: 'Khmer',
    gradeRange: '2',
    lessonPhases: [
      {
        title: 'សកម្មភាព១: ការណែនាំមេរៀន',
        sectionOrder: 1,
        indicators: [
          {
            indicatorNumber: '១.១',
            indicatorText: 'គ្រូណែនាំផែនការបង្រៀនដល់សិស្សយ៉ាងច្បាស់',
            maxScore: 3,
            rubricType: 'scale' as const,
            scales: [
              {
                scaleLabel: '១',
                scaleDescription: 'ត្រូវការកែលម្អ',
              },
              {
                scaleLabel: '២',
                scaleDescription: 'ល្អបង្គួរ',
              },
              {
                scaleLabel: '៣',
                scaleDescription: 'ល្អឥតខ្ចោះ',
              },
            ],
          },
        ],
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ObservationFormsService,
        {
          provide: getRepositoryToken(ObservationForm),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(LessonPhase),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CompetencyDomain),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Indicator),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(IndicatorScale),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ObservationFormsService>(ObservationFormsService);
    observationFormRepository = module.get<Repository<ObservationForm>>(
      getRepositoryToken(ObservationForm),
    );
    lessonPhaseRepository = module.get<Repository<LessonPhase>>(getRepositoryToken(LessonPhase));
    competencyDomainRepository = module.get<Repository<CompetencyDomain>>(
      getRepositoryToken(CompetencyDomain),
    );
    indicatorRepository = module.get<Repository<Indicator>>(getRepositoryToken(Indicator));
    indicatorScaleRepository = module.get<Repository<IndicatorScale>>(
      getRepositoryToken(IndicatorScale),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new observation form successfully', async () => {
      jest.spyOn(observationFormRepository, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(observationFormRepository, 'create')
        .mockReturnValue(mockObservationForm as ObservationForm);
      jest
        .spyOn(observationFormRepository, 'save')
        .mockResolvedValue(mockObservationForm as ObservationForm);
      jest.spyOn(service, 'findOne').mockResolvedValue(mockObservationForm as ObservationForm);

      const result = await service.create(mockCreateFormDto);

      expect(result).toEqual(mockObservationForm);
      expect(observationFormRepository.findOne).toHaveBeenCalledWith({
        where: { formCode: mockCreateFormDto.formCode },
      });
      expect(observationFormRepository.create).toHaveBeenCalled();
      expect(observationFormRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when form code already exists', async () => {
      jest
        .spyOn(observationFormRepository, 'findOne')
        .mockResolvedValue(mockObservationForm as ObservationForm);

      await expect(service.create(mockCreateFormDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all observation forms', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockObservationForm]),
      };

      jest
        .spyOn(observationFormRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll();

      expect(result).toEqual([mockObservationForm]);
      expect(observationFormRepository.createQueryBuilder).toHaveBeenCalledWith('form');
    });

    it('should filter forms by subject', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockObservationForm]),
      };

      jest
        .spyOn(observationFormRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      await service.findAll({ subject: 'Khmer' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('form.subject = :subject', {
        subject: 'Khmer',
      });
    });
  });

  describe('findOne', () => {
    it('should return observation form by ID', async () => {
      jest
        .spyOn(observationFormRepository, 'findOne')
        .mockResolvedValue(mockObservationForm as ObservationForm);

      const result = await service.findOne(mockObservationForm.id);

      expect(result).toEqual(mockObservationForm);
      expect(observationFormRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockObservationForm.id },
        relations: [
          'lessonPhases',
          'lessonPhases.indicators',
          'lessonPhases.indicators.scales',
          'competencyDomains',
          'competencyDomains.indicators',
          'competencyDomains.indicators.scales',
        ],
        order: expect.any(Object),
      });
    });

    it('should throw NotFoundException when form not found', async () => {
      jest.spyOn(observationFormRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCode', () => {
    it('should return observation form by form code', async () => {
      jest
        .spyOn(observationFormRepository, 'findOne')
        .mockResolvedValue(mockObservationForm as ObservationForm);

      const result = await service.findByCode(mockObservationForm.formCode);

      expect(result).toEqual(mockObservationForm);
      expect(observationFormRepository.findOne).toHaveBeenCalledWith({
        where: { formCode: mockObservationForm.formCode },
        relations: expect.any(Array),
      });
    });

    it('should throw NotFoundException when form code not found', async () => {
      jest.spyOn(observationFormRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findByCode('NON-EXISTENT')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update observation form successfully', async () => {
      const updateDto = { title: 'Updated Title' };

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(mockObservationForm as ObservationForm)
        .mockResolvedValueOnce({ ...mockObservationForm, ...updateDto } as ObservationForm);
      jest.spyOn(observationFormRepository, 'update').mockResolvedValue(undefined as any);

      const result = await service.update(mockObservationForm.id, updateDto);

      expect(result.title).toBe(updateDto.title);
      expect(observationFormRepository.update).toHaveBeenCalledWith(
        mockObservationForm.id,
        updateDto,
      );
    });

    it('should throw ConflictException when updating to existing form code', async () => {
      const updateDto = { formCode: 'EXISTING-CODE' };
      const existingForm = { ...mockObservationForm, formCode: 'EXISTING-CODE' };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockObservationForm as ObservationForm);
      jest
        .spyOn(observationFormRepository, 'findOne')
        .mockResolvedValue(existingForm as ObservationForm);

      await expect(service.update(mockObservationForm.id, updateDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should remove observation form successfully', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockObservationForm as ObservationForm);
      jest
        .spyOn(observationFormRepository, 'remove')
        .mockResolvedValue(mockObservationForm as ObservationForm);

      await service.remove(mockObservationForm.id);

      expect(observationFormRepository.remove).toHaveBeenCalledWith(mockObservationForm);
    });
  });

  describe('getAvailableSubjects', () => {
    it('should return list of available subjects', async () => {
      const mockSubjects = [{ subject: 'Khmer' }, { subject: 'Mathematics' }];
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockSubjects),
      };

      jest
        .spyOn(observationFormRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.getAvailableSubjects();

      expect(result).toEqual(['Khmer', 'Mathematics']);
    });
  });

  describe('getAvailableGrades', () => {
    it('should return list of available grades', async () => {
      const mockGrades = [{ grade: '1' }, { grade: '2' }];
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockGrades),
      };

      jest
        .spyOn(observationFormRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.getAvailableGrades();

      expect(result).toEqual(['1', '2']);
    });
  });
});
