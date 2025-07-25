import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { IndicatorResponsesService } from './indicator-responses.service';
import { IndicatorResponse } from '../entities/indicator-response.entity';
import { Indicator, RubricType } from '../entities/indicator.entity';
import { CreateIndicatorResponseDto } from './dto/create-observation-session.dto';

describe('IndicatorResponsesService', () => {
  let service: IndicatorResponsesService;
  let responseRepository: Repository<IndicatorResponse>;
  let indicatorRepository: Repository<Indicator>;

  const mockScaleIndicator = {
    id: 'indicator-1',
    indicatorNumber: '1.1',
    indicatorText: 'Test scale indicator',
    rubricType: RubricType.SCALE,
    maxScore: 3,
    isActive: true,
    scales: [
      { scaleLabel: '1', scaleDescription: 'Poor' },
      { scaleLabel: '2', scaleDescription: 'Good' },
      { scaleLabel: '3', scaleDescription: 'Excellent' },
    ],
  };

  const mockCheckboxIndicator = {
    id: 'indicator-2',
    indicatorNumber: '1.2',
    indicatorText: 'Test checkbox indicator',
    rubricType: RubricType.CHECKBOX,
    maxScore: 1,
    isActive: true,
  };

  const mockResponse = {
    id: 'response-1',
    sessionId: 'session-1',
    indicatorId: 'indicator-1',
    selectedScore: 2,
    selectedLevel: null,
    notes: 'Test notes',
    indicator: mockScaleIndicator,
  };

  const mockSession = {
    session: {
      form: {
        lessonPhases: [
          {
            indicators: [mockScaleIndicator, mockCheckboxIndicator],
          },
        ],
        competencyDomains: [],
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IndicatorResponsesService,
        {
          provide: getRepositoryToken(IndicatorResponse),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Indicator),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<IndicatorResponsesService>(IndicatorResponsesService);
    responseRepository = module.get<Repository<IndicatorResponse>>(
      getRepositoryToken(IndicatorResponse),
    );
    indicatorRepository = module.get<Repository<Indicator>>(getRepositoryToken(Indicator));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new response for scale indicator', async () => {
      const createDto: CreateIndicatorResponseDto = {
        indicatorId: 'indicator-1',
        selectedScore: 2,
        notes: 'Test notes',
      };

      jest.spyOn(indicatorRepository, 'findOne').mockResolvedValue(mockScaleIndicator as Indicator);
      jest.spyOn(responseRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(responseRepository, 'create').mockReturnValue(mockResponse as IndicatorResponse);
      jest.spyOn(responseRepository, 'save').mockResolvedValue(mockResponse as IndicatorResponse);

      const result = await service.create('session-1', createDto);

      expect(result).toEqual(mockResponse);
      expect(indicatorRepository.findOne).toHaveBeenCalledWith({
        where: { id: createDto.indicatorId, isActive: true },
      });
      expect(responseRepository.create).toHaveBeenCalledWith({
        sessionId: 'session-1',
        indicatorId: createDto.indicatorId,
        selectedScore: createDto.selectedScore,
        selectedLevel: undefined,
        notes: createDto.notes,
      });
    });

    it('should create a new response for checkbox indicator', async () => {
      const createDto: CreateIndicatorResponseDto = {
        indicatorId: 'indicator-2',
        selectedLevel: 'checked',
        selectedScore: 1,
      };

      const checkboxResponse = {
        ...mockResponse,
        indicatorId: 'indicator-2',
        selectedScore: 1,
        selectedLevel: 'checked',
        indicator: mockCheckboxIndicator,
      };

      jest
        .spyOn(indicatorRepository, 'findOne')
        .mockResolvedValue(mockCheckboxIndicator as Indicator);
      jest.spyOn(responseRepository, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(responseRepository, 'create')
        .mockReturnValue(checkboxResponse as IndicatorResponse);
      jest
        .spyOn(responseRepository, 'save')
        .mockResolvedValue(checkboxResponse as IndicatorResponse);

      const result = await service.create('session-1', createDto);

      expect(result.selectedLevel).toBe('checked');
      expect(result.selectedScore).toBe(1);
    });

    it('should update existing response', async () => {
      const createDto: CreateIndicatorResponseDto = {
        indicatorId: 'indicator-1',
        selectedScore: 3,
        notes: 'Updated notes',
      };

      const updatedResponse = { ...mockResponse, selectedScore: 3, notes: 'Updated notes' };

      jest.spyOn(indicatorRepository, 'findOne').mockResolvedValue(mockScaleIndicator as Indicator);
      jest
        .spyOn(responseRepository, 'findOne')
        .mockResolvedValueOnce(mockResponse as IndicatorResponse)
        .mockResolvedValueOnce(updatedResponse as IndicatorResponse);
      jest.spyOn(responseRepository, 'update').mockResolvedValue(undefined as any);

      const result = await service.create('session-1', createDto);

      expect(result.selectedScore).toBe(3);
      expect(responseRepository.update).toHaveBeenCalledWith(mockResponse.id, {
        selectedScore: createDto.selectedScore,
        selectedLevel: undefined,
        notes: createDto.notes,
      });
    });

    it('should throw NotFoundException for inactive indicator', async () => {
      const createDto: CreateIndicatorResponseDto = {
        indicatorId: 'indicator-1',
        selectedScore: 2,
      };

      jest.spyOn(indicatorRepository, 'findOne').mockResolvedValue(null);

      await expect(service.create('session-1', createDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid scale score', async () => {
      const createDto: CreateIndicatorResponseDto = {
        indicatorId: 'indicator-1',
        selectedScore: 5, // Max score is 3
      };

      jest.spyOn(indicatorRepository, 'findOne').mockResolvedValue(mockScaleIndicator as Indicator);
      jest.spyOn(responseRepository, 'findOne').mockResolvedValue(null);

      await expect(service.create('session-1', createDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for missing scale score', async () => {
      const createDto: CreateIndicatorResponseDto = {
        indicatorId: 'indicator-1',
        // Missing selectedScore for scale indicator
      };

      jest.spyOn(indicatorRepository, 'findOne').mockResolvedValue(mockScaleIndicator as Indicator);
      jest.spyOn(responseRepository, 'findOne').mockResolvedValue(null);

      await expect(service.create('session-1', createDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for missing checkbox level', async () => {
      const createDto: CreateIndicatorResponseDto = {
        indicatorId: 'indicator-2',
        // Missing selectedLevel for checkbox indicator
      };

      jest
        .spyOn(indicatorRepository, 'findOne')
        .mockResolvedValue(mockCheckboxIndicator as Indicator);
      jest.spyOn(responseRepository, 'findOne').mockResolvedValue(null);

      await expect(service.create('session-1', createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('createMultiple', () => {
    it('should create multiple responses', async () => {
      const createDtos: CreateIndicatorResponseDto[] = [
        { indicatorId: 'indicator-1', selectedScore: 2 },
        { indicatorId: 'indicator-2', selectedLevel: 'checked', selectedScore: 1 },
      ];

      jest
        .spyOn(service, 'create')
        .mockResolvedValueOnce(mockResponse as IndicatorResponse)
        .mockResolvedValueOnce({
          ...mockResponse,
          indicatorId: 'indicator-2',
        } as IndicatorResponse);

      const result = await service.createMultiple('session-1', createDtos);

      expect(result).toHaveLength(2);
      expect(service.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateMultiple', () => {
    it('should delete existing responses and create new ones', async () => {
      const createDtos: CreateIndicatorResponseDto[] = [
        { indicatorId: 'indicator-1', selectedScore: 3 },
      ];

      jest.spyOn(responseRepository, 'delete').mockResolvedValue(undefined as any);
      jest.spyOn(service, 'createMultiple').mockResolvedValue([mockResponse as IndicatorResponse]);

      const result = await service.updateMultiple('session-1', createDtos);

      expect(responseRepository.delete).toHaveBeenCalledWith({ sessionId: 'session-1' });
      expect(service.createMultiple).toHaveBeenCalledWith('session-1', createDtos);
      expect(result).toEqual([mockResponse]);
    });
  });

  describe('findBySession', () => {
    it('should return all responses for a session', async () => {
      jest.spyOn(responseRepository, 'find').mockResolvedValue([mockResponse as IndicatorResponse]);

      const result = await service.findBySession('session-1');

      expect(result).toEqual([mockResponse]);
      expect(responseRepository.find).toHaveBeenCalledWith({
        where: { sessionId: 'session-1' },
        relations: ['indicator', 'indicator.scales'],
        order: {
          indicator: {
            indicatorNumber: 'ASC',
          },
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a response by ID', async () => {
      jest.spyOn(responseRepository, 'findOne').mockResolvedValue(mockResponse as IndicatorResponse);

      const result = await service.findOne('response-1');

      expect(result).toEqual(mockResponse);
      expect(responseRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'response-1' },
        relations: ['indicator', 'indicator.scales'],
      });
    });

    it('should throw NotFoundException when response not found', async () => {
      jest.spyOn(responseRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update response successfully', async () => {
      const updateData = { selectedScore: 3, notes: 'Updated notes' };
      const updatedResponse = { ...mockResponse, ...updateData };

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(mockResponse as IndicatorResponse)
        .mockResolvedValueOnce(updatedResponse as IndicatorResponse);
      jest.spyOn(responseRepository, 'update').mockResolvedValue(undefined as any);

      const result = await service.update('response-1', updateData);

      expect(result).toEqual(updatedResponse);
      expect(responseRepository.update).toHaveBeenCalledWith('response-1', updateData);
    });

    it('should validate when updating score', async () => {
      const updateData = { selectedScore: 5 }; // Invalid score

      jest.spyOn(service, 'findOne').mockResolvedValue(mockResponse as IndicatorResponse);

      await expect(service.update('response-1', updateData)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should remove response successfully', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockResponse as IndicatorResponse);
      jest.spyOn(responseRepository, 'remove').mockResolvedValue(mockResponse as IndicatorResponse);

      await service.remove('response-1');

      expect(responseRepository.remove).toHaveBeenCalledWith(mockResponse);
    });
  });

  describe('getSessionProgress', () => {
    it('should calculate session progress correctly', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockSession),
      };

      jest.spyOn(service, 'findBySession').mockResolvedValue([mockResponse as IndicatorResponse]);
      jest
        .spyOn(responseRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.getSessionProgress('session-1');

      expect(result).toEqual({
        totalIndicators: 2,
        completedResponses: 1,
        completionPercentage: 50,
        missingIndicators: ['1.2'],
      });
    });

    it('should handle session with no indicators', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      jest.spyOn(service, 'findBySession').mockResolvedValue([]);
      jest
        .spyOn(responseRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.getSessionProgress('session-1');

      expect(result).toEqual({
        totalIndicators: 0,
        completedResponses: 0,
        completionPercentage: 0,
        missingIndicators: [],
      });
    });
  });

  describe('validateAllResponses', () => {
    it('should validate all responses successfully', async () => {
      jest.spyOn(service, 'findBySession').mockResolvedValue([mockResponse as IndicatorResponse]);

      const result = await service.validateAllResponses('session-1');

      expect(result).toEqual({
        isValid: true,
        errors: [],
      });
    });

    it('should return validation errors', async () => {
      const invalidResponse = {
        ...mockResponse,
        selectedScore: null, // Invalid for scale indicator
      };

      jest
        .spyOn(service, 'findBySession')
        .mockResolvedValue([invalidResponse as IndicatorResponse]);

      const result = await service.validateAllResponses('session-1');

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('1.1');
    });
  });
});