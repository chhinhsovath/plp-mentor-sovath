import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService, NotificationData } from './notification.service';
import { ImprovementPlan } from '../entities/improvement-plan.entity';
import { User } from '../entities/user.entity';

describe('NotificationService', () => {
  let service: NotificationService;
  let planRepository: Repository<ImprovementPlan>;
  let userRepository: Repository<User>;

  const mockUser = {
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com',
  };

  const mockPlan = {
    id: 'plan-1',
    session: {
      observerId: 'user-1',
      observer: mockUser,
    },
    actions: [
      {
        id: 'action-1',
        actionDescription: 'Test Action 1',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
      {
        id: 'action-2',
        actionDescription: 'Test Action 2',
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      },
    ],
    followUpActivities: [
      {
        id: 'followup-1',
        method: 'Classroom Visit',
        followUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getRepositoryToken(ImprovementPlan),
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
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    planRepository = module.get<Repository<ImprovementPlan>>(
      getRepositoryToken(ImprovementPlan),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));

    // Clear notifications before each test
    service['notifications'].clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('scheduleNotifications', () => {
    it('should schedule notifications for plan actions and follow-ups', async () => {
      jest.spyOn(planRepository, 'findOne').mockResolvedValue(mockPlan as any);

      await service.scheduleNotifications('plan-1');

      const notifications = service['notifications'].get('plan-1');
      expect(notifications).toBeDefined();
      expect(notifications?.length).toBeGreaterThan(0);

      // Should have reminder and overdue notifications for each action
      const actionNotifications = notifications?.filter((n) => n.actionId);
      expect(actionNotifications?.length).toBe(4); // 2 actions * 2 notifications each

      // Should have reminder notifications for follow-ups
      const followUpNotifications = notifications?.filter((n) => n.followUpId);
      expect(followUpNotifications?.length).toBe(1);
    });

    it('should not schedule past reminder dates', async () => {
      const planWithPastDeadline = {
        ...mockPlan,
        actions: [
          {
            id: 'action-past',
            actionDescription: 'Past Action',
            deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
          },
        ],
      };

      jest.spyOn(planRepository, 'findOne').mockResolvedValue(planWithPastDeadline as any);

      await service.scheduleNotifications('plan-1');

      const notifications = service['notifications'].get('plan-1');
      const reminderNotifications = notifications?.filter((n) => n.type === 'deadline_reminder');

      // Should not schedule reminder (would be -1 days from now)
      expect(reminderNotifications?.length).toBe(0);
    });

    it('should handle plan not found', async () => {
      jest.spyOn(planRepository, 'findOne').mockResolvedValue(null);
      const loggerSpy = jest.spyOn(service['logger'], 'warn');

      await service.scheduleNotifications('non-existent');

      expect(loggerSpy).toHaveBeenCalledWith(
        'Plan with ID non-existent not found for notification scheduling',
      );
      expect(service['notifications'].has('non-existent')).toBe(false);
    });
  });

  describe('cancelNotifications', () => {
    it('should cancel all notifications for a plan', async () => {
      // First schedule some notifications
      jest.spyOn(planRepository, 'findOne').mockResolvedValue(mockPlan as any);
      await service.scheduleNotifications('plan-1');

      expect(service['notifications'].has('plan-1')).toBe(true);

      // Cancel notifications
      await service.cancelNotifications('plan-1');

      expect(service['notifications'].has('plan-1')).toBe(false);
    });
  });

  describe('getNotificationsForUser', () => {
    it('should return all notifications for a specific user', async () => {
      // Schedule notifications for multiple plans
      jest.spyOn(planRepository, 'findOne').mockResolvedValue(mockPlan as any);
      await service.scheduleNotifications('plan-1');
      await service.scheduleNotifications('plan-2');

      const userNotifications = await service.getNotificationsForUser('user-1');

      expect(userNotifications.length).toBeGreaterThan(0);
      expect(userNotifications.every((n) => n.recipientId === 'user-1')).toBe(true);
    });

    it('should return notifications sorted by creation date', async () => {
      const mockDate = new Date('2025-07-20');
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);

      // Create notifications with different creation times
      const notification1: NotificationData = {
        id: 'notif-1',
        type: 'deadline_reminder',
        recipientId: 'user-1',
        recipientEmail: 'test@example.com',
        title: 'First',
        message: 'First notification',
        scheduledDate: new Date(),
        planId: 'plan-1',
        isRead: false,
        isSent: false,
        createdAt: new Date('2025-07-19'),
      };

      const notification2: NotificationData = {
        ...notification1,
        id: 'notif-2',
        title: 'Second',
        createdAt: new Date('2025-07-20'),
      };

      service['notifications'].set('plan-1', [notification1, notification2]);

      const result = await service.getNotificationsForUser('user-1');

      expect(result[0].title).toBe('Second');
      expect(result[1].title).toBe('First');
    });
  });

  describe('getUnreadNotificationsCount', () => {
    it('should return count of unread notifications', async () => {
      const notifications: NotificationData[] = [
        {
          id: 'notif-1',
          type: 'deadline_reminder',
          recipientId: 'user-1',
          recipientEmail: 'test@example.com',
          title: 'Unread',
          message: 'Unread notification',
          scheduledDate: new Date(),
          planId: 'plan-1',
          isRead: false,
          isSent: false,
          createdAt: new Date(),
        },
        {
          id: 'notif-2',
          type: 'deadline_reminder',
          recipientId: 'user-1',
          recipientEmail: 'test@example.com',
          title: 'Read',
          message: 'Read notification',
          scheduledDate: new Date(),
          planId: 'plan-1',
          isRead: true,
          isSent: false,
          createdAt: new Date(),
        },
      ];

      service['notifications'].set('plan-1', notifications);

      const count = await service.getUnreadNotificationsCount('user-1');

      expect(count).toBe(1);
    });
  });

  describe('markNotificationAsRead', () => {
    it('should mark a specific notification as read', async () => {
      const notification: NotificationData = {
        id: 'notif-1',
        type: 'deadline_reminder',
        recipientId: 'user-1',
        recipientEmail: 'test@example.com',
        title: 'Test',
        message: 'Test notification',
        scheduledDate: new Date(),
        planId: 'plan-1',
        isRead: false,
        isSent: false,
        createdAt: new Date(),
      };

      service['notifications'].set('plan-1', [notification]);

      await service.markNotificationAsRead('notif-1');

      expect(notification.isRead).toBe(true);
    });
  });

  describe('markAllNotificationsAsRead', () => {
    it('should mark all notifications as read for a user', async () => {
      const notifications: NotificationData[] = [
        {
          id: 'notif-1',
          type: 'deadline_reminder',
          recipientId: 'user-1',
          recipientEmail: 'test@example.com',
          title: 'Test 1',
          message: 'Test notification 1',
          scheduledDate: new Date(),
          planId: 'plan-1',
          isRead: false,
          isSent: false,
          createdAt: new Date(),
        },
        {
          id: 'notif-2',
          type: 'followup_reminder',
          recipientId: 'user-1',
          recipientEmail: 'test@example.com',
          title: 'Test 2',
          message: 'Test notification 2',
          scheduledDate: new Date(),
          planId: 'plan-1',
          isRead: false,
          isSent: false,
          createdAt: new Date(),
        },
        {
          id: 'notif-3',
          type: 'deadline_reminder',
          recipientId: 'user-2',
          recipientEmail: 'other@example.com',
          title: 'Other User',
          message: 'Other user notification',
          scheduledDate: new Date(),
          planId: 'plan-1',
          isRead: false,
          isSent: false,
          createdAt: new Date(),
        },
      ];

      service['notifications'].set('plan-1', notifications);

      await service.markAllNotificationsAsRead('user-1');

      expect(notifications[0].isRead).toBe(true);
      expect(notifications[1].isRead).toBe(true);
      expect(notifications[2].isRead).toBe(false); // Different user
    });
  });

  describe('getDueNotifications', () => {
    it('should return notifications that are due to be sent', async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const notifications: NotificationData[] = [
        {
          id: 'due-1',
          type: 'deadline_reminder',
          recipientId: 'user-1',
          recipientEmail: 'test@example.com',
          title: 'Due',
          message: 'Due notification',
          scheduledDate: pastDate,
          planId: 'plan-1',
          isRead: false,
          isSent: false,
          createdAt: new Date(),
        },
        {
          id: 'not-due',
          type: 'deadline_reminder',
          recipientId: 'user-1',
          recipientEmail: 'test@example.com',
          title: 'Not Due',
          message: 'Future notification',
          scheduledDate: futureDate,
          planId: 'plan-1',
          isRead: false,
          isSent: false,
          createdAt: new Date(),
        },
        {
          id: 'already-sent',
          type: 'deadline_reminder',
          recipientId: 'user-1',
          recipientEmail: 'test@example.com',
          title: 'Already Sent',
          message: 'Sent notification',
          scheduledDate: pastDate,
          planId: 'plan-1',
          isRead: false,
          isSent: true,
          createdAt: new Date(),
        },
      ];

      service['notifications'].set('plan-1', notifications);

      const dueNotifications = await service.getDueNotifications();

      expect(dueNotifications).toHaveLength(1);
      expect(dueNotifications[0].id).toBe('due-1');
    });
  });

  describe('sendNotification', () => {
    it('should send notification and mark as sent', async () => {
      const notification: NotificationData = {
        id: 'notif-1',
        type: 'deadline_reminder',
        recipientId: 'user-1',
        recipientEmail: 'test@example.com',
        title: 'Test',
        message: 'Test notification',
        scheduledDate: new Date(),
        planId: 'plan-1',
        isRead: false,
        isSent: false,
        createdAt: new Date(),
      };

      const result = await service.sendNotification(notification);

      expect(result).toBe(true);
      expect(notification.isSent).toBe(true);
    });

    it('should handle send failure', async () => {
      const notification: NotificationData = {
        id: 'notif-1',
        type: 'deadline_reminder',
        recipientId: 'user-1',
        recipientEmail: 'test@example.com',
        title: 'Test',
        message: 'Test notification',
        scheduledDate: new Date(),
        planId: 'plan-1',
        isRead: false,
        isSent: false,
        createdAt: new Date(),
      };

      // Mock simulateEmailSend to throw error
      jest.spyOn(service as any, 'simulateEmailSend').mockRejectedValue(new Error('Send failed'));
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      const result = await service.sendNotification(notification);

      expect(result).toBe(false);
      expect(notification.isSent).toBe(false);
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('processDueNotifications', () => {
    it('should process all due notifications', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const notifications: NotificationData[] = [
        {
          id: 'due-1',
          type: 'deadline_reminder',
          recipientId: 'user-1',
          recipientEmail: 'test@example.com',
          title: 'Due 1',
          message: 'Due notification 1',
          scheduledDate: pastDate,
          planId: 'plan-1',
          isRead: false,
          isSent: false,
          createdAt: new Date(),
        },
        {
          id: 'due-2',
          type: 'followup_reminder',
          recipientId: 'user-1',
          recipientEmail: 'test@example.com',
          title: 'Due 2',
          message: 'Due notification 2',
          scheduledDate: pastDate,
          planId: 'plan-1',
          isRead: false,
          isSent: false,
          createdAt: new Date(),
        },
      ];

      service['notifications'].set('plan-1', notifications);
      const sendSpy = jest.spyOn(service, 'sendNotification');

      await service.processDueNotifications();

      expect(sendSpy).toHaveBeenCalledTimes(2);
      expect(notifications[0].isSent).toBe(true);
      expect(notifications[1].isSent).toBe(true);
    });
  });

  describe('getNotificationStatistics', () => {
    it('should return notification statistics', async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const notifications: NotificationData[] = [
        {
          id: 'sent-1',
          type: 'deadline_reminder',
          recipientId: 'user-1',
          recipientEmail: 'test@example.com',
          title: 'Sent',
          message: 'Sent notification',
          scheduledDate: pastDate,
          planId: 'plan-1',
          isRead: false,
          isSent: true,
          createdAt: new Date(),
        },
        {
          id: 'pending-1',
          type: 'followup_reminder',
          recipientId: 'user-1',
          recipientEmail: 'test@example.com',
          title: 'Pending',
          message: 'Pending notification',
          scheduledDate: futureDate,
          planId: 'plan-1',
          isRead: false,
          isSent: false,
          createdAt: new Date(),
        },
        {
          id: 'overdue-1',
          type: 'overdue_alert',
          recipientId: 'user-1',
          recipientEmail: 'test@example.com',
          title: 'Overdue',
          message: 'Overdue notification',
          scheduledDate: pastDate,
          planId: 'plan-1',
          isRead: false,
          isSent: false,
          createdAt: new Date(),
        },
      ];

      service['notifications'].set('plan-1', notifications);

      const stats = await service.getNotificationStatistics();

      expect(stats).toEqual({
        total: 3,
        sent: 1,
        pending: 1,
        overdue: 1,
        byType: {
          deadline_reminder: 1,
          followup_reminder: 1,
          overdue_alert: 1,
        },
      });
    });
  });

  describe('createCustomNotification', () => {
    it('should create a custom notification', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);

      const notification = await service.createCustomNotification(
        'user-1',
        'Custom Title',
        'Custom Message',
        'plan-1',
      );

      expect(notification).toBeDefined();
      expect(notification.title).toBe('Custom Title');
      expect(notification.message).toBe('Custom Message');
      expect(notification.recipientId).toBe('user-1');
      expect(notification.recipientEmail).toBe('test@example.com');

      // Should be stored in the plan's notifications
      const planNotifications = service['notifications'].get('plan-1');
      expect(planNotifications).toContain(notification);
    });

    it('should create general notification when no planId provided', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);

      const notification = await service.createCustomNotification(
        'user-1',
        'General Title',
        'General Message',
      );

      // Should be stored in general notifications
      const generalNotifications = service['notifications'].get('general');
      expect(generalNotifications).toContain(notification);
    });

    it('should throw error when user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.createCustomNotification('non-existent', 'Title', 'Message'),
      ).rejects.toThrow('User with ID non-existent not found');
    });
  });

  describe('runNotificationProcessor', () => {
    it('should run notification processor without errors', async () => {
      const processSpy = jest.spyOn(service, 'processDueNotifications').mockResolvedValue();

      await service.runNotificationProcessor();

      expect(processSpy).toHaveBeenCalled();
    });

    it('should handle errors in notification processor', async () => {
      jest
        .spyOn(service, 'processDueNotifications')
        .mockRejectedValue(new Error('Processing error'));
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await service.runNotificationProcessor();

      expect(loggerSpy).toHaveBeenCalledWith(
        'Error processing notifications:',
        expect.any(Error),
      );
    });
  });
});