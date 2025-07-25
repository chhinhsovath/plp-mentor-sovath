import { IsString, IsEnum, IsDate, IsOptional, IsNumber, IsArray, IsBoolean, IsUUID, ValidateNested, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { MissionType, MissionStatus } from '../../entities/mission.entity';

export class CreateMissionDto {
  @ApiProperty({ description: 'Mission title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Mission description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: MissionType, description: 'Type of mission' })
  @IsEnum(MissionType)
  type: MissionType;

  @ApiProperty({ description: 'Start date of the mission' })
  @Transform(({ value }) => new Date(value))
  @IsDate()
  startDate: Date;

  @ApiProperty({ description: 'End date of the mission' })
  @Transform(({ value }) => new Date(value))
  @IsDate()
  endDate: Date;

  @ApiPropertyOptional({ description: 'Mission location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Location latitude' })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Location longitude' })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Purpose of the mission' })
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional({ description: 'Mission objectives' })
  @IsOptional()
  @IsString()
  objectives?: string;

  @ApiPropertyOptional({ description: 'Expected outcomes' })
  @IsOptional()
  @IsString()
  expectedOutcomes?: string;

  @ApiPropertyOptional({ description: 'Mission budget' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @ApiPropertyOptional({ description: 'Transportation details' })
  @IsOptional()
  @IsString()
  transportationDetails?: string;

  @ApiPropertyOptional({ description: 'Accommodation details' })
  @IsOptional()
  @IsString()
  accommodationDetails?: string;

  @ApiPropertyOptional({ description: 'List of participant user IDs' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  participants?: string[];

  @ApiPropertyOptional({ description: 'Attachments URLs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}

export class AddParticipantDto {
  @ApiProperty({ description: 'User ID of the participant' })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ description: 'Role of the participant', default: 'participant' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ description: 'Is the participant a leader', default: false })
  @IsOptional()
  @IsBoolean()
  isLeader?: boolean;
}

export class UpdateMissionStatusDto {
  @ApiProperty({ enum: MissionStatus, description: 'New status of the mission' })
  @IsEnum(MissionStatus)
  status: MissionStatus;

  @ApiPropertyOptional({ description: 'Comments for approval' })
  @IsOptional()
  @IsString()
  approvalComments?: string;

  @ApiPropertyOptional({ description: 'Reason for rejection' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class MissionTrackingDto {
  @ApiProperty({ description: 'Latitude' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ description: 'Longitude' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({ description: 'GPS accuracy in meters' })
  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @ApiProperty({ description: 'Activity being performed' })
  @IsString()
  activity: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}