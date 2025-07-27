import { IsString, IsEnum, IsArray, IsNumber, IsOptional, IsDateString, Min, Max, ValidateNested, IsNotEmpty, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

class GradeDataDto {
  @IsString()
  @IsNotEmpty()
  grade: string;

  @IsNumber()
  @Min(0)
  totalStudents: number;

  @IsNumber()
  @Min(0)
  affectedStudents: number;
}

class TotalsDto {
  @IsNumber()
  @Min(0)
  totalStudents: number;

  @IsNumber()
  @Min(0)
  totalAffected: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;
}

export class CreateImpactAssessmentDto {
  @IsString()
  @IsNotEmpty()
  schoolName: string;

  @IsEnum(['primary', 'lower-secondary', 'upper-secondary', 'high-school', 'technical', 'university', 'pagoda'])
  schoolType: string;

  @IsEnum(['banteay-meanchey', 'battambang', 'pailin', 'oddar-meanchey', 'preah-vihear', 'stung-treng', 'ratanakiri', 'mondulkiri'])
  province: string;

  @IsString()
  @IsNotEmpty()
  district: string;

  @IsString()
  @IsNotEmpty()
  commune: string;

  @IsString()
  @IsNotEmpty()
  village: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradeDataDto)
  @ArrayMinSize(1)
  gradeData: GradeDataDto[];

  @ValidateNested()
  @Type(() => TotalsDto)
  totals: TotalsDto;

  @IsArray()
  @IsEnum(['school-closure', 'student-evacuation', 'teacher-absence', 'infrastructure-damage', 
           'learning-disruption', 'psychological-impact', 'material-shortage', 'other'], { each: true })
  @ArrayMinSize(1)
  impactTypes: string[];

  @IsNumber()
  @Min(1)
  @Max(5)
  severity: number;

  @IsDateString()
  incidentDate: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  teacherAffected?: number;

  @IsOptional()
  @IsString()
  contactInfo?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  submittedBy?: string;
}