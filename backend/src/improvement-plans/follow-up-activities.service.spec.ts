import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { FollowUpActivitiesService, FollowUpStatus } from './follow-up-activities.service';
import { FollowUpActivity } from '../entities/follow-up-activity.entity';
import { CreateFollowUpActivityDto } from './dto/create-improvement-plan.dto';

describe('FollowUpActivitiesService', () => {
  let service: FollowUpActivitiesService;
  let followUpRepository: Repository<FollowUpActivity>;

  const mockFollowUp = {
    id: 'followup-1',
    planId: 'plan-1',
    followUpDate: new Date('2025-08-10'),
    method: 'Classroom Observation',
    comments: 'Initial follow-up',
    plan: {
      id: 'plan-1',
      session: { id: 'session-1' },
    },
  };

  const mockCreateFollowUpDto: CreateFollowUpActivityDto = {
    followUpDate: '2025-08-15',
    method: 'Meeting',
    comments: 'Discuss progress',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowUpActivitiesService,
        {
          provide: getRepositoryToken(FollowUpActivity),
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

    service = module.get<FollowUpActivitiesService>(FollowUpActivitiesService);
    followUpRepository = module.get<Repository<FollowUpActivity>>(
      getRepositoryToken(FollowUpActivity),
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
    it('should create a new follow-up activity', async () => {
      jest.spyOn(followUpRepository, 'create').mockReturnValue(mockFollowUp as FollowUpActivity);
      jest.spyOn(followUpRepository, 'save').mockResolvedValue(mockFollowUp as FollowUpActivity);

      const result = await service.create('plan-1', mockCreateFollowUpDto);

      expect(result).toEqual(mockFollowUp);
      expect(followUpRepository.create).toHaveBeenCalledWith({
        planId: 'plan-1',
        followUpDate: new Date(mockCreateFollowUpDto.followUpDate),
        method: mockCreateFollowUpDto.method,
        comments: mockCreateFollowUpDto.comments,
      });
      expect(followUpRepository.save).toHaveBeenCalledWith(mockFollowUp);
    });
  });

  describe('createMultiple', () => {
    it('should create multiple follow-up activities', async () => {
      const followUpDtos: CreateFollowUpActivityDto[] = [
        mockCreateFollowUpDto,
        {
          followUpDate: '2025-08-20',
          method: 'Phone Call',
          comments: 'Check-in call',
        },
      ];

      jest
        .spyOn(service, 'create')
        .mockResolvedValueOnce(mockFollowUp as FollowUpActivity)
        .mockResolvedValueOnce({ ...mockFollowUp, id: 'followup-2' } as FollowUpActivity);

      const result = await service.createMultiple('plan-1', followUpDtos);

      expect(result).toHaveLength(2);
      expect(service.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateMultiple', () => {
    it('should delete existing follow-ups and create new ones', async () => {
      const followUpDtos: CreateFollowUpActivityDto[] = [mockCreateFollowUpDto];

      jest.spyOn(followUpRepository, 'delete').mockResolvedValue(undefined as any);
      jest
        .spyOn(service, 'createMultiple')
        .mockResolvedValue([mockFollowUp as FollowUpActivity]);

      const result = await service.updateMultiple('plan-1', followUpDtos);

      expect(followUpRepository.delete).toHaveBeenCalledWith({ planId: 'plan-1' });
      expect(service.createMultiple).toHaveBeenCalledWith('plan-1', followUpDtos);
      expect(result).toEqual([mockFollowUp]);
    });
  });

  describe('findByPlan', () => {
    it('should return follow-ups with status for a plan', async () => {
      const overdueFollowUp = {
        ...mockFollowUp,
        id: 'followup-1',
        followUpDate: new Date('2025-01-01'), // Past date
        comments: 'Not completed',
      };

      const scheduledFollowUp = {
        ...mockFollowUp,
        id: 'followup-2',
        followUpDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      };

      const completedFollowUp = {
        ...mockFollowUp,
        id: 'followup-3',
        followUpDate: new Date('2025-01-15'),
        comments: '[2025-01-15] COMPLETED: Follow-up done',
      };

      jest
        .spyOn(followUpRepository, 'find')
        .mockResolvedValue([
          overdueFollowUp,
          scheduledFollowUp,
          completedFollowUp,
        ] as FollowUpActivity[]);

      const result = await service.findByPlan('plan-1');

      expect(result).toHaveLength(3);
      expect(result[0].status).toBe(FollowUpStatus.OVERDUE);
      expect(result[0].daysUntilFollowUp).toBeLessThan(0);
      expect(result[1].status).toBe(FollowUpStatus.SCHEDULED);
      expect(result[1].daysUntilFollowUp).toBeGreaterThan(0);
      expect(result[2].status).toBe(FollowUpStatus.COMPLETED);
    });
  });

  describe('findOne', () => {
    it('should return a follow-up by ID', async () => {
      jest.spyOn(followUpRepository, 'findOne').mockResolvedValue(mockFollowUp as FollowUpActivity);

      const result = await service.findOne('followup-1');

      expect(result).toEqual(mockFollowUp);
      expect(followUpRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'followup-1' },
        relations: ['plan', 'plan.session'],
      });
    });

    it('should throw NotFoundException when follow-up not found', async () => {
      jest.spyOn(followUpRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a follow-up activity', async () => {
      const updateData = {
        method: 'Updated Method',
        comments: 'Updated comments',
      };

      const updatedFollowUp = { ...mockFollowUp, ...updateData };

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(mockFollowUp as FollowUpActivity)
        .mockResolvedValueOnce(updatedFollowUp as FollowUpActivity);
      jest.spyOn(followUpRepository, 'update').mockResolvedValue(undefined as any);

      const result = await service.update('followup-1', updateData);

      expect(result).toEqual(updatedFollowUp);
      expect(followUpRepository.update).toHaveBeenCalledWith('followup-1', {
        followUpDate: undefined,
        method: updateData.method,
        comments: updateData.comments,
      });
    });

    it('should update follow-up date when provided', async () => {
      const updateData = {
        followUpDate: '2025-09-01',
      };

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(mockFollowUp as FollowUpActivity)
        .mockResolvedValueOnce(mockFollowUp as FollowUpActivity);
      jest.spyOn(followUpRepository, 'update').mockResolvedValue(undefined as any);

      await service.update('followup-1', updateData);

      expect(followUpRepository.update).toHaveBeenCalledWith('followup-1', {
        followUpDate: new Date(updateData.followUpDate),
        method: undefined,
        comments: undefined,
      });
    });
  });

  describe('addNote', () => {
    it('should add a note to follow-up comments', async () => {
      const mockDate = new Date('2025-07-20');
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);

      jest.spyOn(service, 'findOne')
        .mockResolvedValueOnce(mockFollowUp as FollowUpActivity)
        .mockResolvedValueOnce({
          ...mockFollowUp,
          comments: 'Initial follow-up\n\n[2025-07-20] New note added',
        } as FollowUpActivity);
      jest.spyOn(followUpRepository, 'update').mockResolvedValue(undefined as any);

      const result = await service.addNote('followup-1', 'New note added');

      expect(followUpRepository.update).toHaveBeenCalledWith('followup-1', {
        comments: 'Initial follow-up\n\n[2025-07-20] New note added',
      });
      expect(result.comments).toContain('[2025-07-20] New note added');
    });

    it('should create initial note when no comments exist', async () => {
      const mockDate = new Date('2025-07-20');
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);

      const followUpWithoutComments = { ...mockFollowUp, comments: null };

      jest.spyOn(service, 'findOne')
        .mockResolvedValueOnce(followUpWithoutComments as FollowUpActivity)
        .mockResolvedValueOnce({
          ...followUpWithoutComments,
          comments: '[2025-07-20] First note',
        } as FollowUpActivity);
      jest.spyOn(followUpRepository, 'update').mockResolvedValue(undefined as any);

      const result = await service.addNote('followup-1', 'First note');

      expect(followUpRepository.update).toHaveBeenCalledWith('followup-1', {
        comments: '[2025-07-20] First note',
      });
    });
  });

  describe('markCompleted', () => {
    it('should mark follow-up as completed with note', async () => {
      const mockDate = new Date('2025-07-20');
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);

      jest.spyOn(service, 'findOne')
        .mockResolvedValueOnce(mockFollowUp as FollowUpActivity)
        .mockResolvedValueOnce({
          ...mockFollowUp,
          comments: 'Initial follow-up\n\n[2025-07-20] COMPLETED: Successfully completed',
        } as FollowUpActivity);
      jest.spyOn(followUpRepository, 'update').mockResolvedValue(undefined as any);

      const result = await service.markCompleted('followup-1', 'Successfully completed');

      expect(followUpRepository.update).toHaveBeenCalledWith('followup-1', {
        comments: 'Initial follow-up\n\n[2025-07-20] COMPLETED: Successfully completed',
      });
      expect(result.comments).toContain('COMPLETED: Successfully completed');
    });

    it('should mark completed without note', async () => {
      const mockDate = new Date('2025-07-20');
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);

      jest.spyOn(service, 'findOne')
        .mockResolvedValueOnce(mockFollowUp as FollowUpActivity)
        .mockResolvedValueOnce({
          ...mockFollowUp,
          comments: 'Initial follow-up\n\n[2025-07-20] COMPLETED',
        } as FollowUpActivity);
      jest.spyOn(followUpRepository, 'update').mockResolvedValue(undefined as any);

      const result = await service.markCompleted('followup-1');

      expect(result.comments).toContain('[2025-07-20] COMPLETED');
    });
  });

  describe('remove', () => {
    it('should remove a follow-up activity', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockFollowUp as FollowUpActivity);
      jest.spyOn(followUpRepository, 'remove').mockResolvedValue(mockFollowUp as FollowUpActivity);

      await service.remove('followup-1');

      expect(followUpRepository.remove).toHaveBeenCalledWith(mockFollowUp);
    });
  });

  describe('getUpcomingFollowUps', () => {
    it('should return upcoming follow-ups within specified days', async () => {
      const upcomingFollowUp = {
        ...mockFollowUp,
        followUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      };

      jest
        .spyOn(followUpRepository, 'find')
        .mockResolvedValue([upcomingFollowUp as FollowUpActivity]);

      const result = await service.getUpcomingFollowUps(7);

      expect(result).toHaveLength(1);
      expect(followUpRepository.find).toHaveBeenCalledWith({
        where: {
          followUpDate: expect.objectContaining({
            $gte: expect.any(Date),
            $lte: expect.any(Date),
          }),
        },
        relations: ['plan', 'plan.session'],
        order: { followUpDate: 'ASC' },
      });
    });
  });

  describe('getOverdueFollowUps', () => {
    it('should return overdue follow-ups excluding completed ones', async () => {
      const overdueNotCompleted = {
        ...mockFollowUp,
        id: 'followup-1',
        followUpDate: new Date('2025-01-01'),
        comments: 'Not completed',
      };

      const overdueCompleted = {
        ...mockFollowUp,
        id: 'followup-2',
        followUpDate: new Date('2025-01-01'),
        comments: '[2025-01-15] COMPLETED',
      };

      jest
        .spyOn(followUpRepository, 'find')
        .mockResolvedValue([overdueNotCompleted, overdueCompleted] as FollowUpActivity[]);

      const result = await service.getOverdueFollowUps();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('followup-1');
      expect(result[0].status).toBe(FollowUpStatus.OVERDUE);
    });
  });

  describe('getFollowUpsByMethod', () => {
    it('should return follow-ups for a specific method', async () => {
      jest.spyOn(followUpRepository, 'find').mockResolvedValue([mockFollowUp as FollowUpActivity]);

      const result = await service.getFollowUpsByMethod('Classroom Observation');

      expect(result).toHaveLength(1);
      expect(result[0].method).toBe('Classroom Observation');
      expect(followUpRepository.find).toHaveBeenCalledWith({
        where: { method: 'Classroom Observation' },
        relations: ['plan', 'plan.session'],
        order: { followUpDate: 'ASC' },
      });
    });
  });

  describe('getFollowUpStatistics', () => {
    it('should return follow-up statistics', async () => {
      const followUps = [
        { ...mockFollowUp, method: 'Meeting', comments: 'Not completed' },
        { ...mockFollowUp, method: 'Observation', comments: '[2025-01-15] COMPLETED' },
        { ...mockFollowUp, method: 'Meeting', comments: 'Another meeting' },
      ];

      jest
        .spyOn(followUpRepository, 'count')
        .mockResolvedValueOnce(3) // total
        .mockResolvedValueOnce(1); // overdue
      jest.spyOn(followUpRepository, 'find').mockResolvedValue(followUps as FollowUpActivity[]);

      const result = await service.getFollowUpStatistics();

      expect(result).toEqual({
        total: 3,
        scheduled: 2,
        completed: 1,
        overdue: 0, // 1 overdue - 1 completed = 0
        byMethod: {
          Meeting: 2,
          Observation: 1,
        },
      });
    });
  });

  describe('scheduleRecurringFollowUp', () => {
    it('should create recurring follow-ups', async () => {
      const baseFollowUpDto: CreateFollowUpActivityDto = {
        followUpDate: '2025-08-01',
        method: 'Weekly Check-in',
        comments: 'Regular follow-up',
      };

      jest.spyOn(service, 'create').mockImplementation(async (planId, dto) => ({
        id: `followup-${dto.followUpDate}`,
        planId,
        followUpDate: new Date(dto.followUpDate),
        method: dto.method,
        comments: dto.comments,
      } as FollowUpActivity));

      const result = await service.scheduleRecurringFollowUp('plan-1', baseFollowUpDto, 7, 3);

      expect(result).toHaveLength(3);
      expect(service.create).toHaveBeenCalledTimes(3);
      expect(result[0].comments).toContain('(Occurrence 1/3)');
      expect(result[1].comments).toContain('(Occurrence 2/3)');
      expect(result[2].comments).toContain('(Occurrence 3/3)');
    });
  });

  describe('validateFollowUpSchedule', () => {
    it('should validate follow-up schedule successfully', async () => {
      const futureFollowUp = {
        ...mockFollowUp,
        followUpDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      };

      jest.spyOn(service, 'findByPlan').mockResolvedValue([
        {
          ...futureFollowUp,
          status: FollowUpStatus.SCHEDULED,
          daysUntilFollowUp: 10,
        } as any,
      ]);

      const result = await service.validateFollowUpSchedule('plan-1');

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should return warnings for overdue follow-ups', async () => {
      const overdueFollowUp = {
        ...mockFollowUp,
        followUpDate: new Date('2025-01-01'),
        method: 'Overdue Meeting',
      };

      jest.spyOn(service, 'findByPlan').mockResolvedValue([
        {
          ...overdueFollowUp,
          status: FollowUpStatus.OVERDUE,
          daysUntilFollowUp: -100,
        } as any,
      ]);

      const result = await service.validateFollowUpSchedule('plan-1');

      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain('Follow-up "Overdue Meeting" is overdue');
    });

    it('should warn about scheduling conflicts', async () => {
      const sameDate = new Date('2025-08-15');
      const followUps = [
        {
          ...mockFollowUp,
          id: 'followup-1',
          followUpDate: sameDate,
          method: 'Meeting',
          status: FollowUpStatus.SCHEDULED,
        },
        {
          ...mockFollowUp,
          id: 'followup-2',
          followUpDate: sameDate,
          method: 'Meeting',
          status: FollowUpStatus.SCHEDULED,
        },
      ];

      jest.spyOn(service, 'findByPlan').mockResolvedValue(followUps as any);

      const result = await service.validateFollowUpSchedule('plan-1');

      expect(result.warnings).toContain(
        expect.stringContaining('Multiple follow-ups scheduled for the same date and method'),
      );
    });
  });
});