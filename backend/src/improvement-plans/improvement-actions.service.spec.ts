import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ImprovementActionsService, ActionStatus } from './improvement-actions.service';
import { ImprovementAction } from '../entities/improvement-action.entity';
import { CreateImprovementActionDto } from './dto/create-improvement-plan.dto';

describe('ImprovementActionsService', () => {
  let service: ImprovementActionsService;
  let actionRepository: Repository<ImprovementAction>;

  const mockAction = {
    id: 'action-1',
    planId: 'plan-1',
    actionDescription: 'Test Action',
    responsiblePerson: 'Test Person',
    deadline: new Date('2025-08-01'),
    plan: {
      id: 'plan-1',
      session: { id: 'session-1' },
    },
  };

  const mockCreateActionDto: CreateImprovementActionDto = {
    actionDescription: 'New Test Action',
    responsiblePerson: 'New Test Person',
    deadline: '2025-08-15',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImprovementActionsService,
        {
          provide: getRepositoryToken(ImprovementAction),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            remove: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ImprovementActionsService>(ImprovementActionsService);
    actionRepository = module.get<Repository<ImprovementAction>>(
      getRepositoryToken(ImprovementAction),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new improvement action', async () => {
      jest.spyOn(actionRepository, 'create').mockReturnValue(mockAction as ImprovementAction);
      jest.spyOn(actionRepository, 'save').mockResolvedValue(mockAction as ImprovementAction);

      const result = await service.create('plan-1', mockCreateActionDto);

      expect(result).toEqual(mockAction);
      expect(actionRepository.create).toHaveBeenCalledWith({
        planId: 'plan-1',
        actionDescription: mockCreateActionDto.actionDescription,
        responsiblePerson: mockCreateActionDto.responsiblePerson,
        deadline: new Date(mockCreateActionDto.deadline),
      });
      expect(actionRepository.save).toHaveBeenCalledWith(mockAction);
    });
  });

  describe('createMultiple', () => {
    it('should create multiple improvement actions', async () => {
      const actionDtos: CreateImprovementActionDto[] = [
        mockCreateActionDto,
        {
          actionDescription: 'Second Action',
          responsiblePerson: 'Second Person',
          deadline: '2025-08-20',
        },
      ];

      jest
        .spyOn(service, 'create')
        .mockResolvedValueOnce(mockAction as ImprovementAction)
        .mockResolvedValueOnce({ ...mockAction, id: 'action-2' } as ImprovementAction);

      const result = await service.createMultiple('plan-1', actionDtos);

      expect(result).toHaveLength(2);
      expect(service.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateMultiple', () => {
    it('should delete existing actions and create new ones', async () => {
      const actionDtos: CreateImprovementActionDto[] = [mockCreateActionDto];

      jest.spyOn(actionRepository, 'delete').mockResolvedValue(undefined as any);
      jest.spyOn(service, 'createMultiple').mockResolvedValue([mockAction as ImprovementAction]);

      const result = await service.updateMultiple('plan-1', actionDtos);

      expect(actionRepository.delete).toHaveBeenCalledWith({ planId: 'plan-1' });
      expect(service.createMultiple).toHaveBeenCalledWith('plan-1', actionDtos);
      expect(result).toEqual([mockAction]);
    });
  });

  describe('findByPlan', () => {
    it('should return actions with status for a plan', async () => {
      const pastDueAction = {
        ...mockAction,
        id: 'action-1',
        deadline: new Date('2025-01-01'), // Past date
      };

      const upcomingAction = {
        ...mockAction,
        id: 'action-2',
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      };

      const futureAction = {
        ...mockAction,
        id: 'action-3',
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      };

      jest
        .spyOn(actionRepository, 'find')
        .mockResolvedValue([pastDueAction, upcomingAction, futureAction] as ImprovementAction[]);

      const result = await service.findByPlan('plan-1');

      expect(result).toHaveLength(3);
      expect(result[0].status).toBe(ActionStatus.OVERDUE);
      expect(result[0].daysUntilDeadline).toBeLessThan(0);
      expect(result[1].status).toBe(ActionStatus.IN_PROGRESS);
      expect(result[1].daysUntilDeadline).toBeLessThanOrEqual(3);
      expect(result[2].status).toBe(ActionStatus.PENDING);
      expect(result[2].daysUntilDeadline).toBeGreaterThan(3);
    });
  });

  describe('findOne', () => {
    it('should return an action by ID', async () => {
      jest.spyOn(actionRepository, 'findOne').mockResolvedValue(mockAction as ImprovementAction);

      const result = await service.findOne('action-1');

      expect(result).toEqual(mockAction);
      expect(actionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'action-1' },
        relations: ['plan', 'plan.session'],
      });
    });

    it('should throw NotFoundException when action not found', async () => {
      jest.spyOn(actionRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an action', async () => {
      const updateData = {
        actionDescription: 'Updated Action',
        responsiblePerson: 'Updated Person',
      };

      const updatedAction = { ...mockAction, ...updateData };

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(mockAction as ImprovementAction)
        .mockResolvedValueOnce(updatedAction as ImprovementAction);
      jest.spyOn(actionRepository, 'update').mockResolvedValue(undefined as any);

      const result = await service.update('action-1', updateData);

      expect(result).toEqual(updatedAction);
      expect(actionRepository.update).toHaveBeenCalledWith('action-1', {
        actionDescription: updateData.actionDescription,
        responsiblePerson: updateData.responsiblePerson,
        deadline: undefined,
      });
    });

    it('should update deadline when provided', async () => {
      const updateData = {
        deadline: '2025-09-01',
      };

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(mockAction as ImprovementAction)
        .mockResolvedValueOnce(mockAction as ImprovementAction);
      jest.spyOn(actionRepository, 'update').mockResolvedValue(undefined as any);

      await service.update('action-1', updateData);

      expect(actionRepository.update).toHaveBeenCalledWith('action-1', {
        actionDescription: undefined,
        responsiblePerson: undefined,
        deadline: new Date(updateData.deadline),
      });
    });
  });

  describe('markCompleted', () => {
    it('should mark action as completed', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockAction as ImprovementAction);

      const result = await service.markCompleted('action-1');

      expect(result).toEqual(mockAction);
      expect(service.findOne).toHaveBeenCalledWith('action-1');
    });
  });

  describe('remove', () => {
    it('should remove an action', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockAction as ImprovementAction);
      jest.spyOn(actionRepository, 'remove').mockResolvedValue(mockAction as ImprovementAction);

      await service.remove('action-1');

      expect(actionRepository.remove).toHaveBeenCalledWith(mockAction);
    });
  });

  describe('getActionsByResponsiblePerson', () => {
    it('should return actions for a responsible person', async () => {
      jest.spyOn(actionRepository, 'find').mockResolvedValue([mockAction as ImprovementAction]);

      const result = await service.getActionsByResponsiblePerson('Test Person');

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('status');
      expect(result[0]).toHaveProperty('daysUntilDeadline');
      expect(actionRepository.find).toHaveBeenCalledWith({
        where: { responsiblePerson: 'Test Person' },
        relations: ['plan', 'plan.session'],
        order: { deadline: 'ASC' },
      });
    });
  });

  describe('getOverdueActions', () => {
    it('should return overdue actions', async () => {
      const overdueAction = {
        ...mockAction,
        deadline: new Date('2025-01-01'), // Past date
      };

      jest.spyOn(actionRepository, 'find').mockResolvedValue([overdueAction as ImprovementAction]);

      const result = await service.getOverdueActions();

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(ActionStatus.OVERDUE);
      expect(actionRepository.find).toHaveBeenCalledWith({
        where: {
          deadline: expect.objectContaining({ $lt: expect.any(Date) }),
        },
        relations: ['plan', 'plan.session'],
        order: { deadline: 'ASC' },
      });
    });
  });

  describe('getUpcomingActions', () => {
    it('should return upcoming actions within specified days', async () => {
      const upcomingAction = {
        ...mockAction,
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      };

      jest
        .spyOn(actionRepository, 'find')
        .mockResolvedValue([upcomingAction as ImprovementAction]);

      const result = await service.getUpcomingActions(7);

      expect(result).toHaveLength(1);
      expect(actionRepository.find).toHaveBeenCalledWith({
        where: {
          deadline: expect.objectContaining({
            $gte: expect.any(Date),
            $lte: expect.any(Date),
          }),
        },
        relations: ['plan', 'plan.session'],
        order: { deadline: 'ASC' },
      });
    });
  });

  describe('getActionStatistics', () => {
    it('should return action statistics', async () => {
      jest
        .spyOn(actionRepository, 'count')
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(10); // overdue

      const result = await service.getActionStatistics();

      expect(result).toEqual({
        total: 100,
        pending: 40,
        inProgress: 30,
        completed: 20,
        overdue: 10,
      });
    });
  });

  describe('validateActionDeadlines', () => {
    it('should validate action deadlines successfully', async () => {
      const futureAction = {
        ...mockAction,
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      };

      jest.spyOn(service, 'findByPlan').mockResolvedValue([
        {
          ...futureAction,
          status: ActionStatus.PENDING,
          daysUntilDeadline: 10,
        } as any,
      ]);

      const result = await service.validateActionDeadlines('plan-1');

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should return warnings for past deadlines', async () => {
      const pastAction = {
        ...mockAction,
        deadline: new Date('2025-01-01'),
        actionDescription: 'Overdue Action',
      };

      jest.spyOn(service, 'findByPlan').mockResolvedValue([
        {
          ...pastAction,
          status: ActionStatus.OVERDUE,
          daysUntilDeadline: -100,
        } as any,
      ]);

      const result = await service.validateActionDeadlines('plan-1');

      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain('Action "Overdue Action" has passed its deadline');
    });

    it('should return warnings for approaching deadlines', async () => {
      const soonAction = {
        ...mockAction,
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        actionDescription: 'Urgent Action',
      };

      jest.spyOn(service, 'findByPlan').mockResolvedValue([
        {
          ...soonAction,
          status: ActionStatus.IN_PROGRESS,
          daysUntilDeadline: 2,
        } as any,
      ]);

      const result = await service.validateActionDeadlines('plan-1');

      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain('Action "Urgent Action" is due in 2 days');
    });

    it('should warn about multiple actions with same deadline', async () => {
      const sameDate = new Date('2025-08-15');
      const actions = [
        {
          ...mockAction,
          id: 'action-1',
          deadline: sameDate,
          status: ActionStatus.PENDING,
          daysUntilDeadline: 10,
        },
        {
          ...mockAction,
          id: 'action-2',
          deadline: sameDate,
          status: ActionStatus.PENDING,
          daysUntilDeadline: 10,
        },
      ];

      jest.spyOn(service, 'findByPlan').mockResolvedValue(actions as any);

      const result = await service.validateActionDeadlines('plan-1');

      expect(result.warnings).toContain('Multiple actions have the same deadline date');
    });
  });
});