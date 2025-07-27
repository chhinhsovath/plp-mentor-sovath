import { IsOptional, IsEnum, IsNumber, IsDateString, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ImpactAssessmentFilterDto {
  @IsOptional()
  @IsEnum(['banteay-meanchey', 'battambang', 'pailin', 'oddar-meanchey', 'preah-vihear', 'stung-treng', 'ratanakiri', 'mondulkiri'])
  province?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  severity?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(['primary', 'lower-secondary', 'upper-secondary', 'high-school', 'technical', 'university', 'pagoda'])
  schoolType?: string;

  @IsOptional()
  @IsEnum(['pending', 'verified', 'rejected'])
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'submittedAt';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}