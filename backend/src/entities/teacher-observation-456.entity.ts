import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('teacher_observations_456')
export class TeacherObservation456 {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Header information
  @Column({ name: 'school_name' })
  schoolName: string;

  @Column({ name: 'school_code' })
  schoolCode: string;

  @Column()
  commune: string;

  @Column()
  district: string;

  @Column()
  province: string;

  @Column({ name: 'observer_name' })
  observerName: string;

  @Column({ name: 'observer_code', nullable: true })
  observerCode: string;

  @Column({ name: 'observation_date', type: 'date' })
  observationDate: Date;

  @Column()
  grade: string;

  @Column()
  subject: string;

  @Column({ name: 'teacher_name' })
  teacherName: string;

  @Column({ name: 'teacher_code', nullable: true })
  teacherCode: string;

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime: string;

  // Section scores stored as JSON
  @Column({ name: 'introduction_scores', type: 'jsonb' })
  introductionScores: Record<string, number>;

  @Column({ name: 'teaching_scores', type: 'jsonb' })
  teachingScores: Record<string, number>;

  @Column({ name: 'learning_scores', type: 'jsonb' })
  learningScores: Record<string, number>;

  @Column({ name: 'assessment_scores', type: 'jsonb' })
  assessmentScores: Record<string, number>;

  // Student counts stored as JSON
  @Column({ name: 'student_counts', type: 'jsonb' })
  studentCounts: {
    grade1: { male: number; female: number };
    grade2: { male: number; female: number };
    grade3: { male: number; female: number };
    grade4: { male: number; female: number };
    grade5: { male: number; female: number };
    grade6: { male: number; female: number };
  };

  // Comments and signatures
  @Column({ type: 'text', nullable: true })
  comments: string;

  @Column({ name: 'observer_signature', nullable: true })
  observerSignature: string;

  @Column({ name: 'teacher_signature', nullable: true })
  teacherSignature: string;

  // Computed totals for reporting
  @Column({ name: 'total_introduction_score', type: 'int', default: 0 })
  totalIntroductionScore: number;

  @Column({ name: 'total_teaching_score', type: 'int', default: 0 })
  totalTeachingScore: number;

  @Column({ name: 'total_learning_score', type: 'int', default: 0 })
  totalLearningScore: number;

  @Column({ name: 'total_assessment_score', type: 'int', default: 0 })
  totalAssessmentScore: number;

  @Column({ name: 'overall_score', type: 'int', default: 0 })
  overallScore: number;

  // Status
  @Column({ default: 'submitted' })
  status: string;

  // User relation
  @Column({ name: 'observer_id', nullable: true })
  observerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'observer_id' })
  observer: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}