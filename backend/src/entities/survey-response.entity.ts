import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Survey } from './survey.entity';
import { User } from './user.entity';
import { Answer } from './answer.entity';

@Entity('survey_responses')
@Index(['surveyId', 'submittedAt'])
export class SurveyResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Survey, (survey) => survey.responses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'survey_id' })
  survey: Survey;

  @Column({ name: 'survey_id' })
  surveyId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @Column({ type: 'uuid', unique: true })
  @Index()
  uuid: string;

  @Column({ type: 'enum', enum: ['draft', 'submitted'], default: 'draft' })
  status: 'draft' | 'submitted';

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    location?: {
      latitude: number;
      longitude: number;
      accuracy?: number;
    };
    duration?: number; // in seconds
    device?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Answer, (answer) => answer.response, {
    cascade: true,
    eager: true,
  })
  answers: Answer[];
}