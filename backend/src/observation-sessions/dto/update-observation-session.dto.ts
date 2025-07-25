import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateObservationSessionDto } from './create-observation-session.dto';
import { SessionStatus } from '../../entities/observation-session.entity';

export class UpdateObservationSessionDto extends PartialType(CreateObservationSessionDto) {
  @ApiProperty({
    description: 'Session status',
    enum: SessionStatus,
    example: SessionStatus.IN_PROGRESS,
    required: false,
  })
  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;
}
