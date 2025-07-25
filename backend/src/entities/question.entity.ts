import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Survey } from './survey.entity';
import { Answer } from './answer.entity';

export type QuestionType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'time'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'location'
  | 'audio'
  | 'video';

@Entity('questions')
@Index(['surveyId', 'order'])
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Survey, (survey) => survey.questions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'survey_id' })
  survey: Survey;

  @Column({ name: 'survey_id' })
  surveyId: string;

  @Column({ type: 'varchar', length: 50 })
  type: QuestionType;

  @Column({ type: 'text' })
  label: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  placeholder?: string;

  @Column({ type: 'boolean', default: false })
  required: boolean;

  @Column({ type: 'int' })
  order: number;

  @Column({ type: 'jsonb', nullable: true })
  options?: Array<{
    label: string;
    value: string;
    order?: number;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    acceptedFileTypes?: string[];
    maxFileSize?: number; // in MB
  };

  @Column({ type: 'jsonb', nullable: true })
  logic?: {
    conditions: Array<{
      questionId: string;
      operator: '=' | '!=' | '>' | '<' | 'contains' | 'in';
      value: any;
    }>;
    action: 'show' | 'hide' | 'skip';
  };

  @Column({ name: 'parent_question_id', nullable: true })
  parentQuestionId?: string;

  @ManyToOne(() => Question, { nullable: true })
  @JoinColumn({ name: 'parent_question_id' })
  parentQuestion?: Question;

  @OneToMany(() => Question, (question) => question.parentQuestion)
  childQuestions: Question[];

  @Column({ name: 'group_id', nullable: true })
  groupId?: string;

  @Column({ type: 'boolean', default: false })
  allowOther: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @OneToMany(() => Answer, (answer) => answer.question)
  answers: Answer[];
}