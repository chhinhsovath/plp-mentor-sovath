import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ObservationSessionsService } from './observation-sessions.service';
import { ObservationSession, SessionStatus } from '../entities/observation-session.entity';
import { ObservationForm } from '../entities/observation-form.entity';
import { User, UserRole } from '../entities/user.entity';
import { IndicatorResponsesService } from './indicator-responses.service';

describe('ObservationSessionsService', () => {
  let service: ObservationSessionsService;
  let sessionRepository: Repository<ObservationSession>;
  let formRepository: Repository<ObservationForm>;
  let userRepository: Repository<User>;
  let indicatorResponsesService: IndicatorResponsesService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'testuser',
    fullName: 'Test User',
    role: UserRole.TEACHER,
  };

  const mockForm = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    formCode: 'G1-KH',
    title: 'Grade 1 Khmer Form',
    subject: 'Khmer',
    gradeRange: '1',
  };

  const mockSession = {
    id: '123e4567-e89b-12d3-a456-426614174002',
    formId: mockForm.id,
    observerId: mockUser.id,
    schoolName: 'Test School',
    teacherName: 'Test Teacher',
    observerName: 'Test Observer',
    subject: 'Khmer',
    grade: '1',
    dateObserved: new Date('2025-07-19'),
    startTime: '07:30',
    endTime: '08:15',
    classificationLevel: 'Level 2',
    status: SessionStatus.DRAFT,
    createdAt: new Date(),
    form: mockForm,
    observer: mockUser,
  };

  const mockCreateSessionDto = {
    formId: mockForm.id,
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ObservationSessionsService,
        {
          provide: getRepositoryToken(ObservationSession),
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
          provide: getRepositoryToken(ObservationForm),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: IndicatorResponsesService,
          useValue: {
            createMultiple: jest.fn(),
            updateMultiple: jest.fn(),
            getSessionProgress: jest.fn(),
            validateAllResponses: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ObservationSessionsService>(ObservationSessionsService);
    sessionRepository = module.get<Repository<ObservationSession>>(
      getRepositoryToken(ObservationSession),
    );
    formRepository = module.get<Repository<ObservationForm>>(getRepositoryToken(ObservationForm));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    indicatorResponsesService = module.get<IndicatorResponsesService>(IndicatorResponsesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new observation session successfully', async () => {
      jest.spyOn(formRepository, 'findOne').mockResolvedValue(mockForm as ObservationForm);
      jest.spyOn(sessionRepository, 'create').mockReturnValue(mockSession as ObservationSession);
      jest.spyOn(sessionRepository, 'save').mockResolvedValue(mockSession as ObservationSession);
      jest.spyOn(service, 'findOne').mockResolvedValue(mockSession as ObservationSession);

      const result = await service.create(mockCreateSessionDto, mockUser as User);

      expect(result).toEqual(mockSession);
      expect(formRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockCreateSessionDto.formId },
      });
      expect(sessionRepository.create).toHaveBeenCalled();
      expect(sessionRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when form does not exist', async () => {
      jest.spyOn(formRepository, 'findOne').mockResolvedValue(null);

      await expect(service.create(mockCreateSessionDto, mockUser as User)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when form subject does not match', async () => {
      const wrongSubjectForm = { ...mockForm, subject: 'Mathematics' };
      jest.spyOn(formRepository, 'findOne').mockResolvedValue(wrongSubjectForm as ObservationForm);

      await expect(service.create(mockCreateSessionDto, mockUser as User)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when form grade does not match', async () => {
      const wrongGradeForm = { ...mockForm, gradeRange: '2-3' };
      jest.spyOn(formRepository, 'findOne').mockResolvedValue(wrongGradeForm as ObservationForm);

      await expect(service.create(mockCreateSessionDto, mockUser as User)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated sessions with filters', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockSession], 1]),
      };

      jest.spyOn(sessionRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll({}, mockUser as User);

      expect(result).toEqual({
        sessions: [mockSession],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should apply filters correctly', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      jest.spyOn(sessionRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const filterDto = {
        subject: 'Khmer',
        grade: '1',
        status: SessionStatus.COMPLETED,
        search: 'test',
      };

      await service.findAll(filterDto, mockUser as User);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('session.subject = :subject', {
        subject: 'Khmer',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('session.grade = :grade', {
        grade: '1',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('session.status = :status', {
        status: SessionStatus.COMPLETED,
      });
    });
  });

  describe('findOne', () => {
    it('should return session by ID when user has access', async () => {
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(mockSession as ObservationSession);

      const result = await service.findOne(mockSession.id, mockUser as User);

      expect(result).toEqual(mockSession);
      expect(sessionRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockSession.id },
        relations: expect.any(Array),
      });
    });

    it('should throw NotFoundException when session does not exist', async () => {
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('non-existent-id', mockUser as User)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user cannot access session', async () => {
      const otherUserSession = { ...mockSession, observerId: 'other-user-id' };
      jest
        .spyOn(sessionRepository, 'findOne')
        .mockResolvedValue(otherUserSession as ObservationSession);

      await expect(service.findOne(mockSession.id, mockUser as User)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('should update session successfully when user has permission', async () => {
      const updateDto = { schoolName: 'Updated School' };

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(mockSession as ObservationSession)
        .mockResolvedValueOnce({ ...mockSession, ...updateDto } as ObservationSession);
      jest.spyOn(sessionRepository, 'update').mockResolvedValue(undefined as any);

      const result = await service.update(mockSession.id, updateDto, mockUser as User);

      expect(result.schoolName).toBe(updateDto.schoolName);
      expect(sessionRepository.update).toHaveBeenCalledWith(
        mockSession.id,
        expect.objectContaining(updateDto),
      );
    });

    it('should throw ForbiddenException when user cannot edit session', async () => {
      const completedSession = { ...mockSession, status: SessionStatus.COMPLETED };
      jest.spyOn(service, 'findOne').mockResolvedValue(completedSession as ObservationSession);

      await expect(
        service.update(mockSession.id, { schoolName: 'Updated' }, mockUser as User),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateStatus', () => {
    it('should update status with valid transition', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(mockSession as ObservationSession)
        .mockResolvedValueOnce({
          ...mockSession,
          status: SessionStatus.IN_PROGRESS,
        } as ObservationSession);
      jest.spyOn(sessionRepository, 'update').mockResolvedValue(undefined as any);
      jest.spyOn(indicatorResponsesService, 'getSessionProgress').mockResolvedValue({
        totalIndicators: 5,
        completedResponses: 5,
        completionPercentage: 100,
        missingIndicators: [],
      });
      jest.spyOn(indicatorResponsesService, 'validateAllResponses').mockResolvedValue({
        isValid: true,
        errors: [],
      });

      const result = await service.updateStatus(
        mockSession.id,
        SessionStatus.IN_PROGRESS,
        mockUser as User,
      );

      expect(result.status).toBe(SessionStatus.IN_PROGRESS);
      expect(sessionRepository.update).toHaveBeenCalledWith(mockSession.id, {
        status: SessionStatus.IN_PROGRESS,
      });
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      const completedSession = { ...mockSession, status: SessionStatus.COMPLETED };
      jest.spyOn(service, 'findOne').mockResolvedValue(completedSession as ObservationSession);

      await expect(
        service.updateStatus(mockSession.id, SessionStatus.DRAFT, mockUser as User),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should remove draft session successfully', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockSession as ObservationSession);
      jest.spyOn(sessionRepository, 'remove').mockResolvedValue(mockSession as ObservationSession);

      await service.remove(mockSession.id, mockUser as User);

      expect(sessionRepository.remove).toHaveBeenCalledWith(mockSession);
    });

    it('should throw BadRequestException when trying to delete non-draft session', async () => {
      const completedSession = { ...mockSession, status: SessionStatus.COMPLETED };
      jest.spyOn(service, 'findOne').mockResolvedValue(completedSession as ObservationSession);

      await expect(service.remove(mockSession.id, mockUser as User)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('autoSave', () => {
    it('should auto-save session data for draft sessions', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockSession as ObservationSession);
      jest.spyOn(sessionRepository, 'update').mockResolvedValue(undefined as any);

      const updateData = { reflectionSummary: 'Auto-saved reflection' };

      await service.autoSave(mockSession.id, updateData, mockUser as User);

      expect(sessionRepository.update).toHaveBeenCalledWith(mockSession.id, updateData);
    });

    it('should throw BadRequestException for completed sessions', async () => {
      const completedSession = { ...mockSession, status: SessionStatus.COMPLETED };
      jest.spyOn(service, 'findOne').mockResolvedValue(completedSession as ObservationSession);

      await expect(
        service.autoSave(mockSession.id, { reflectionSummary: 'test' }, mockUser as User),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
