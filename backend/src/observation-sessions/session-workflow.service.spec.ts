import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { SessionWorkflowService } from './session-workflow.service';
import { ObservationSession, SessionStatus } from '../entities/observation-session.entity';
import { User, UserRole } from '../entities/user.entity';
import { IndicatorResponsesService } from './indicator-responses.service';

describe('SessionWorkflowService', () => {
  let service: SessionWorkflowService;
  let sessionRepository: Repository<ObservationSession>;
  let indicatorResponsesService: IndicatorResponsesService;

  const mockUser = {
    id: 'user-1',
    username: 'teacher1',
    role: UserRole.TEACHER,
  };

  const mockAdminUser = {
    id: 'admin-1',
    username: 'admin1',
    role: UserRole.ADMINISTRATOR,
  };

  const mockSession = {
    id: 'session-1',
    observerId: 'user-1',
    schoolName: 'Test School',
    teacherName: 'Test Teacher',
    observerName: 'Test Observer',
    dateObserved: new Date('2025-07-19'),
    startTime: '07:30',
    endTime: '08:15',
    status: SessionStatus.DRAFT,
    reflectionSummary: 'Test reflection',
    form: { id: 'form-1' },
    observer: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionWorkflowService,
        {
          provide: getRepositoryToken(ObservationSession),
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: IndicatorResponsesService,
          useValue: {
            getSessionProgress: jest.fn(),
            validateAllResponses: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SessionWorkflowService>(SessionWorkflowService);
    sessionRepository = module.get<Repository<ObservationSession>>(
      getRepositoryToken(ObservationSession),
    );
    indicatorResponsesService = module.get<IndicatorResponsesService>(IndicatorResponsesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getWorkflowState', () => {
    it('should return workflow state for draft session', async () => {
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(mockSession as ObservationSession);
      jest.spyOn(indicatorResponsesService, 'getSessionProgress').mockResolvedValue({
        totalIndicators: 10,
        completedResponses: 10,
        completionPercentage: 100,
        missingIndicators: [],
      });
      jest.spyOn(indicatorResponsesService, 'validateAllResponses').mockResolvedValue({
        isValid: true,
        errors: [],
      });

      const result = await service.getWorkflowState('session-1', mockUser as User);

      expect(result.currentStatus).toBe(SessionStatus.DRAFT);
      expect(result.canEdit).toBe(true);
      expect(result.canDelete).toBe(true);
      expect(result.availableTransitions).toHaveLength(2); // To IN_PROGRESS and COMPLETED
      expect(result.validationErrors).toHaveLength(0);
    });

    it('should return validation errors for incomplete session', async () => {
      const incompleteSession = {
        ...mockSession,
        schoolName: null,
        startTime: null,
      };

      jest
        .spyOn(sessionRepository, 'findOne')
        .mockResolvedValue(incompleteSession as ObservationSession);
      jest.spyOn(indicatorResponsesService, 'getSessionProgress').mockResolvedValue({
        totalIndicators: 10,
        completedResponses: 5,
        completionPercentage: 50,
        missingIndicators: ['1.1', '1.2', '1.3', '1.4', '1.5'],
      });
      jest.spyOn(indicatorResponsesService, 'validateAllResponses').mockResolvedValue({
        isValid: true,
        errors: [],
      });

      const result = await service.getWorkflowState('session-1', mockUser as User);

      expect(result.validationErrors).toContain('School name is required');
      expect(result.validationErrors).toContain('Start time is required');
      expect(result.validationErrors).toContain(
        expect.stringContaining('Incomplete indicator responses'),
      );
    });

    it('should not allow edit for completed session', async () => {
      const completedSession = { ...mockSession, status: SessionStatus.COMPLETED };

      jest
        .spyOn(sessionRepository, 'findOne')
        .mockResolvedValue(completedSession as ObservationSession);
      jest.spyOn(indicatorResponsesService, 'getSessionProgress').mockResolvedValue({
        totalIndicators: 10,
        completedResponses: 10,
        completionPercentage: 100,
        missingIndicators: [],
      });
      jest.spyOn(indicatorResponsesService, 'validateAllResponses').mockResolvedValue({
        isValid: true,
        errors: [],
      });

      const result = await service.getWorkflowState('session-1', mockUser as User);

      expect(result.canEdit).toBe(false);
      expect(result.canDelete).toBe(false);
    });

    it('should show approval transition for admin on completed session', async () => {
      const completedSession = { ...mockSession, status: SessionStatus.COMPLETED };

      jest
        .spyOn(sessionRepository, 'findOne')
        .mockResolvedValue(completedSession as ObservationSession);
      jest.spyOn(indicatorResponsesService, 'getSessionProgress').mockResolvedValue({
        totalIndicators: 10,
        completedResponses: 10,
        completionPercentage: 100,
        missingIndicators: [],
      });
      jest.spyOn(indicatorResponsesService, 'validateAllResponses').mockResolvedValue({
        isValid: true,
        errors: [],
      });

      const result = await service.getWorkflowState('session-1', mockAdminUser as User);

      expect(result.availableTransitions).toHaveLength(1);
      expect(result.availableTransitions[0].to).toBe(SessionStatus.APPROVED);
    });

    it('should throw BadRequestException for non-existent session', async () => {
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getWorkflowState('non-existent', mockUser as User)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('transitionStatus', () => {
    it('should transition from DRAFT to IN_PROGRESS', async () => {
      jest
        .spyOn(sessionRepository, 'findOne')
        .mockResolvedValueOnce(mockSession as ObservationSession)
        .mockResolvedValueOnce({
          ...mockSession,
          status: SessionStatus.IN_PROGRESS,
        } as ObservationSession);
      jest.spyOn(sessionRepository, 'update').mockResolvedValue(undefined as any);

      const result = await service.transitionStatus(
        'session-1',
        SessionStatus.IN_PROGRESS,
        mockUser as User,
      );

      expect(result.status).toBe(SessionStatus.IN_PROGRESS);
      expect(sessionRepository.update).toHaveBeenCalledWith('session-1', {
        status: SessionStatus.IN_PROGRESS,
      });
    });

    it('should validate session before transitioning to COMPLETED', async () => {
      jest
        .spyOn(sessionRepository, 'findOne')
        .mockResolvedValueOnce(mockSession as ObservationSession);
      jest.spyOn(indicatorResponsesService, 'getSessionProgress').mockResolvedValue({
        totalIndicators: 10,
        completedResponses: 5,
        completionPercentage: 50,
        missingIndicators: ['1.1', '1.2', '1.3', '1.4', '1.5'],
      });
      jest.spyOn(indicatorResponsesService, 'validateAllResponses').mockResolvedValue({
        isValid: true,
        errors: [],
      });

      await expect(
        service.transitionStatus('session-1', SessionStatus.COMPLETED, mockUser as User),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow valid transition to COMPLETED', async () => {
      const inProgressSession = { ...mockSession, status: SessionStatus.IN_PROGRESS };

      jest
        .spyOn(sessionRepository, 'findOne')
        .mockResolvedValueOnce(inProgressSession as ObservationSession)
        .mockResolvedValueOnce(inProgressSession as ObservationSession)
        .mockResolvedValueOnce({
          ...inProgressSession,
          status: SessionStatus.COMPLETED,
        } as ObservationSession);
      jest.spyOn(sessionRepository, 'update').mockResolvedValue(undefined as any);
      jest.spyOn(indicatorResponsesService, 'getSessionProgress').mockResolvedValue({
        totalIndicators: 10,
        completedResponses: 10,
        completionPercentage: 100,
        missingIndicators: [],
      });
      jest.spyOn(indicatorResponsesService, 'validateAllResponses').mockResolvedValue({
        isValid: true,
        errors: [],
      });

      const result = await service.transitionStatus(
        'session-1',
        SessionStatus.COMPLETED,
        mockUser as User,
      );

      expect(result.status).toBe(SessionStatus.COMPLETED);
    });

    it('should require admin role for approval transition', async () => {
      const completedSession = { ...mockSession, status: SessionStatus.COMPLETED };

      jest
        .spyOn(sessionRepository, 'findOne')
        .mockResolvedValue(completedSession as ObservationSession);

      await expect(
        service.transitionStatus('session-1', SessionStatus.APPROVED, mockUser as User),
      ).rejects.toThrow('Role \'TEACHER\' is not authorized for this transition');
    });

    it('should allow admin to approve session', async () => {
      const completedSession = { ...mockSession, status: SessionStatus.COMPLETED };

      jest
        .spyOn(sessionRepository, 'findOne')
        .mockResolvedValueOnce(completedSession as ObservationSession)
        .mockResolvedValueOnce({
          ...completedSession,
          status: SessionStatus.APPROVED,
        } as ObservationSession);
      jest.spyOn(sessionRepository, 'update').mockResolvedValue(undefined as any);

      const result = await service.transitionStatus(
        'session-1',
        SessionStatus.APPROVED,
        mockAdminUser as User,
      );

      expect(result.status).toBe(SessionStatus.APPROVED);
    });

    it('should throw BadRequestException for invalid transition', async () => {
      const completedSession = { ...mockSession, status: SessionStatus.COMPLETED };

      jest
        .spyOn(sessionRepository, 'findOne')
        .mockResolvedValue(completedSession as ObservationSession);

      await expect(
        service.transitionStatus('session-1', SessionStatus.DRAFT, mockUser as User),
      ).rejects.toThrow('Invalid transition from \'COMPLETED\' to \'DRAFT\'');
    });

    it('should throw BadRequestException when user is not observer', async () => {
      const otherUserSession = { ...mockSession, observerId: 'other-user' };

      jest
        .spyOn(sessionRepository, 'findOne')
        .mockResolvedValue(otherUserSession as ObservationSession);

      await expect(
        service.transitionStatus('session-1', SessionStatus.IN_PROGRESS, mockUser as User),
      ).rejects.toThrow('You are not authorized to perform this transition');
    });
  });

  describe('validateSessionForCompletion', () => {
    it('should validate complete session successfully', async () => {
      jest
        .spyOn(sessionRepository, 'findOne')
        .mockResolvedValue(mockSession as ObservationSession);
      jest.spyOn(indicatorResponsesService, 'getSessionProgress').mockResolvedValue({
        totalIndicators: 10,
        completedResponses: 10,
        completionPercentage: 100,
        missingIndicators: [],
      });
      jest.spyOn(indicatorResponsesService, 'validateAllResponses').mockResolvedValue({
        isValid: true,
        errors: [],
      });

      const result = await service.validateSessionForCompletion('session-1');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for missing required fields', async () => {
      const incompleteSession = {
        ...mockSession,
        schoolName: '',
        teacherName: '',
        dateObserved: null,
      };

      jest
        .spyOn(sessionRepository, 'findOne')
        .mockResolvedValue(incompleteSession as ObservationSession);
      jest.spyOn(indicatorResponsesService, 'getSessionProgress').mockResolvedValue({
        totalIndicators: 10,
        completedResponses: 10,
        completionPercentage: 100,
        missingIndicators: [],
      });
      jest.spyOn(indicatorResponsesService, 'validateAllResponses').mockResolvedValue({
        isValid: true,
        errors: [],
      });

      const result = await service.validateSessionForCompletion('session-1');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('School name is required');
      expect(result.errors).toContain('Teacher name is required');
      expect(result.errors).toContain('Observation date is required');
    });

    it('should validate time range', async () => {
      const invalidTimeSession = {
        ...mockSession,
        startTime: '08:30',
        endTime: '07:30', // End time before start time
      };

      jest
        .spyOn(sessionRepository, 'findOne')
        .mockResolvedValue(invalidTimeSession as ObservationSession);
      jest.spyOn(indicatorResponsesService, 'getSessionProgress').mockResolvedValue({
        totalIndicators: 10,
        completedResponses: 10,
        completionPercentage: 100,
        missingIndicators: [],
      });
      jest.spyOn(indicatorResponsesService, 'validateAllResponses').mockResolvedValue({
        isValid: true,
        errors: [],
      });

      const result = await service.validateSessionForCompletion('session-1');

      expect(result.errors).toContain('End time must be after start time');
    });

    it('should include indicator validation errors', async () => {
      jest
        .spyOn(sessionRepository, 'findOne')
        .mockResolvedValue(mockSession as ObservationSession);
      jest.spyOn(indicatorResponsesService, 'getSessionProgress').mockResolvedValue({
        totalIndicators: 10,
        completedResponses: 10,
        completionPercentage: 100,
        missingIndicators: [],
      });
      jest.spyOn(indicatorResponsesService, 'validateAllResponses').mockResolvedValue({
        isValid: false,
        errors: ['Indicator 1.1: Invalid score', 'Indicator 1.2: Missing response'],
      });

      const result = await service.validateSessionForCompletion('session-1');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Indicator 1.1: Invalid score');
      expect(result.errors).toContain('Indicator 1.2: Missing response');
    });
  });

  describe('getSessionProgress', () => {
    it('should calculate session progress correctly', async () => {
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(mockSession as ObservationSession);
      jest.spyOn(indicatorResponsesService, 'getSessionProgress').mockResolvedValue({
        totalIndicators: 10,
        completedResponses: 10,
        completionPercentage: 100,
        missingIndicators: [],
      });
      jest.spyOn(indicatorResponsesService, 'validateAllResponses').mockResolvedValue({
        isValid: true,
        errors: [],
      });

      const result = await service.getSessionProgress('session-1');

      expect(result.status).toBe(SessionStatus.DRAFT);
      expect(result.progressPercentage).toBe(100);
      expect(result.completedSteps).toContain('Basic information completed');
      expect(result.completedSteps).toContain('Observation details completed');
      expect(result.completedSteps).toContain('All indicators completed');
      expect(result.completedSteps).toContain('Reflection summary completed');
      expect(result.remainingSteps).toHaveLength(0);
      expect(result.canProceedToNext).toBe(true);
    });

    it('should show remaining steps for incomplete session', async () => {
      const incompleteSession = {
        ...mockSession,
        reflectionSummary: null,
        startTime: null,
        endTime: null,
      };

      jest
        .spyOn(sessionRepository, 'findOne')
        .mockResolvedValue(incompleteSession as ObservationSession);
      jest.spyOn(indicatorResponsesService, 'getSessionProgress').mockResolvedValue({
        totalIndicators: 10,
        completedResponses: 5,
        completionPercentage: 50,
        missingIndicators: ['1.1', '1.2', '1.3', '1.4', '1.5'],
      });
      jest.spyOn(indicatorResponsesService, 'validateAllResponses').mockResolvedValue({
        isValid: false,
        errors: ['Some validation error'],
      });

      const result = await service.getSessionProgress('session-1');

      expect(result.progressPercentage).toBe(50);
      expect(result.completedSteps).toContain('Basic information completed');
      expect(result.remainingSteps).toContain('Complete observation details');
      expect(result.remainingSteps).toContain('Complete remaining 5 indicators');
      expect(result.remainingSteps).toContain('Add reflection summary');
      expect(result.canProceedToNext).toBe(false);
    });

    it('should not allow proceeding for approved sessions', async () => {
      const approvedSession = { ...mockSession, status: SessionStatus.APPROVED };

      jest
        .spyOn(sessionRepository, 'findOne')
        .mockResolvedValue(approvedSession as ObservationSession);
      jest.spyOn(indicatorResponsesService, 'getSessionProgress').mockResolvedValue({
        totalIndicators: 10,
        completedResponses: 10,
        completionPercentage: 100,
        missingIndicators: [],
      });
      jest.spyOn(indicatorResponsesService, 'validateAllResponses').mockResolvedValue({
        isValid: true,
        errors: [],
      });

      const result = await service.getSessionProgress('session-1');

      expect(result.canProceedToNext).toBe(false);
    });

    it('should throw BadRequestException for non-existent session', async () => {
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getSessionProgress('non-existent')).rejects.toThrow(BadRequestException);
    });
  });
});