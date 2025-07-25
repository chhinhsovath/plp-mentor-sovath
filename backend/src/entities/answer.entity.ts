import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { SurveyResponse } from './survey-response.entity';
import { Question } from './question.entity';

@Entity('answers')
@Index(['responseId', 'questionId'], { unique: true })
export class Answer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SurveyResponse, (response) => response.answers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'response_id' })
  response: SurveyResponse;

  @Column({ name: 'response_id' })
  responseId: string;

  @ManyToOne(() => Question, (question) => question.answers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column({ name: 'question_id' })
  questionId: string;

  @Column({ type: 'jsonb', nullable: true })
  answer: any;

  @Column({ type: 'jsonb', nullable: true })
  files?: Array<{
    originalName: string;
    filename: string;
    mimetype: string;
    size: number;
    path: string;
  }>;

  @CreateDateColumn()
  createdAt: Date;
}