import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ImprovementPlansService } from './improvement-plans.service';
import { ImprovementPlan, PlanStatus } from '../entities/improvement-plan.entity';
import { ImprovementAction } from '../entities/improvement-action.entity';
import { FollowUpActivity, ActivityStatus } from '../entities/follow-up-activity.entity';
import { ObservationSession } from '../entities/observation-session.entity';
import { User, UserRole } from '../entities/user.entity';
import { NotificationService } from './notification.service';

describe('ImprovementPlansService', () => {
  let service: ImprovementPlansService;
  let planRepository: Repository<ImprovementPlan>;
  let actionRepository: Repository<ImprovementAction>;
  let activityRepository: Repository<FollowUpActivity>;
  let sessionRepository: Repository<ObservationSession>;
  let notificationService: NotificationService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'testuser',
    fullName: 'Test User',
    role: UserRole.TEACHER,
  };

  const mockSession = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    teacherName: 'Test Teacher',
    observerName: 'Test Observer',
    subject: 'Khmer',
    grade: '1',
  };

  const mockPlan = {
    id: '123e4567-e89b-12d3-a456-426614174002',
    sessionId: mockSession.id,
    goals: 'Improve classroom management',
    timeline: '3 months',
    responsibleParty: 'Teacher and Mentor',
    status: PlanStatus.ACTIVE,
    createdAt: new Date(),
    session: mockSession,
    actions: [],
    followUpActivities: [],
  };

  const mockAction = {
    id: '123e4567-e89b-12d3-a456-426614174003',
    planId: mockPlan.id,
    description: 'Attend classroom management workshop',
    targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: 'pending',
    priority: 'high',
  };

  const mockActivity = {
    id: '123e4567-e89b-12d3-a456-426614174004',
    planId: mockPlan.id,
    description: 'Follow-up observation',
    dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    assignedTo: mockUser.id,
    status: ActivityStatus.PENDING,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImprovementPlansService,
        {
          provide: getRepositoryToken(ImprovementPlan),
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
          provide: getRepositoryToken(ImprovementAction),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(FollowUpActivity),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ObservationSession),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            sendDueDateReminder: jest.fn(),
            sendPlanStatusUpdate: jest.fn(),
            sendActivityAssignment: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ImprovementPlansService>(ImprovementPlansService);
    planRepository = module.get<Repository<ImprovementPlan>>(getRepositoryToken(ImprovementPlan));
    actionRepository = module.get<Repository<ImprovementAction>>(getRepositoryToken(ImprovementAction));
    activityRepository = module.get<Repository<FollowUpActivity>>(getRepositoryToken(FollowUpActivity));
    sessionRepository = module.get<Repository<ObservationSession>>(getRepositoryToken(ObservationSession));
    notificationService = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new improvement plan successfully', async () => {
      const createPlanDto = {
        sessionId: mockSession.id,
        goals: 'Improve classroom management',
        timeline: '3 months',
        responsibleParty: 'Teacher and Mentor',
        actions: [
          {
            description: 'Attend workshop',
            targetDate: '2025-08-19',
            priority: 'high',
          },
        ],
      };

      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(mockSession as ObservationSession);
      jest.spyOn(planRepository, 'create').mockReturnValue(mockPlan as ImprovementPlan);
      jest.spyOn(planRepository, 'save').mockResolvedValue(mockPlan as ImprovementPlan);
      jest.spyOn(actionRepository, 'create').mockReturnValue(mockAction as ImprovementAction);
      jest.spyOn(actionRepository, 'save').mockResolvedValue(mockAction as ImprovementAction);

      const result = await service.create(createPlanDto, mockUser as User);

      expect(result).toEqual(mockPlan);
      expect(sessionRepository.findOne).toHaveBeenCalledWith({
        where: { id: createPlanDto.sessionId },
      });
      expect(planRepository.create).toHaveBeenCalled();
      expect(planRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when session does not exist', async () => {
      const createPlanDto = {
        sessionId: 'non-existent-id',
        goals: 'Test goals',
        timeline: '3 months',
        responsibleParty: 'Teacher',
        actions: [],
      };

      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(null);

      await expect(service.create(createPlanDto, mockUser as User)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated improvement plans with filters', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockPlan], 1]),
      };

      jest.spyOn(planRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll({}, mockUser as User);

      expect(result).toEqual({
        plans: [mockPlan],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should apply status filter correctly', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      jest.spyOn(planRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      await service.findAll({ status: PlanStatus.ACTIVE }, mockUser as User);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('plan.status = :status', {
        status: PlanStatus.ACTIVE,
      });
    });
  });

  describe('findOne', () => {
    it('should return improvement plan by ID', async () => {
      jest.spyOn(planRepository, 'findOne').mockResolvedValue(mockPlan as ImprovementPlan);

      const result = await service.findOne(mockPlan.id, mockUser as User);

      expect(result).toEqual(mockPlan);
      expect(planRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockPlan.id },
        relations: ['session', 'actions', 'followUpActivities'],
      });
    });

    it('should throw NotFoundException when plan does not exist', async () => {
      jest.spyOn(planRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('non-existent-id', mockUser as User)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update improvement plan successfully', async () => {
      const updateDto = {
        goals: 'Updated goals',
        timeline: '6 months',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockPlan as ImprovementPlan);
      jest.spyOn(planRepository, 'update').mockResolvedValue(undefined as any);
      jest.spyOn(service, 'findOne').mockResolvedValue({
        ...mockPlan,
        ...updateDto,
      } as ImprovementPlan);

      const result = await service.update(mockPlan.id, updateDto, mockUser as User);

      expect(result.goals).toBe(updateDto.goals);
      expect(result.timeline).toBe(updateDto.timeline);
      expect(planRepository.update).toHaveBeenCalledWith(mockPlan.id, updateDto);
    });

    it('should throw ForbiddenException when trying to update completed plan', async () => {
      const completedPlan = { ...mockPlan, status: PlanStatus.COMPLETED };
      jest.spyOn(service, 'findOne').mockResolvedValue(completedPlan as ImprovementPlan);

      await expect(
        service.update(mockPlan.id, { goals: 'Updated' }, mockUser as User),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateStatus', () => {
    it('should update plan status successfully', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockPlan as ImprovementPlan);
      jest.spyOn(planRepository, 'update').mockResolvedValue(undefined as any);
      jest.spyOn(service, 'findOne').mockResolvedValue({
        ...mockPlan,
        status: PlanStatus.COMPLETED,
      } as ImprovementPlan);
      jest.spyOn(notificationService, 'sendPlanStatusUpdate').mockResolvedValue(undefined);

      const result = await service.updateStatus(mockPlan.id, PlanStatus.COMPLETED, mockUser as User);

      expect(result.status).toBe(PlanStatus.COMPLETED);
      expect(notificationService.sendPlanStatusUpdate).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      const completedPlan = { ...mockPlan, status: PlanStatus.COMPLETED };
      jest.spyOn(service, 'findOne').mockResolvedValue(completedPlan as ImprovementPlan);

      await expect(
        service.updateStatus(mockPlan.id, PlanStatus.ACTIVE, mockUser as User),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('addAction', () => {
    it('should add action to improvement plan', async () => {
      const actionDto = {
        description: 'New action',
        targetDate: '2025-08-19',
        priority: 'medium',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockPlan as ImprovementPlan);
      jest.spyOn(actionRepository, 'create').mockReturnValue(mockAction as ImprovementAction);
      jest.spyOn(actionRepository, 'save').mockResolvedValue(mockAction as ImprovementAction);

      const result = await service.addAction(mockPlan.id, actionDto, mockUser as User);

      expect(result).toEqual(mockAction);
      expect(actionRepository.create).toHaveBeenCalledWith({
        planId: mockPlan.id,
        ...actionDto,
        targetDate: new Date(actionDto.targetDate),
      });
    });
  });

  describe('scheduleFollowUp', () => {
    it('should schedule follow-up activity', async () => {
      const activityDto = {
        description: 'Follow-up observation',
        dueDate: '2025-08-19',
        assignedTo: mockUser.id,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockPlan as ImprovementPlan);
      jest.spyOn(activityRepository, 'create').mockReturnValue(mockActivity as FollowUpActivity);
      jest.spyOn(activityRepository, 'save').mockResolvedValue(mockActivity as FollowUpActivity);
      jest.spyOn(notificationService, 'sendActivityAssignment').mockResolvedValue(undefined);

      const result = await service.scheduleFollowUp(mockPlan.id, activityDto, mockUser as User);

      expect(result).toEqual(mockActivity);
      expect(notificationService.sendActivityAssignment).toHaveBeenCalled();
    });
  });

  describe('getOverdueActivities', () => {
    it('should return overdue activities for user scope', async () => {
      const overdueActivity = {
        ...mockActivity,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        status: ActivityStatus.PENDING,
      };

      jest.spyOn(activityRepository, 'find').mockResolvedValue([overdueActivity as FollowUpActivity]);

      const result = await service.getOverdueActivities(mockUser as User);

      expect(result).toEqual([overdueActivity]);
      expect(activityRepository.find).toHaveBeenCalledWith({
        where: {
          dueDate: expect.any(Object),
          status: ActivityStatus.PENDING,
        },
        relations: ['plan', 'plan.session'],
      });
    });
  });

  describe('getUpcomingActivities', () => {
    it('should return upcoming activities within specified days', async () => {
      const upcomingActivity = {
        ...mockActivity,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // In 3 days
      };

      jest.spyOn(activityRepository, 'find').mockResolvedValue([upcomingActivity as FollowUpActivity]);

      const result = await service.getUpcomingActivities(mockUser as User, 7);

      expect(result).toEqual([upcomingActivity]);
    });
  });

  describe('getPlanEffectiveness', () => {
    it('should calculate plan effectiveness metrics', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          {
            status: PlanStatus.COMPLETED,
            count: '15',
            avg_completion_days: '45.5',
          },
          {
            status: PlanStatus.ACTIVE,
            count: '8',
            avg_completion_days: null,
          },
        ]),
      };

      jest.spyOn(planRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.getPlanEffectiveness(mockUser as User);

      expect(result).toEqual(expect.objectContaining({
        totalPlans: expect.any(Number),
        completedPlans: expect.any(Number),
        activePlans: expect.any(Number),
        averageCompletionDays: expect.any(Number),
      }));
    });
  });

  describe('remove', () => {
    it('should remove improvement plan successfully', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockPlan as ImprovementPlan);
      jest.spyOn(planRepository, 'remove').mockResolvedValue(mockPlan as ImprovementPlan);

      await service.remove(mockPlan.id, mockUser as User);

      expect(planRepository.remove).toHaveBeenCalledWith(mockPlan);
    });

    it('should throw BadRequestException when trying to delete completed plan', async () => {
      const completedPlan = { ...mockPlan, status: PlanStatus.COMPLETED };
      jest.spyOn(service, 'findOne').mockResolvedValue(completedPlan as ImprovementPlan);

      await expect(service.remove(mockPlan.id, mockUser as User)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});