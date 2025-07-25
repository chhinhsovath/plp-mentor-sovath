import { Test, TestingModule } from '@nestjs/testing';
import { ObservationSessionsController } from './observation-sessions.controller';
import { ObservationSessionsService } from './observation-sessions.service';
import { IndicatorResponsesService } from './indicator-responses.service';
import { SessionWorkflowService } from './session-workflow.service';
import { User, UserRole } from '../entities/user.entity';
import { SessionStatus } from '../entities/observation-session.entity';
import { CreateObservationSessionDto } from './dto/create-observation-session.dto';
import { UpdateObservationSessionDto } from './dto/update-observation-session.dto';
import { SessionFilterDto } from './dto/session-filter.dto';

describe('ObservationSessionsController', () => {
  let controller: ObservationSessionsController;
  let observationSessionsService: ObservationSessionsService;
  let indicatorResponsesService: IndicatorResponsesService;
  let sessionWorkflowService: SessionWorkflowService;

  const mockUser: Partial<User> = {
    id: 'user-1',
    username: 'teacher1',
    role: UserRole.TEACHER,
  };

  const mockAdminUser: Partial<User> = {
    id: 'admin-1',
    username: 'admin1',
    role: UserRole.ADMINISTRATOR,
  };

  const mockSession = {
    id: 'session-1',
    formId: 'form-1',
    observerId: 'user-1',
    schoolName: 'Test School',
    teacherName: 'Test Teacher',
    observerName: 'Test Observer',
    subject: 'Khmer',
    grade: '1',
    dateObserved: new Date('2025-07-19'),
    startTime: '07:30',
    endTime: '08:15',
    status: SessionStatus.DRAFT,
    createdAt: new Date(),
  };

  const mockPaginatedResult = {
    sessions: [mockSession],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  const mockStatistics = {
    total: 10,
    draft: 3,
    inProgress: 2,
    completed: 4,
    approved: 1,
  };

  const mockWorkflowState = {
    currentStatus: SessionStatus.DRAFT,
    availableTransitions: [
      { from: SessionStatus.DRAFT, to: SessionStatus.IN_PROGRESS, description: 'Start session' },
    ],
    canEdit: true,
    canDelete: true,
    validationErrors: [],
  };

  const mockProgress = {
    status: SessionStatus.DRAFT,
    progressPercentage: 75,
    completedSteps: ['Basic information completed', 'Observation details completed'],
    remainingSteps: ['Complete remaining 5 indicators', 'Add reflection summary'],
    canProceedToNext: true,
  };

  const mockResponses = [
    {
      id: 'response-1',
      sessionId: 'session-1',
      indicatorId: 'indicator-1',
      selectedScore: 2,
      notes: 'Test notes',
    },
  ];

  const mockResponseProgress = {
    totalIndicators: 10,
    completedResponses: 7,
    completionPercentage: 70,
    missingIndicators: ['1.1', '1.2', '1.3'],
  };

  const mockValidationResult = {
    isValid: true,
    errors: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ObservationSessionsController],
      providers: [
        {
          provide: ObservationSessionsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            getSessionStatistics: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            updateStatus: jest.fn(),
            autoSave: jest.fn(),
          },
        },
        {
          provide: IndicatorResponsesService,
          useValue: {
            findBySession: jest.fn(),
            getSessionProgress: jest.fn(),
            validateAllResponses: jest.fn(),
          },
        },
        {
          provide: SessionWorkflowService,
          useValue: {
            getWorkflowState: jest.fn(),
            transitionStatus: jest.fn(),
            validateSessionForCompletion: jest.fn(),
            getSessionProgress: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ObservationSessionsController>(ObservationSessionsController);
    observationSessionsService = module.get<ObservationSessionsService>(ObservationSessionsService);
    indicatorResponsesService = module.get<IndicatorResponsesService>(IndicatorResponsesService);
    sessionWorkflowService = module.get<SessionWorkflowService>(SessionWorkflowService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new observation session', async () => {
      const createDto: CreateObservationSessionDto = {
        formId: 'form-1',
        schoolName: 'Test School',
        teacherName: 'Test Teacher',
        observerName: 'Test Observer',
        subject: 'Khmer',
        grade: '1',
        dateObserved: '2025-07-19',
        startTime: '07:30',
        endTime: '08:15',
        classificationLevel: 'Level 2',
      };

      jest.spyOn(observationSessionsService, 'create').mockResolvedValue(mockSession as any);

      const result = await controller.create(createDto, mockUser as User);

      expect(result).toEqual(mockSession);
      expect(observationSessionsService.create).toHaveBeenCalledWith(createDto, mockUser);
    });
  });

  describe('findAll', () => {
    it('should return paginated sessions', async () => {
      const filterDto: SessionFilterDto = {
        page: 1,
        limit: 10,
      };

      jest.spyOn(observationSessionsService, 'findAll').mockResolvedValue(mockPaginatedResult);

      const result = await controller.findAll(filterDto, mockUser as User);

      expect(result).toEqual(mockPaginatedResult);
      expect(observationSessionsService.findAll).toHaveBeenCalledWith(filterDto, mockUser);
    });

    it('should apply filters correctly', async () => {
      const filterDto: SessionFilterDto = {
        subject: 'Khmer',
        grade: '1',
        status: SessionStatus.COMPLETED,
        page: 1,
        limit: 20,
      };

      jest.spyOn(observationSessionsService, 'findAll').mockResolvedValue(mockPaginatedResult);

      await controller.findAll(filterDto, mockUser as User);

      expect(observationSessionsService.findAll).toHaveBeenCalledWith(filterDto, mockUser);
    });
  });

  describe('getStatistics', () => {
    it('should return session statistics', async () => {
      jest
        .spyOn(observationSessionsService, 'getSessionStatistics')
        .mockResolvedValue(mockStatistics);

      const result = await controller.getStatistics(mockUser as User);

      expect(result).toEqual(mockStatistics);
      expect(observationSessionsService.getSessionStatistics).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('findOne', () => {
    it('should return a single session', async () => {
      jest.spyOn(observationSessionsService, 'findOne').mockResolvedValue(mockSession as any);

      const result = await controller.findOne('session-1', mockUser as User);

      expect(result).toEqual(mockSession);
      expect(observationSessionsService.findOne).toHaveBeenCalledWith('session-1', mockUser);
    });
  });

  describe('update', () => {
    it('should update session', async () => {
      const updateDto: UpdateObservationSessionDto = {
        schoolName: 'Updated School',
      };

      const updatedSession = { ...mockSession, ...updateDto };
      jest.spyOn(observationSessionsService, 'update').mockResolvedValue(updatedSession as any);

      const result = await controller.update('session-1', updateDto, mockUser as User);

      expect(result).toEqual(updatedSession);
      expect(observationSessionsService.update).toHaveBeenCalledWith(
        'session-1',
        updateDto,
        mockUser,
      );
    });
  });

  describe('remove', () => {
    it('should remove session', async () => {
      jest.spyOn(observationSessionsService, 'remove').mockResolvedValue(undefined);

      await controller.remove('session-1', mockUser as User);

      expect(observationSessionsService.remove).toHaveBeenCalledWith('session-1', mockUser);
    });
  });

  describe('updateStatus', () => {
    it('should update session status', async () => {
      const updatedSession = { ...mockSession, status: SessionStatus.IN_PROGRESS };
      jest
        .spyOn(sessionWorkflowService, 'transitionStatus')
        .mockResolvedValue(updatedSession as any);

      const result = await controller.updateStatus(
        'session-1',
        SessionStatus.IN_PROGRESS,
        mockUser as User,
      );

      expect(result).toEqual(updatedSession);
      expect(sessionWorkflowService.transitionStatus).toHaveBeenCalledWith(
        'session-1',
        SessionStatus.IN_PROGRESS,
        mockUser,
      );
    });
  });

  describe('getWorkflowState', () => {
    it('should return workflow state', async () => {
      jest.spyOn(sessionWorkflowService, 'getWorkflowState').mockResolvedValue(mockWorkflowState);

      const result = await controller.getWorkflowState('session-1', mockUser as User);

      expect(result).toEqual(mockWorkflowState);
      expect(sessionWorkflowService.getWorkflowState).toHaveBeenCalledWith('session-1', mockUser);
    });
  });

  describe('getProgress', () => {
    it('should return session progress', async () => {
      jest.spyOn(sessionWorkflowService, 'getSessionProgress').mockResolvedValue(mockProgress);

      const result = await controller.getProgress('session-1');

      expect(result).toEqual(mockProgress);
      expect(sessionWorkflowService.getSessionProgress).toHaveBeenCalledWith('session-1');
    });
  });

  describe('validateSession', () => {
    it('should validate session', async () => {
      jest
        .spyOn(sessionWorkflowService, 'validateSessionForCompletion')
        .mockResolvedValue(mockValidationResult);

      const result = await controller.validateSession('session-1');

      expect(result).toEqual(mockValidationResult);
      expect(sessionWorkflowService.validateSessionForCompletion).toHaveBeenCalledWith('session-1');
    });
  });

  describe('autoSave', () => {
    it('should auto-save session data', async () => {
      const updateData = { reflectionSummary: 'Auto-saved reflection' };
      jest.spyOn(observationSessionsService, 'autoSave').mockResolvedValue(undefined);

      await controller.autoSave('session-1', updateData, mockUser as User);

      expect(observationSessionsService.autoSave).toHaveBeenCalledWith(
        'session-1',
        updateData,
        mockUser,
      );
    });
  });

  describe('getIndicatorResponses', () => {
    it('should return indicator responses', async () => {
      jest.spyOn(indicatorResponsesService, 'findBySession').mockResolvedValue(mockResponses as any);

      const result = await controller.getIndicatorResponses('session-1');

      expect(result).toEqual(mockResponses);
      expect(indicatorResponsesService.findBySession).toHaveBeenCalledWith('session-1');
    });
  });

  describe('getResponseProgress', () => {
    it('should return response progress', async () => {
      jest
        .spyOn(indicatorResponsesService, 'getSessionProgress')
        .mockResolvedValue(mockResponseProgress);

      const result = await controller.getResponseProgress('session-1');

      expect(result).toEqual(mockResponseProgress);
      expect(indicatorResponsesService.getSessionProgress).toHaveBeenCalledWith('session-1');
    });
  });

  describe('validateResponses', () => {
    it('should validate all responses', async () => {
      jest
        .spyOn(indicatorResponsesService, 'validateAllResponses')
        .mockResolvedValue(mockValidationResult);

      const result = await controller.validateResponses('session-1');

      expect(result).toEqual(mockValidationResult);
      expect(indicatorResponsesService.validateAllResponses).toHaveBeenCalledWith('session-1');
    });
  });

  describe('approveSession', () => {
    it('should approve session when user has required role', async () => {
      const approvedSession = { ...mockSession, status: SessionStatus.APPROVED };
      jest
        .spyOn(sessionWorkflowService, 'transitionStatus')
        .mockResolvedValue(approvedSession as any);

      const result = await controller.approveSession('session-1', mockAdminUser as User);

      expect(result).toEqual(approvedSession);
      expect(sessionWorkflowService.transitionStatus).toHaveBeenCalledWith(
        'session-1',
        SessionStatus.APPROVED,
        mockAdminUser,
      );
    });
  });

  describe('rejectSession', () => {
    it('should reject session and return to draft', async () => {
      const rejectedSession = { ...mockSession, status: SessionStatus.DRAFT };
      jest
        .spyOn(sessionWorkflowService, 'transitionStatus')
        .mockResolvedValue(rejectedSession as any);

      const result = await controller.rejectSession(
        'session-1',
        'Needs improvements',
        mockAdminUser as User,
      );

      expect(result).toEqual(rejectedSession);
      expect(sessionWorkflowService.transitionStatus).toHaveBeenCalledWith(
        'session-1',
        SessionStatus.DRAFT,
        mockAdminUser,
      );
    });
  });
});