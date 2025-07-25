import { Test, TestingModule } from '@nestjs/testing';
import { ImprovementPlansController } from './improvement-plans.controller';
import { ImprovementPlansService } from './improvement-plans.service';
import { ImprovementActionsService } from './improvement-actions.service';
import { FollowUpActivitiesService } from './follow-up-activities.service';
import { NotificationService } from './notification.service';
import { User, UserRole } from '../entities/user.entity';
import { CreateImprovementPlanDto } from './dto/create-improvement-plan.dto';
import { UpdateImprovementPlanDto } from './dto/update-improvement-plan.dto';
import { ImprovementPlanFilterDto } from './dto/improvement-plan-filter.dto';

describe('ImprovementPlansController', () => {
  let controller: ImprovementPlansController;
  let improvementPlansService: ImprovementPlansService;
  let actionsService: ImprovementActionsService;
  let followUpService: FollowUpActivitiesService;
  let notificationService: NotificationService;

  const mockUser: Partial<User> = {
    id: 'user-1',
    username: 'teacher1',
    role: UserRole.TEACHER,
    email: 'teacher@example.com',
  };

  const mockAdminUser: Partial<User> = {
    id: 'admin-1',
    username: 'admin1',
    role: UserRole.ADMINISTRATOR,
    email: 'admin@example.com',
  };

  const mockPlan = {
    id: 'plan-1',
    sessionId: 'session-1',
    lessonTopic: 'Test Topic',
    challenges: 'Test Challenges',
    strengths: 'Test Strengths',
    notes: 'Test Notes',
    createdAt: new Date(),
  };

  const mockPaginatedResult = {
    plans: [mockPlan],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  const mockStatistics = {
    total: 10,
    pending: 3,
    inProgress: 2,
    completed: 4,
    overdue: 1,
    upcomingDeadlines: 5,
    upcomingFollowUps: 3,
  };

  const mockAction = {
    id: 'action-1',
    planId: 'plan-1',
    actionDescription: 'Test Action',
    responsiblePerson: 'Test Person',
    deadline: new Date('2025-08-01'),
    status: 'pending',
    daysUntilDeadline: 10,
  };

  const mockFollowUp = {
    id: 'followup-1',
    planId: 'plan-1',
    followUpDate: new Date('2025-08-10'),
    method: 'Classroom Observation',
    comments: 'Initial follow-up',
    status: 'scheduled',
    daysUntilFollowUp: 20,
  };

  const mockNotification = {
    id: 'notif-1',
    type: 'deadline_reminder' as const,
    recipientId: 'user-1',
    recipientEmail: 'teacher@example.com',
    title: 'Test Notification',
    message: 'Test notification message',
    scheduledDate: new Date(),
    planId: 'plan-1',
    isRead: false,
    isSent: false,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImprovementPlansController],
      providers: [
        {
          provide: ImprovementPlansService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            getStatistics: jest.fn(),
            getUpcomingDeadlines: jest.fn(),
            getOverduePlans: jest.fn(),
            findBySession: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            markActionCompleted: jest.fn(),
            addFollowUpNote: jest.fn(),
          },
        },
        {
          provide: ImprovementActionsService,
          useValue: {
            findByPlan: jest.fn(),
            getActionStatistics: jest.fn(),
            validateActionDeadlines: jest.fn(),
          },
        },
        {
          provide: FollowUpActivitiesService,
          useValue: {
            findByPlan: jest.fn(),
            markCompleted: jest.fn(),
            getFollowUpStatistics: jest.fn(),
            validateFollowUpSchedule: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            getNotificationsForUser: jest.fn(),
            getUnreadNotificationsCount: jest.fn(),
            markNotificationAsRead: jest.fn(),
            markAllNotificationsAsRead: jest.fn(),
            createCustomNotification: jest.fn(),
            getNotificationStatistics: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ImprovementPlansController>(ImprovementPlansController);
    improvementPlansService = module.get<ImprovementPlansService>(ImprovementPlansService);
    actionsService = module.get<ImprovementActionsService>(ImprovementActionsService);
    followUpService = module.get<FollowUpActivitiesService>(FollowUpActivitiesService);
    notificationService = module.get<NotificationService>(NotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new improvement plan', async () => {
      const createDto: CreateImprovementPlanDto = {
        sessionId: 'session-1',
        lessonTopic: 'Test Topic',
        challenges: 'Test Challenges',
        strengths: 'Test Strengths',
        notes: 'Test Notes',
        actions: [
          {
            actionDescription: 'Test Action',
            responsiblePerson: 'Test Person',
            deadline: '2025-08-01',
          },
        ],
        followUpActivities: [
          {
            followUpDate: '2025-08-10',
            method: 'Classroom Observation',
            comments: 'Initial follow-up',
          },
        ],
      };

      jest.spyOn(improvementPlansService, 'create').mockResolvedValue(mockPlan as any);

      const result = await controller.create(createDto, mockUser as User);

      expect(result).toEqual(mockPlan);
      expect(improvementPlansService.create).toHaveBeenCalledWith(createDto, mockUser);
    });
  });

  describe('findAll', () => {
    it('should return paginated improvement plans', async () => {
      const filterDto: ImprovementPlanFilterDto = {
        page: 1,
        limit: 10,
      };

      jest.spyOn(improvementPlansService, 'findAll').mockResolvedValue(mockPaginatedResult);

      const result = await controller.findAll(filterDto, mockUser as User);

      expect(result).toEqual(mockPaginatedResult);
      expect(improvementPlansService.findAll).toHaveBeenCalledWith(filterDto, mockUser);
    });

    it('should apply filters correctly', async () => {
      const filterDto: ImprovementPlanFilterDto = {
        teacherName: 'Test Teacher',
        subject: 'Khmer',
        showOverdueOnly: true,
        page: 1,
        limit: 20,
      };

      jest.spyOn(improvementPlansService, 'findAll').mockResolvedValue(mockPaginatedResult);

      await controller.findAll(filterDto, mockUser as User);

      expect(improvementPlansService.findAll).toHaveBeenCalledWith(filterDto, mockUser);
    });
  });

  describe('getStatistics', () => {
    it('should return improvement plan statistics', async () => {
      jest.spyOn(improvementPlansService, 'getStatistics').mockResolvedValue(mockStatistics);

      const result = await controller.getStatistics(mockUser as User);

      expect(result).toEqual(mockStatistics);
      expect(improvementPlansService.getStatistics).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getUpcomingDeadlines', () => {
    it('should return upcoming deadlines', async () => {
      const mockUpcoming = [mockPlan];
      jest
        .spyOn(improvementPlansService, 'getUpcomingDeadlines')
        .mockResolvedValue(mockUpcoming as any);

      const result = await controller.getUpcomingDeadlines(7, mockUser as User);

      expect(result).toEqual(mockUpcoming);
      expect(improvementPlansService.getUpcomingDeadlines).toHaveBeenCalledWith(mockUser, 7);
    });
  });

  describe('getOverduePlans', () => {
    it('should return overdue plans', async () => {
      const mockOverdue = [mockPlan];
      jest.spyOn(improvementPlansService, 'getOverduePlans').mockResolvedValue(mockOverdue as any);

      const result = await controller.getOverduePlans(mockUser as User);

      expect(result).toEqual(mockOverdue);
      expect(improvementPlansService.getOverduePlans).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('findBySession', () => {
    it('should return plan for a session', async () => {
      jest.spyOn(improvementPlansService, 'findBySession').mockResolvedValue(mockPlan as any);

      const result = await controller.findBySession('session-1', mockUser as User);

      expect(result).toEqual(mockPlan);
      expect(improvementPlansService.findBySession).toHaveBeenCalledWith('session-1', mockUser);
    });
  });

  describe('findOne', () => {
    it('should return a single plan', async () => {
      jest.spyOn(improvementPlansService, 'findOne').mockResolvedValue(mockPlan as any);

      const result = await controller.findOne('plan-1', mockUser as User);

      expect(result).toEqual(mockPlan);
      expect(improvementPlansService.findOne).toHaveBeenCalledWith('plan-1', mockUser);
    });
  });

  describe('update', () => {
    it('should update improvement plan', async () => {
      const updateDto: UpdateImprovementPlanDto = {
        lessonTopic: 'Updated Topic',
      };

      const updatedPlan = { ...mockPlan, ...updateDto };
      jest.spyOn(improvementPlansService, 'update').mockResolvedValue(updatedPlan as any);

      const result = await controller.update('plan-1', updateDto, mockUser as User);

      expect(result).toEqual(updatedPlan);
      expect(improvementPlansService.update).toHaveBeenCalledWith('plan-1', updateDto, mockUser);
    });
  });

  describe('remove', () => {
    it('should remove improvement plan', async () => {
      jest.spyOn(improvementPlansService, 'remove').mockResolvedValue(undefined);

      await controller.remove('plan-1', mockAdminUser as User);

      expect(improvementPlansService.remove).toHaveBeenCalledWith('plan-1', mockAdminUser);
    });
  });

  describe('markActionCompleted', () => {
    it('should mark action as completed', async () => {
      jest.spyOn(improvementPlansService, 'markActionCompleted').mockResolvedValue(undefined);

      const result = await controller.markActionCompleted('plan-1', 'action-1', mockUser as User);

      expect(result).toEqual({ message: 'Action marked as completed' });
      expect(improvementPlansService.markActionCompleted).toHaveBeenCalledWith(
        'plan-1',
        'action-1',
        mockUser,
      );
    });
  });

  describe('getPlanActions', () => {
    it('should return actions for a plan', async () => {
      jest.spyOn(actionsService, 'findByPlan').mockResolvedValue([mockAction as any]);

      const result = await controller.getPlanActions('plan-1');

      expect(result).toEqual([mockAction]);
      expect(actionsService.findByPlan).toHaveBeenCalledWith('plan-1');
    });
  });

  describe('addFollowUpNote', () => {
    it('should add note to follow-up', async () => {
      jest.spyOn(improvementPlansService, 'addFollowUpNote').mockResolvedValue(undefined);

      const result = await controller.addFollowUpNote(
        'plan-1',
        'followup-1',
        'Test note',
        mockUser as User,
      );

      expect(result).toEqual({ message: 'Note added successfully' });
      expect(improvementPlansService.addFollowUpNote).toHaveBeenCalledWith(
        'plan-1',
        'followup-1',
        'Test note',
        mockUser,
      );
    });
  });

  describe('getPlanFollowUps', () => {
    it('should return follow-ups for a plan', async () => {
      jest.spyOn(followUpService, 'findByPlan').mockResolvedValue([mockFollowUp as any]);

      const result = await controller.getPlanFollowUps('plan-1');

      expect(result).toEqual([mockFollowUp]);
      expect(followUpService.findByPlan).toHaveBeenCalledWith('plan-1');
    });
  });

  describe('markFollowUpCompleted', () => {
    it('should mark follow-up as completed', async () => {
      jest.spyOn(followUpService, 'markCompleted').mockResolvedValue(mockFollowUp as any);

      const result = await controller.markFollowUpCompleted('followup-1', 'Completion note');

      expect(result).toEqual({ message: 'Follow-up marked as completed' });
      expect(followUpService.markCompleted).toHaveBeenCalledWith('followup-1', 'Completion note');
    });
  });

  describe('getMyNotifications', () => {
    it('should return notifications for current user', async () => {
      jest
        .spyOn(notificationService, 'getNotificationsForUser')
        .mockResolvedValue([mockNotification]);

      const result = await controller.getMyNotifications(mockUser as User);

      expect(result).toEqual([mockNotification]);
      expect(notificationService.getNotificationsForUser).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getUnreadNotificationsCount', () => {
    it('should return unread notifications count', async () => {
      jest.spyOn(notificationService, 'getUnreadNotificationsCount').mockResolvedValue(5);

      const result = await controller.getUnreadNotificationsCount(mockUser as User);

      expect(result).toEqual({ count: 5 });
      expect(notificationService.getUnreadNotificationsCount).toHaveBeenCalledWith('user-1');
    });
  });

  describe('markNotificationAsRead', () => {
    it('should mark notification as read', async () => {
      jest.spyOn(notificationService, 'markNotificationAsRead').mockResolvedValue(undefined);

      const result = await controller.markNotificationAsRead('notif-1');

      expect(result).toEqual({ message: 'Notification marked as read' });
      expect(notificationService.markNotificationAsRead).toHaveBeenCalledWith('notif-1');
    });
  });

  describe('markAllNotificationsAsRead', () => {
    it('should mark all notifications as read', async () => {
      jest.spyOn(notificationService, 'markAllNotificationsAsRead').mockResolvedValue(undefined);

      const result = await controller.markAllNotificationsAsRead(mockUser as User);

      expect(result).toEqual({ message: 'All notifications marked as read' });
      expect(notificationService.markAllNotificationsAsRead).toHaveBeenCalledWith('user-1');
    });
  });

  describe('createCustomNotification', () => {
    it('should create custom notification', async () => {
      jest
        .spyOn(notificationService, 'createCustomNotification')
        .mockResolvedValue(mockNotification);

      const result = await controller.createCustomNotification(
        'user-1',
        'Custom Title',
        'Custom Message',
        'plan-1',
      );

      expect(result).toEqual(mockNotification);
      expect(notificationService.createCustomNotification).toHaveBeenCalledWith(
        'user-1',
        'Custom Title',
        'Custom Message',
        'plan-1',
      );
    });
  });

  describe('getActionStatistics', () => {
    it('should return action statistics', async () => {
      const mockActionStats = {
        total: 100,
        pending: 40,
        inProgress: 30,
        completed: 20,
        overdue: 10,
      };

      jest.spyOn(actionsService, 'getActionStatistics').mockResolvedValue(mockActionStats);

      const result = await controller.getActionStatistics();

      expect(result).toEqual(mockActionStats);
      expect(actionsService.getActionStatistics).toHaveBeenCalled();
    });
  });

  describe('getFollowUpStatistics', () => {
    it('should return follow-up statistics', async () => {
      const mockFollowUpStats = {
        total: 50,
        scheduled: 30,
        completed: 15,
        overdue: 5,
        byMethod: {
          'Classroom Observation': 20,
          Meeting: 15,
          'Phone Call': 15,
        },
      };

      jest.spyOn(followUpService, 'getFollowUpStatistics').mockResolvedValue(mockFollowUpStats);

      const result = await controller.getFollowUpStatistics();

      expect(result).toEqual(mockFollowUpStats);
      expect(followUpService.getFollowUpStatistics).toHaveBeenCalled();
    });
  });

  describe('getNotificationStatistics', () => {
    it('should return notification statistics', async () => {
      const mockNotificationStats = {
        total: 200,
        sent: 150,
        pending: 30,
        overdue: 20,
        byType: {
          deadline_reminder: 100,
          followup_reminder: 50,
          overdue_alert: 50,
        },
      };

      jest
        .spyOn(notificationService, 'getNotificationStatistics')
        .mockResolvedValue(mockNotificationStats);

      const result = await controller.getNotificationStatistics();

      expect(result).toEqual(mockNotificationStats);
      expect(notificationService.getNotificationStatistics).toHaveBeenCalled();
    });
  });

  describe('validatePlan', () => {
    it('should validate improvement plan', async () => {
      const mockActionValidation = {
        isValid: true,
        warnings: ['Action deadline approaching'],
      };

      const mockFollowUpValidation = {
        isValid: false,
        warnings: ['Follow-up overdue'],
      };

      jest
        .spyOn(actionsService, 'validateActionDeadlines')
        .mockResolvedValue(mockActionValidation);
      jest
        .spyOn(followUpService, 'validateFollowUpSchedule')
        .mockResolvedValue(mockFollowUpValidation);

      const result = await controller.validatePlan('plan-1');

      expect(result).toEqual({
        actions: mockActionValidation,
        followUps: mockFollowUpValidation,
        overall: {
          isValid: false,
          warnings: ['Action deadline approaching', 'Follow-up overdue'],
        },
      });
      expect(actionsService.validateActionDeadlines).toHaveBeenCalledWith('plan-1');
      expect(followUpService.validateFollowUpSchedule).toHaveBeenCalledWith('plan-1');
    });
  });
});