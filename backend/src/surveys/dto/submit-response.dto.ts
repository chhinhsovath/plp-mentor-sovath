import { IsArray, IsOptional, IsUUID, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class AnswerDto {
  @ApiProperty({ description: 'Question ID' })
  @IsUUID()
  questionId: string;

  @ApiProperty({ description: 'Answer value (can be any type)' })
  answer: any;

  @ApiPropertyOptional({ description: 'File uploads information' })
  @IsOptional()
  files?: Array<{
    originalName: string;
    filename: string;
    mimetype: string;
    size: number;
    path: string;
  }>;
}

export class SubmitResponseDto {
  @ApiProperty({ description: 'List of answers', type: [AnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];

  @ApiPropertyOptional({ description: 'Response metadata' })
  @IsOptional()
  metadata?: {
    userAgent?: string;
    location?: {
      latitude: number;
      longitude: number;
      accuracy?: number;
    };
    duration?: number;
    device?: string;
  };
}

export class SaveDraftResponseDto extends SubmitResponseDto {
  @ApiPropertyOptional({ description: 'Response UUID for updating existing draft' })
  @IsOptional()
  @IsUUID()
  responseId?: string;
}