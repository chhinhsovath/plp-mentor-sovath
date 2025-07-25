import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImprovementPlan } from '../entities/improvement-plan.entity';
import { User } from '../entities/user.entity';

export interface NotificationData {
  id: string;
  type: 'deadline_reminder' | 'followup_reminder' | 'overdue_alert';
  recipientId: string;
  recipientEmail: string;
  title: string;
  message: string;
  scheduledDate: Date;
  planId: string;
  actionId?: string;
  followUpId?: string;
  isRead: boolean;
  isSent: boolean;
  createdAt: Date;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private notifications: Map<string, NotificationData[]> = new Map();

  constructor(
    @InjectRepository(ImprovementPlan)
    private planRepository: Repository<ImprovementPlan>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async scheduleNotifications(planId: string): Promise<void> {
    const plan = await this.planRepository.findOne({
      where: { id: planId },
      relations: ['session', 'session.observer', 'actions', 'followUpActivities'],
    });

    if (!plan) {
      this.logger.warn(`Plan with ID ${planId} not found for notification scheduling`);
      return;
    }

    // Clear existing notifications for this plan
    await this.cancelNotifications(planId);

    const notifications: NotificationData[] = [];

    // Schedule deadline reminders for actions
    for (const action of plan.actions || []) {
      // Reminder 3 days before deadline
      const reminderDate = new Date(action.deadline);
      reminderDate.setDate(reminderDate.getDate() - 3);

      if (reminderDate > new Date()) {
        notifications.push({
          id: `${planId}-action-${action.id}-reminder`,
          type: 'deadline_reminder',
          recipientId: plan.session.observerId,
          recipientEmail: plan.session.observer?.email || '',
          title: 'Improvement Action Deadline Reminder',
          message: `Action "${action.actionDescription}" is due in 3 days (${action.deadline.toDateString()})`,
          scheduledDate: reminderDate,
          planId,
          actionId: action.id,
          isRead: false,
          isSent: false,
          createdAt: new Date(),
        });
      }

      // Overdue alert 1 day after deadline
      const overdueDate = new Date(action.deadline);
      overdueDate.setDate(overdueDate.getDate() + 1);

      notifications.push({
        id: `${planId}-action-${action.id}-overdue`,
        type: 'overdue_alert',
        recipientId: plan.session.observerId,
        recipientEmail: plan.session.observer?.email || '',
        title: 'Improvement Action Overdue',
        message: `Action "${action.actionDescription}" was due on ${action.deadline.toDateString()}`,
        scheduledDate: overdueDate,
        planId,
        actionId: action.id,
        isRead: false,
        isSent: false,
        createdAt: new Date(),
      });
    }

    // Schedule follow-up reminders
    for (const followUp of plan.followUpActivities || []) {
      // Reminder 1 day before follow-up
      const reminderDate = new Date(followUp.followUpDate);
      reminderDate.setDate(reminderDate.getDate() - 1);

      if (reminderDate > new Date()) {
        notifications.push({
          id: `${planId}-followup-${followUp.id}-reminder`,
          type: 'followup_reminder',
          recipientId: plan.session.observerId,
          recipientEmail: plan.session.observer?.email || '',
          title: 'Follow-up Activity Reminder',
          message: `Follow-up "${followUp.method}" is scheduled for tomorrow (${followUp.followUpDate.toDateString()})`,
          scheduledDate: reminderDate,
          planId,
          followUpId: followUp.id,
          isRead: false,
          isSent: false,
          createdAt: new Date(),
        });
      }
    }

    // Store notifications in memory (in production, use a database or queue)
    this.notifications.set(planId, notifications);

    this.logger.log(`Scheduled ${notifications.length} notifications for plan ${planId}`);
  }

  async cancelNotifications(planId: string): Promise<void> {
    this.notifications.delete(planId);
    this.logger.log(`Cancelled notifications for plan ${planId}`);
  }

  async getNotificationsForUser(userId: string): Promise<NotificationData[]> {
    const allNotifications: NotificationData[] = [];

    this.notifications.forEach((planNotifications) => {
      const userNotifications = planNotifications.filter((n) => n.recipientId === userId);
      allNotifications.push(...userNotifications);
    });

    return allNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getUnreadNotificationsCount(userId: string): Promise<number> {
    const notifications = await this.getNotificationsForUser(userId);
    return notifications.filter((n) => !n.isRead).length;
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    this.notifications.forEach((planNotifications) => {
      const notification = planNotifications.find((n) => n.id === notificationId);
      if (notification) {
        notification.isRead = true;
      }
    });
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    this.notifications.forEach((planNotifications) => {
      planNotifications.forEach((notification) => {
        if (notification.recipientId === userId) {
          notification.isRead = true;
        }
      });
    });
  }

  async getDueNotifications(): Promise<NotificationData[]> {
    const now = new Date();
    const dueNotifications: NotificationData[] = [];

    this.notifications.forEach((planNotifications) => {
      const due = planNotifications.filter((n) => !n.isSent && n.scheduledDate <= now);
      dueNotifications.push(...due);
    });

    return dueNotifications;
  }

  async sendNotification(notification: NotificationData): Promise<boolean> {
    try {
      // In a real implementation, you would send emails, SMS, or push notifications
      this.logger.log(
        `Sending notification: ${notification.title} to ${notification.recipientEmail}`,
      );

      // Simulate sending notification
      await this.simulateEmailSend(notification);

      // Mark as sent
      notification.isSent = true;

      return true;
    } catch (error) {
      this.logger.error(`Failed to send notification ${notification.id}:`, error);
      return false;
    }
  }

  async processDueNotifications(): Promise<void> {
    const dueNotifications = await this.getDueNotifications();

    this.logger.log(`Processing ${dueNotifications.length} due notifications`);

    for (const notification of dueNotifications) {
      await this.sendNotification(notification);
    }
  }

  async getNotificationStatistics(): Promise<{
    total: number;
    sent: number;
    pending: number;
    overdue: number;
    byType: Record<string, number>;
  }> {
    let total = 0;
    let sent = 0;
    let pending = 0;
    let overdue = 0;
    const byType: Record<string, number> = {};

    const now = new Date();

    this.notifications.forEach((planNotifications) => {
      planNotifications.forEach((notification) => {
        total++;

        if (notification.isSent) {
          sent++;
        } else if (notification.scheduledDate <= now) {
          overdue++;
        } else {
          pending++;
        }

        byType[notification.type] = (byType[notification.type] || 0) + 1;
      });
    });

    return {
      total,
      sent,
      pending,
      overdue,
      byType,
    };
  }

  async createCustomNotification(
    recipientId: string,
    title: string,
    message: string,
    planId?: string,
  ): Promise<NotificationData> {
    const recipient = await this.userRepository.findOne({
      where: { id: recipientId },
    });

    if (!recipient) {
      throw new Error(`User with ID ${recipientId} not found`);
    }

    const notification: NotificationData = {
      id: `custom-${Date.now()}-${recipientId}`,
      type: 'deadline_reminder', // Default type for custom notifications
      recipientId,
      recipientEmail: recipient.email,
      title,
      message,
      scheduledDate: new Date(),
      planId: planId || '',
      isRead: false,
      isSent: false,
      createdAt: new Date(),
    };

    // Store in appropriate plan or create a general notifications array
    if (planId && this.notifications.has(planId)) {
      this.notifications.get(planId)!.push(notification);
    } else {
      // Store in a general notifications array
      const generalKey = 'general';
      if (!this.notifications.has(generalKey)) {
        this.notifications.set(generalKey, []);
      }
      this.notifications.get(generalKey)!.push(notification);
    }

    return notification;
  }

  private async simulateEmailSend(notification: NotificationData): Promise<void> {
    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // In a real implementation, you would use a service like:
    // - SendGrid
    // - AWS SES
    // - Nodemailer
    // - etc.

    this.logger.debug(`Email sent to ${notification.recipientEmail}: ${notification.title}`);
  }

  // Cron job method to be called periodically
  async runNotificationProcessor(): Promise<void> {
    try {
      await this.processDueNotifications();
    } catch (error) {
      this.logger.error('Error processing notifications:', error);
    }
  }
}
