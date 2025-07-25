import { IsString, IsOptional, IsArray, ValidateNested, IsBoolean, IsNumber, IsDateString, IsEnum, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionType } from '../../entities/question.entity';

class CreateQuestionDto {
  @ApiProperty({ description: 'Question type', enum: ['text', 'textarea', 'number', 'date', 'time', 'select', 'radio', 'checkbox', 'file', 'location', 'audio', 'video'] })
  @IsEnum(['text', 'textarea', 'number', 'date', 'time', 'select', 'radio', 'checkbox', 'file', 'location', 'audio', 'video'])
  type: QuestionType;

  @ApiProperty({ description: 'Question label' })
  @IsString()
  label: string;

  @ApiPropertyOptional({ description: 'Question description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Placeholder text' })
  @IsOptional()
  @IsString()
  placeholder?: string;

  @ApiProperty({ description: 'Is question required', default: false })
  @IsBoolean()
  required: boolean;

  @ApiProperty({ description: 'Question order' })
  @IsNumber()
  order: number;

  @ApiPropertyOptional({ description: 'Options for select/radio/checkbox questions' })
  @IsOptional()
  @IsArray()
  options?: Array<{
    label: string;
    value: string;
    order?: number;
  }>;

  @ApiPropertyOptional({ description: 'Validation rules' })
  @IsOptional()
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    acceptedFileTypes?: string[];
    maxFileSize?: number;
  };

  @ApiPropertyOptional({ description: 'Conditional logic' })
  @IsOptional()
  logic?: {
    conditions: Array<{
      questionId: string;
      operator: '=' | '!=' | '>' | '<' | 'contains' | 'in';
      value: any;
    }>;
    action: 'show' | 'hide' | 'skip';
  };

  @ApiPropertyOptional({ description: 'Parent question ID for branching' })
  @IsOptional()
  @IsUUID()
  parentQuestionId?: string;

  @ApiPropertyOptional({ description: 'Group ID for grouping questions' })
  @IsOptional()
  @IsString()
  groupId?: string;

  @ApiProperty({ description: 'Allow "Other" option', default: false })
  @IsBoolean()
  @IsOptional()
  allowOther?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class CreateSurveyDto {
  @ApiProperty({ description: 'Survey title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Survey description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Survey settings' })
  @IsOptional()
  settings?: {
    allowAnonymous?: boolean;
    requireAuth?: boolean;
    allowMultipleSubmissions?: boolean;
    showProgressBar?: boolean;
    shuffleQuestions?: boolean;
    timeLimit?: number;
    startDate?: Date;
    endDate?: Date;
  };

  @ApiProperty({ description: 'Survey questions', type: [CreateQuestionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions: CreateQuestionDto[];

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}