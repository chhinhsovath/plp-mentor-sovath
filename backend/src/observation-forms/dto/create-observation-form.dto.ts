import { IsString, IsNotEmpty, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLessonPhaseDto {
  @ApiProperty({
    description: 'Title of the lesson phase',
    example: 'សកម្មភាព១: ការណែនាំមេរៀន',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Order of the phase in the lesson',
    example: 1,
  })
  @IsNotEmpty()
  sectionOrder: number;

  @ApiProperty({
    description: 'Indicators for this phase',
    type: [Object],
    required: false,
  })
  @IsOptional()
  @IsArray()
  indicators?: CreateIndicatorDto[];
}

export class CreateCompetencyDomainDto {
  @ApiProperty({
    description: 'Subject for the competency domain',
    example: 'Khmer',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    description: 'Name of the competency domain',
    example: 'Reading Comprehension',
  })
  @IsString()
  @IsNotEmpty()
  domainName: string;

  @ApiProperty({
    description: 'Indicators for this domain',
    type: [Object],
    required: false,
  })
  @IsOptional()
  @IsArray()
  indicators?: CreateIndicatorDto[];
}

export class CreateIndicatorScaleDto {
  @ApiProperty({
    description: 'Scale label',
    example: 'ល្អ',
  })
  @IsString()
  @IsNotEmpty()
  scaleLabel: string;

  @ApiProperty({
    description: 'Scale description',
    example: 'គ្រូបានអនុវត្តយ៉ាងល្អ',
  })
  @IsString()
  @IsNotEmpty()
  scaleDescription: string;
}

export class CreateIndicatorDto {
  @ApiProperty({
    description: 'Indicator number',
    example: '១.១',
  })
  @IsString()
  @IsNotEmpty()
  indicatorNumber: string;

  @ApiProperty({
    description: 'Indicator text description',
    example: 'គ្រូណែនាំផែនការបង្រៀនដល់សិស្សយ៉ាងច្បាស់',
  })
  @IsString()
  @IsNotEmpty()
  indicatorText: string;

  @ApiProperty({
    description: 'Maximum score for this indicator',
    example: 3,
  })
  @IsNotEmpty()
  maxScore: number;

  @ApiProperty({
    description: 'Type of rubric (scale or checkbox)',
    example: 'scale',
    enum: ['scale', 'checkbox'],
  })
  @IsString()
  @IsNotEmpty()
  rubricType: 'scale' | 'checkbox';

  @ApiProperty({
    description: 'Scale definitions for this indicator',
    type: [CreateIndicatorScaleDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateIndicatorScaleDto)
  scales?: CreateIndicatorScaleDto[];
}

export class CreateObservationFormDto {
  @ApiProperty({
    description: 'Unique form code',
    example: 'G1-KH',
  })
  @IsString()
  @IsNotEmpty()
  formCode: string;

  @ApiProperty({
    description: 'Form title',
    example: 'ទម្រង់សង្កេតថ្នាក់ទី១ - ភាសាខ្មែរ',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Subject of the form',
    example: 'Khmer',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    description: 'Grade range for this form',
    example: '1',
  })
  @IsString()
  @IsNotEmpty()
  gradeRange: string;

  @ApiProperty({
    description: 'Lesson phases for this form',
    type: [CreateLessonPhaseDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLessonPhaseDto)
  lessonPhases?: CreateLessonPhaseDto[];

  @ApiProperty({
    description: 'Competency domains for this form',
    type: [CreateCompetencyDomainDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCompetencyDomainDto)
  competencyDomains?: CreateCompetencyDomainDto[];
}
