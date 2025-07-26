import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { NotificationType } from './notification.entity';

export interface EmailPreferences {
  enabled: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
  types: NotificationType[];
}

export interface SmsPreferences {
  enabled: boolean;
  types: NotificationType[];
}

export interface InAppPreferences {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
}

@Entity('notification_preferences')
export class NotificationPreferences {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'jsonb' })
  email: EmailPreferences;

  @Column({ type: 'jsonb' })
  sms: SmsPreferences;

  @Column({ type: 'jsonb', name: 'in_app' })
  inApp: InAppPreferences;

  @Column({ name: 'quiet_hours_start', type: 'time', nullable: true })
  quietHoursStart: string;

  @Column({ name: 'quiet_hours_end', type: 'time', nullable: true })
  quietHoursEnd: string;

  @Column({ name: 'timezone', default: 'Asia/Phnom_Penh' })
  timezone: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}