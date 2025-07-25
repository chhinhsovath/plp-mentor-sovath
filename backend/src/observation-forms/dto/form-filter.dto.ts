import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FormFilterDto {
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
    description: 'Search by form code or title',
    example: 'G1',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Include inactive forms',
    example: false,
    required: false,
  })
  @IsOptional()
  includeInactive?: boolean;
}
