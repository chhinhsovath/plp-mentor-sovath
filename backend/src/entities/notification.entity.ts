import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum NotificationType {
  MISSION_CREATED = 'mission_created',
  MISSION_APPROVED = 'mission_approved',
  MISSION_REJECTED = 'mission_rejected',
  MISSION_REMINDER = 'mission_reminder',
  OBSERVATION_CREATED = 'observation_created',
  OBSERVATION_COMPLETED = 'observation_completed',
  OBSERVATION_FEEDBACK = 'observation_feedback',
  APPROVAL_REQUIRED = 'approval_required',
  APPROVAL_GRANTED = 'approval_granted',
  APPROVAL_REJECTED = 'approval_rejected',
  REPORT_GENERATED = 'report_generated',
  ANNOUNCEMENT = 'announcement',
  SYSTEM_ALERT = 'system_alert',
  DEADLINE_APPROACHING = 'deadline_approaching',
  USER_MENTION = 'user_mention',
  ROLE_CHANGED = 'role_changed',
  PASSWORD_CHANGED = 'password_changed',
  LOGIN_ALERT = 'login_alert',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationCategory {
  MISSION = 'mission',
  OBSERVATION = 'observation',
  APPROVAL = 'approval',
  SYSTEM = 'system',
  USER = 'user',
  ANNOUNCEMENT = 'announcement',
}

export interface NotificationAction {
  label: string;
  url?: string;
  action?: string;
  primary?: boolean;
}

@Entity('notifications')
@Index(['userId', 'read', 'createdAt'])
@Index(['type', 'createdAt'])
@Index(['groupId'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM,
  })
  priority: NotificationPriority;

  @Column({
    type: 'enum',
    enum: NotificationCategory,
  })
  category: NotificationCategory;

  @Column({ type: 'jsonb', nullable: true })
  data: any;

  @Column({ type: 'jsonb', nullable: true })
  actions: NotificationAction[];

  @Column({ default: false })
  read: boolean;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt: Date;

  @Column({ name: 'group_id', nullable: true })
  groupId: string;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}