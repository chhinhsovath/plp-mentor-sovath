import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObservationSession } from './observation-session.entity';
import { ImprovementAction } from './improvement-action.entity';
import { FollowUpActivity } from './follow-up-activity.entity';

export enum PlanStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('improvement_plans')
export class ImprovementPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id' })
  sessionId: string;

  @Column({ name: 'lesson_topic', nullable: true })
  lessonTopic: string;

  @Column({ type: 'text', nullable: true })
  goals: string;

  @Column({ type: 'text', nullable: true })
  challenges: string;

  @Column({ type: 'text', nullable: true })
  strengths: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  timeline: string;

  @Column({ name: 'responsible_party', nullable: true })
  responsibleParty: string;

  @Column({
    type: 'enum',
    enum: PlanStatus,
    default: PlanStatus.DRAFT,
  })
  status: PlanStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => ObservationSession, (session) => session.improvementPlans)
  @JoinColumn({ name: 'session_id' })
  session: ObservationSession;

  @OneToMany(() => ImprovementAction, (action) => action.plan)
  actions: ImprovementAction[];

  @OneToMany(() => FollowUpActivity, (activity) => activity.plan)
  followUpActivities: FollowUpActivity[];
}
