import { IsOptional, IsString, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SessionStatus } from '../../entities/observation-session.entity';

export class SessionFilterDto {
  @ApiProperty({
    description: 'Filter by observer ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  observerId?: string;

  @ApiProperty({
    description: 'Filter by school name',
    example: 'សាលាបឋមសិក្សា គម',
    required: false,
  })
  @IsOptional()
  @IsString()
  schoolName?: string;

  @ApiProperty({
    description: 'Filter by teacher name',
    example: 'សុខ ប៊ុនធឿន',
    required: false,
  })
  @IsOptional()
  @IsString()
  teacherName?: string;

  @ApiProperty({
    description: 'Filter by subject',
    example: 'Khmer',
    required: false,
  })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({
    description: 'Filter by grade',
    example: '1',
    required: false,
  })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiProperty({
    description: 'Filter by session status',
    enum: SessionStatus,
    example: SessionStatus.COMPLETED,
    required: false,
  })
  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @ApiProperty({
    description: 'Filter by date from',
    example: '2025-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiProperty({
    description: 'Filter by date to',
    example: '2025-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiProperty({
    description: 'Search by teacher or school name',
    example: 'សុខ',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

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
