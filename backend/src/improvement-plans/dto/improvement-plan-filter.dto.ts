import { IsOptional, IsString, IsDateString, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PlanStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
}

export class ImprovementPlanFilterDto {
  @ApiProperty({
    description: 'Filter by session ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @ApiProperty({
    description: 'Filter by teacher name',
    example: 'សុខ ប៊ុនធឿន',
    required: false,
  })
  @IsOptional()
  @IsString()
  teacherName?: string;

  @ApiProperty({
    description: 'Filter by school name',
    example: 'សាលាបឋមសិក្សា គម',
    required: false,
  })
  @IsOptional()
  @IsString()
  schoolName?: string;

  @ApiProperty({
    description: 'Filter by subject',
    example: 'Khmer',
    required: false,
  })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({
    description: 'Filter by responsible person',
    example: 'គ្រូ',
    required: false,
  })
  @IsOptional()
  @IsString()
  responsiblePerson?: string;

  @ApiProperty({
    description: 'Filter by plan status',
    enum: PlanStatus,
    example: PlanStatus.IN_PROGRESS,
    required: false,
  })
  @IsOptional()
  @IsEnum(PlanStatus)
  status?: PlanStatus;

  @ApiProperty({
    description: 'Filter by deadline from',
    example: '2025-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  deadlineFrom?: string;

  @ApiProperty({
    description: 'Filter by deadline to',
    example: '2025-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  deadlineTo?: string;

  @ApiProperty({
    description: 'Filter by follow-up date from',
    example: '2025-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  followUpFrom?: string;

  @ApiProperty({
    description: 'Filter by follow-up date to',
    example: '2025-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  followUpTo?: string;

  @ApiProperty({
    description: 'Search by lesson topic or challenges',
    example: 'ការចូលរួម',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Show only overdue items',
    example: true,
    required: false,
  })
  @IsOptional()
  showOverdueOnly?: boolean;

  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    required: false,
  })
  @IsOptional()
  page?: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    required: false,
  })
  @IsOptional()
  limit?: number;
}
