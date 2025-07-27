import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan, IsNull, Not } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Notification, NotificationType, NotificationPriority, NotificationCategory } from '../entities/notification.entity';
import { NotificationPreferences } from '../entities/notification-preferences.entity';
import { User } from '../entities/user.entity';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { format } from 'date-fns';
import { km } from 'date-fns/locale';

interface SendNotificationDto {
  userId?: string;
  userIds?: string[];
  roleIds?: string[];
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  data?: any;
  actions?: any[];
  expiresAt?: Date;
}

interface NotificationFilter {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: NotificationType[];
  priority?: NotificationPriority[];
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationPreferences)
    private preferencesRepository: Repository<NotificationPreferences>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private emailService: EmailService,
    private smsService: SmsService,
    private eventEmitter: EventEmitter2,
  ) {}

  // Create and send notification
  async sendNotification(dto: SendNotificationDto): Promise<void> {
    try {
      // Get target users
      const users = await this.getTargetUsers(dto);
      
      // Create notifications for each user
      const notifications = await Promise.all(
        users.map(async (user) => {
          const notification = this.notificationRepository.create({
            userId: user.id,
            type: dto.type,
            title: dto.title,
            message: dto.message,
            priority: dto.priority || NotificationPriority.MEDIUM,
            category: this.getCategory(dto.type),
            data: dto.data,
            actions: dto.actions,
            expiresAt: dto.expiresAt,
          });

          const savedNotification = await this.notificationRepository.save(notification);

          // Process notification delivery
          await this.processNotificationDelivery(savedNotification, user);

          return savedNotification;
        })
      );

      this.logger.log(`Sent ${notifications.length} notifications of type ${dto.type}`);
    } catch (error) {
      this.logger.error('Failed to send notifications', error);
      throw error;
    }
  }

  // Get target users based on criteria
  private async getTargetUsers(dto: SendNotificationDto): Promise<User[]> {
    if (dto.userId) {
      const user = await this.userRepository.findOne({ where: { id: dto.userId } });
      return user ? [user] : [];
    }

    if (dto.userIds && dto.userIds.length > 0) {
      return this.userRepository.find({ where: { id: In(dto.userIds) } });
    }

    if (dto.roleIds && dto.roleIds.length > 0) {
      return this.userRepository.find({ where: { role: In(dto.roleIds) } });
    }

    return [];
  }

  // Process notification delivery based on user preferences
  private async processNotificationDelivery(notification: Notification, user: User): Promise<void> {
    // Get user preferences
    const preferences = await this.getOrCreatePreferences(user.id);

    // Check if within quiet hours
    if (this.isWithinQuietHours(preferences)) {
      this.logger.debug(`Notification delayed due to quiet hours for user ${user.id}`);
      return;
    }

    // Emit real-time notification
    this.eventEmitter.emit('notification.created', {
      userId: user.id,
      notification,
    });

    // Send email notification
    if (this.shouldSendEmail(notification.type, preferences)) {
      await this.sendEmailNotification(notification, user, preferences);
    }

    // Send SMS notification
    if (this.shouldSendSms(notification.type, preferences)) {
      await this.sendSmsNotification(notification, user);
    }
  }

  // Check if should send email
  private shouldSendEmail(type: NotificationType, preferences: NotificationPreferences): boolean {
    return (
      preferences.email.enabled &&
      preferences.email.types.includes(type) &&
      preferences.email.frequency === 'immediate'
    );
  }

  // Check if should send SMS
  private shouldSendSms(type: NotificationType, preferences: NotificationPreferences): boolean {
    return preferences.sms.enabled && preferences.sms.types.includes(type);
  }

  // Send email notification
  private async sendEmailNotification(
    notification: Notification,
    user: User,
    preferences: NotificationPreferences,
  ): Promise<void> {
    try {
      await this.emailService.sendNotificationEmail({
        to: user.email,
        subject: notification.title,
        template: 'notification',
        context: {
          userName: user.fullName,
          title: notification.title,
          message: notification.message,
          actions: notification.actions,
          priority: notification.priority,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send email notification to ${user.email}`, error);
    }
  }

  // Send SMS notification
  private async sendSmsNotification(notification: Notification, user: User): Promise<void> {
    if (!user.phoneNumber) return;

    try {
      await this.smsService.sendSms({
        to: user.phoneNumber,
        message: `${notification.title}\n${notification.message}`,
      });
    } catch (error) {
      this.logger.error(`Failed to send SMS notification to ${user.phoneNumber}`, error);
    }
  }

  // Get or create notification preferences
  async getOrCreatePreferences(userId: string): Promise<NotificationPreferences> {
    let preferences = await this.preferencesRepository.findOne({
      where: { userId },
    });

    if (!preferences) {
      preferences = this.preferencesRepository.create({
        userId,
        email: {
          enabled: true,
          frequency: 'immediate',
          types: [
            NotificationType.MISSION_CREATED,
            NotificationType.OBSERVATION_CREATED,
            NotificationType.APPROVAL_REQUIRED,
            NotificationType.ANNOUNCEMENT,
          ],
        },
        sms: {
          enabled: false,
          types: [NotificationType.APPROVAL_REQUIRED, NotificationType.SYSTEM_ALERT],
        },
        inApp: {
          enabled: true,
          sound: true,
          desktop: false,
        },
        timezone: 'Asia/Phnom_Penh',
      });

      await this.preferencesRepository.save(preferences);
    }

    return preferences;
  }

  // Update notification preferences
  async updatePreferences(
    userId: string,
    updates: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> {
    const preferences = await this.getOrCreatePreferences(userId);
    Object.assign(preferences, updates);
    return this.preferencesRepository.save(preferences);
  }

  // Get notifications with filters
  async getNotifications(
    userId: string,
    filter: NotificationFilter,
  ): Promise<{ notifications: Notification[]; total: number; unread: number }> {
    const query = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId });

    // Apply filters
    if (filter.unreadOnly) {
      query.andWhere('notification.read = :read', { read: false });
    }

    if (filter.type && filter.type.length > 0) {
      query.andWhere('notification.type IN (:...types)', { types: filter.type });
    }

    if (filter.priority && filter.priority.length > 0) {
      query.andWhere('notification.priority IN (:...priorities)', { priorities: filter.priority });
    }

    if (filter.startDate) {
      query.andWhere('notification.createdAt >= :startDate', { startDate: filter.startDate });
    }

    if (filter.endDate) {
      query.andWhere('notification.createdAt <= :endDate', { endDate: filter.endDate });
    }

    // Exclude expired notifications
    query.andWhere('(notification.expiresAt IS NULL OR notification.expiresAt > :now)', { now: new Date() });

    // Pagination
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    query.skip((page - 1) * limit).take(limit);

    // Order by creation date
    query.orderBy('notification.createdAt', 'DESC');

    const [notifications, total] = await query.getManyAndCount();

    // Get unread count
    const unread = await this.notificationRepository.count({
      where: { userId, read: false },
    });

    return { notifications, total, unread };
  }

  // Get notification statistics
  async getStats(userId: string): Promise<any> {
    const notifications = await this.notificationRepository.find({
      where: { userId },
    });

    const stats = {
      total: notifications.length,
      unread: notifications.filter((n) => !n.read).length,
      byType: {} as Record<NotificationType, number>,
      byPriority: {} as Record<NotificationPriority, number>,
    };

    // Count by type
    for (const type of Object.values(NotificationType)) {
      stats.byType[type] = notifications.filter((n) => n.type === type).length;
    }

    // Count by priority
    for (const priority of Object.values(NotificationPriority)) {
      stats.byPriority[priority] = notifications.filter((n) => n.priority === priority).length;
    }

    return stats;
  }

  // Mark notification as read
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId, userId },
      { read: true, readAt: new Date() },
    );

    this.eventEmitter.emit('notification.read', { userId, notificationId });
  }

  // Mark multiple notifications as read
  async markMultipleAsRead(userId: string, notificationIds: string[]): Promise<void> {
    await this.notificationRepository.update(
      { id: In(notificationIds), userId },
      { read: true, readAt: new Date() },
    );

    this.eventEmitter.emit('notifications.read', { userId, notificationIds });
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, read: false },
      { read: true, readAt: new Date() },
    );

    this.eventEmitter.emit('notifications.all-read', { userId });
  }

  // Delete notification
  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    await this.notificationRepository.delete({ id: notificationId, userId });
    this.eventEmitter.emit('notification.deleted', { userId, notificationId });
  }

  // Clean up expired notifications (run daily)
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredNotifications(): Promise<void> {
    const result = await this.notificationRepository.delete({
      expiresAt: LessThan(new Date()),
    });

    this.logger.log(`Cleaned up ${result.affected} expired notifications`);
  }

  // Process daily digest emails
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async processDailyDigest(): Promise<void> {
    const users = await this.userRepository.find();

    for (const user of users) {
      const preferences = await this.getOrCreatePreferences(user.id);
      
      if (preferences.email.enabled && preferences.email.frequency === 'daily') {
        await this.sendDigestEmail(user, 'daily');
      }
    }
  }

  // Process weekly digest emails
  @Cron('0 8 * * 1') // Every Monday at 8 AM
  async processWeeklyDigest(): Promise<void> {
    const users = await this.userRepository.find();

    for (const user of users) {
      const preferences = await this.getOrCreatePreferences(user.id);
      
      if (preferences.email.enabled && preferences.email.frequency === 'weekly') {
        await this.sendDigestEmail(user, 'weekly');
      }
    }
  }

  // Send digest email
  private async sendDigestEmail(user: User, frequency: 'daily' | 'weekly'): Promise<void> {
    const since = frequency === 'daily' 
      ? new Date(Date.now() - 24 * 60 * 60 * 1000)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const notifications = await this.notificationRepository.find({
      where: {
        userId: user.id,
        createdAt: LessThan(since),
        read: false,
      },
      order: { createdAt: 'DESC' },
    });

    if (notifications.length === 0) return;

    try {
      await this.emailService.sendDigestEmail({
        to: user.email,
        subject: `ការជូនដំណឹង${frequency === 'daily' ? 'ប្រចាំថ្ងៃ' : 'ប្រចាំសប្តាហ៍'}`,
        notifications: notifications.map((n) => ({
          title: n.title,
          message: n.message,
          time: format(n.createdAt, 'PPp', { locale: km }),
          type: n.type,
          priority: n.priority,
        })),
      });

      // Mark notifications as included in digest
      await this.notificationRepository.update(
        { id: In(notifications.map((n) => n.id)) },
        { data: { ...notifications[0].data, digestSent: true } },
      );
    } catch (error) {
      this.logger.error(`Failed to send digest email to ${user.email}`, error);
    }
  }

  // Check if within quiet hours
  private isWithinQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = preferences.quietHoursStart.split(':').map(Number);
    const [endHour, endMinute] = preferences.quietHoursEnd.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  // Get notification category
  private getCategory(type: NotificationType): NotificationCategory {
    switch (type) {
      case NotificationType.MISSION_CREATED:
      case NotificationType.MISSION_APPROVED:
      case NotificationType.MISSION_REJECTED:
      case NotificationType.MISSION_REMINDER:
        return NotificationCategory.MISSION;
      
      case NotificationType.OBSERVATION_CREATED:
      case NotificationType.OBSERVATION_COMPLETED:
      case NotificationType.OBSERVATION_FEEDBACK:
        return NotificationCategory.OBSERVATION;
      
      case NotificationType.APPROVAL_REQUIRED:
      case NotificationType.APPROVAL_GRANTED:
      case NotificationType.APPROVAL_REJECTED:
        return NotificationCategory.APPROVAL;
      
      case NotificationType.SYSTEM_ALERT:
      case NotificationType.REPORT_GENERATED:
        return NotificationCategory.SYSTEM;
      
      case NotificationType.USER_MENTION:
      case NotificationType.ROLE_CHANGED:
      case NotificationType.PASSWORD_CHANGED:
      case NotificationType.LOGIN_ALERT:
        return NotificationCategory.USER;
      
      case NotificationType.ANNOUNCEMENT:
      case NotificationType.DEADLINE_APPROACHING:
        return NotificationCategory.ANNOUNCEMENT;
      
      default:
        return NotificationCategory.SYSTEM;
    }
  }

  // Test notification
  async testNotification(userId: string, type: 'email' | 'sms' | 'push'): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const testNotification = {
      title: 'ការជូនដំណឹងសាកល្បង',
      message: `នេះគឺជាការជូនដំណឹងសាកល្បងសម្រាប់ ${type}`,
    };

    switch (type) {
      case 'email':
        await this.emailService.sendTestEmail(user.email, testNotification);
        break;
      case 'sms':
        if (user.phoneNumber) {
          await this.smsService.sendSms({
            to: user.phoneNumber,
            message: `${testNotification.title}\n${testNotification.message}`,
          });
        }
        break;
      case 'push':
        await this.sendNotification({
          userId: user.id,
          type: NotificationType.SYSTEM_ALERT,
          title: testNotification.title,
          message: testNotification.message,
          priority: NotificationPriority.LOW,
        });
        break;
    }
  }
}