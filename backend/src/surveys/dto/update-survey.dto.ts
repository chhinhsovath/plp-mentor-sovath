import { PartialType } from '@nestjs/swagger';
import { CreateSurveyDto } from './create-survey.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSurveyDto extends PartialType(CreateSurveyDto) {
  @ApiPropertyOptional({ description: 'Survey status', enum: ['draft', 'published', 'closed'] })
  @IsOptional()
  @IsEnum(['draft', 'published', 'closed'])
  status?: 'draft' | 'published' | 'closed';
}