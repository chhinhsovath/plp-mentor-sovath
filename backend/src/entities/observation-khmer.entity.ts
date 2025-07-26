import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('observation_khmer_forms')
export class ObservationKhmerForm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'school_name' })
  schoolName: string;

  @Column({ name: 'advisor_name' })
  advisorName: string;

  @Column({ name: 'teacher_name' })
  teacherName: string;

  @Column({ name: 'consultation_date', type: 'date', nullable: true })
  consultationDate: Date;

  @Column({ name: 'teacher_goals_activities', type: 'text', nullable: true })
  teacherGoalsActivities: string;

  @Column({ type: 'text', nullable: true })
  strategy: string;

  @Column({ nullable: true })
  time1: string;

  @Column({ nullable: true })
  time2: string;

  @Column({ name: 'activity_date1', type: 'date', nullable: true })
  activityDate1: Date;

  @Column({ name: 'plan_date1', nullable: true })
  planDate1: string;

  @Column({ name: 'activity_date2', type: 'date', nullable: true })
  activityDate2: Date;

  @Column({ name: 'plan_date2', nullable: true })
  planDate2: string;

  @Column({ name: 'evaluation_system', type: 'text', nullable: true })
  evaluationSystem: string;

  @Column({ name: 'teacher_comments', type: 'text', nullable: true })
  teacherComments: string;

  @Column({ name: 'advisor_phone', nullable: true })
  advisorPhone: string;

  @Column({ name: 'teacher_phone', nullable: true })
  teacherPhone: string;

  @Column({ name: 'advisor_signature_date', type: 'date', nullable: true })
  advisorSignatureDate: Date;

  @Column({ name: 'teacher_signature_date', type: 'date', nullable: true })
  teacherSignatureDate: Date;

  @Column({ name: 'teacher_signature', type: 'text', nullable: true })
  teacherSignature: string;

  @Column({ name: 'advisor_signature', type: 'text', nullable: true })
  advisorSignature: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column({ name: 'created_by' })
  createdById: string;
}