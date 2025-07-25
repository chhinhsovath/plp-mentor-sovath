import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum MissionType {
  FIELD_TRIP = 'field_trip',
  TRAINING = 'training',
  MEETING = 'meeting',
  MONITORING = 'monitoring',
  OTHER = 'other',
}

export enum MissionStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('missions')
export class Mission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: MissionType,
    enumName: 'mission_type_enum',
    default: MissionType.OTHER,
  })
  type: MissionType;

  @Column({
    type: 'enum',
    enum: MissionStatus,
    enumName: 'mission_status_enum',
    default: MissionStatus.DRAFT,
  })
  status: MissionStatus;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  location: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  purpose: string;

  @Column({ type: 'text', nullable: true })
  objectives: string;

  @Column({ type: 'text', nullable: true })
  expectedOutcomes: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  budget: number;

  @Column({ type: 'text', nullable: true })
  transportationDetails: string;

  @Column({ type: 'text', nullable: true })
  accommodationDetails: string;

  @Column({ type: 'json', nullable: true })
  participants: string[];

  @Column({ type: 'json', nullable: true })
  attachments: string[];

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approvedBy: User;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'text', nullable: true })
  approvalComments: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'text', nullable: true })
  completionReport: string;

  @Column({ type: 'timestamp', nullable: true })
  actualStartTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualEndTime: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => MissionParticipant, participant => participant.mission)
  missionParticipants: MissionParticipant[];

  @OneToMany(() => MissionTracking, tracking => tracking.mission)
  trackingData: MissionTracking[];
}

@Entity('mission_participants')
export class MissionParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Mission, mission => mission.missionParticipants)
  @JoinColumn({ name: 'mission_id' })
  mission: Mission;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 50, default: 'participant' })
  role: string;

  @Column({ type: 'boolean', default: false })
  isLeader: boolean;

  @Column({ type: 'boolean', default: false })
  hasConfirmed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  confirmedAt: Date;

  @Column({ type: 'boolean', default: false })
  hasCheckedIn: boolean;

  @Column({ type: 'timestamp', nullable: true })
  checkedInAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('mission_tracking')
export class MissionTracking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Mission, mission => mission.trackingData)
  @JoinColumn({ name: 'mission_id' })
  mission: Mission;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  longitude: number;

  @Column({ type: 'float', nullable: true })
  accuracy: number;

  @Column({ type: 'timestamp' })
  recordedAt: Date;

  @Column({ type: 'varchar', length: 50 })
  activity: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;
}