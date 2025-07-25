import { IsOptional, IsEnum, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SurveyFilterDto {
  @ApiPropertyOptional({ description: 'Filter by status', enum: ['draft', 'published', 'closed'] })
  @IsOptional()
  @IsEnum(['draft', 'published', 'closed'])
  status?: 'draft' | 'published' | 'closed';

  @ApiPropertyOptional({ description: 'Search by title or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by creator user ID' })
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiPropertyOptional({ description: 'Filter by created date from' })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by created date to' })
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiPropertyOptional({ description: 'Include only active surveys (published and within date range)' })
  @IsOptional()
  activeOnly?: boolean;
}