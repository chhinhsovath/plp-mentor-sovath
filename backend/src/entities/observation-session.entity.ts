import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ObservationForm } from './observation-form.entity';
import { User } from './user.entity';
import { IndicatorResponse } from './indicator-response.entity';
import { GroupReflectionComment } from './group-reflection-comment.entity';
import { ImprovementPlan } from './improvement-plan.entity';
import { Signature } from './signature.entity';

export enum SessionStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  APPROVED = 'approved',
}

@Entity('observation_sessions')
export class ObservationSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'form_id' })
  formId: string;

  @Column({ name: 'observer_id', nullable: true })
  observerId: string;

  @Column({ name: 'school_name' })
  schoolName: string;

  @Column({ name: 'teacher_name' })
  teacherName: string;

  @Column({ name: 'observer_name' })
  observerName: string;

  @Column()
  subject: string;

  @Column()
  grade: string;

  @Column({ name: 'date_observed', type: 'date' })
  dateObserved: Date;

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime: string;

  @Column({ name: 'classification_level' })
  classificationLevel: string;

  @Column({ name: 'reflection_summary', nullable: true })
  reflectionSummary: string;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.DRAFT,
  })
  status: SessionStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => ObservationForm, (form) => form.observationSessions)
  @JoinColumn({ name: 'form_id' })
  form: ObservationForm;

  @ManyToOne(() => User, (user) => user.observationSessions)
  @JoinColumn({ name: 'observer_id' })
  observer: User;

  @OneToMany(() => IndicatorResponse, (response) => response.session)
  indicatorResponses: IndicatorResponse[];

  @OneToMany(() => GroupReflectionComment, (comment) => comment.session)
  reflectionComments: GroupReflectionComment[];

  @OneToMany(() => ImprovementPlan, (plan) => plan.session)
  improvementPlans: ImprovementPlan[];

  @OneToMany(() => Signature, (signature) => signature.session)
  signatures: Signature[];
}
