import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Question } from './question.entity';
import { SurveyResponse } from './survey-response.entity';

@Entity('surveys')
export class Survey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  settings: {
    allowAnonymous?: boolean;
    requireAuth?: boolean;
    allowMultipleSubmissions?: boolean;
    showProgressBar?: boolean;
    shuffleQuestions?: boolean;
    timeLimit?: number; // in minutes
    startDate?: Date;
    endDate?: Date;
  };

  @Column({ type: 'enum', enum: ['draft', 'published', 'closed'], default: 'draft' })
  status: 'draft' | 'published' | 'closed';

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Question, (question) => question.survey, {
    cascade: true,
    eager: true,
  })
  questions: Question[];

  @OneToMany(() => SurveyResponse, (response) => response.survey)
  responses: SurveyResponse[];
}