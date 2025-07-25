import { PartialType } from '@nestjs/swagger';
import { CreateMissionDto } from './create-mission.dto';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMissionDto extends PartialType(CreateMissionDto) {
  @ApiPropertyOptional({ description: 'Completion report' })
  @IsOptional()
  @IsString()
  completionReport?: string;
}