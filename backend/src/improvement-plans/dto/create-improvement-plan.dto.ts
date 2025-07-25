import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateImprovementActionDto {
  @ApiProperty({
    description: 'Description of the improvement action',
    example: 'ពង្រឹងការណែនាំសិស្សតាមផែនការច្បាស់',
  })
  @IsString()
  @IsNotEmpty()
  actionDescription: string;

  @ApiProperty({
    description: 'Person responsible for the action',
    example: 'គ្រូ',
  })
  @IsString()
  @IsNotEmpty()
  responsiblePerson: string;

  @ApiProperty({
    description: 'Deadline for the action',
    example: '2025-08-01',
  })
  @IsDateString()
  @IsNotEmpty()
  deadline: string;
}

export class CreateFollowUpActivityDto {
  @ApiProperty({
    description: 'Follow-up date',
    example: '2025-08-10',
  })
  @IsDateString()
  @IsNotEmpty()
  followUpDate: string;

  @ApiProperty({
    description: 'Follow-up method',
    example: 'សង្កេតម្តងទៀត',
  })
  @IsString()
  @IsNotEmpty()
  method: string;

  @ApiProperty({
    description: 'Additional comments',
    example: 'ត្រូវសង្កេតសកម្មភាពក្រុម',
    required: false,
  })
  @IsOptional()
  @IsString()
  comments?: string;
}

export class CreateImprovementPlanDto {
  @ApiProperty({
    description: 'Observation session ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    description: 'Lesson topic for improvement',
    example: 'ការបង្កើនការចូលរួមរបស់សិស្ស',
    required: false,
  })
  @IsOptional()
  @IsString()
  lessonTopic?: string;

  @ApiProperty({
    description: 'Identified challenges',
    example: 'សិស្សមិនអ៊ុកអ៊ូកក្នុងសកម្មភាពក្រុម',
    required: false,
  })
  @IsOptional()
  @IsString()
  challenges?: string;

  @ApiProperty({
    description: 'Identified strengths',
    example: 'គ្រូមានការរៀបចំបង្រៀនល្អ',
    required: false,
  })
  @IsOptional()
  @IsString()
  strengths?: string;

  @ApiProperty({
    description: 'Additional notes',
    example: 'ត្រូវការការគាំទ្របន្ថែម',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Improvement actions',
    type: [CreateImprovementActionDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateImprovementActionDto)
  actions?: CreateImprovementActionDto[];

  @ApiProperty({
    description: 'Follow-up activities',
    type: [CreateFollowUpActivityDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFollowUpActivityDto)
  followUpActivities?: CreateFollowUpActivityDto[];
}
