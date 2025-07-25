import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsDateString,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateIndicatorResponseDto {
  @ApiProperty({
    description: 'Indicator ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  indicatorId: string;

  @ApiProperty({
    description: 'Selected score for the indicator',
    example: 3,
    required: false,
  })
  @IsOptional()
  selectedScore?: number;

  @ApiProperty({
    description: 'Selected level for checkbox indicators',
    example: 'Yes',
    required: false,
  })
  @IsOptional()
  @IsString()
  selectedLevel?: string;

  @ApiProperty({
    description: 'Additional notes for the indicator',
    example: 'គ្រូបានសរសេរលើក្តារបញ្ជាក់ច្បាស់',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateReflectionCommentDto {
  @ApiProperty({
    description: 'Type of reflection comment',
    example: 'strengths',
    enum: ['strengths', 'challenges', 'recommendations', 'general'],
  })
  @IsString()
  @IsNotEmpty()
  commentType: string;

  @ApiProperty({
    description: 'Content of the reflection comment',
    example: 'គ្រូចេះគ្រប់គ្រងថ្នាក់យ៉ាងមានប្រសិទ្ធភាព',
  })
  @IsString()
  @IsNotEmpty()
  commentContent: string;
}

export class CreateObservationSessionDto {
  @ApiProperty({
    description: 'Observation form ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  formId: string;

  @ApiProperty({
    description: 'School name',
    example: 'សាលាបឋមសិក្សា គម',
  })
  @IsString()
  @IsNotEmpty()
  schoolName: string;

  @ApiProperty({
    description: 'Teacher name',
    example: 'សុខ ប៊ុនធឿន',
  })
  @IsString()
  @IsNotEmpty()
  teacherName: string;

  @ApiProperty({
    description: 'Observer name',
    example: 'គ្រិស្ទីណា',
  })
  @IsString()
  @IsNotEmpty()
  observerName: string;

  @ApiProperty({
    description: 'Subject being observed',
    example: 'Khmer',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    description: 'Grade level',
    example: '1',
  })
  @IsString()
  @IsNotEmpty()
  grade: string;

  @ApiProperty({
    description: 'Date of observation',
    example: '2025-07-19',
  })
  @IsDateString()
  @IsNotEmpty()
  dateObserved: string;

  @ApiProperty({
    description: 'Start time of observation',
    example: '07:30',
  })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({
    description: 'End time of observation',
    example: '08:15',
  })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({
    description: 'Classification level',
    example: 'កម្រិត២',
  })
  @IsString()
  @IsNotEmpty()
  classificationLevel: string;

  @ApiProperty({
    description: 'Reflection summary',
    example: 'ការសង្កេតទូទៅ',
    required: false,
  })
  @IsOptional()
  @IsString()
  reflectionSummary?: string;

  @ApiProperty({
    description: 'Indicator responses',
    type: [CreateIndicatorResponseDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateIndicatorResponseDto)
  indicatorResponses?: CreateIndicatorResponseDto[];

  @ApiProperty({
    description: 'Reflection comments',
    type: [CreateReflectionCommentDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReflectionCommentDto)
  reflectionComments?: CreateReflectionCommentDto[];
}
