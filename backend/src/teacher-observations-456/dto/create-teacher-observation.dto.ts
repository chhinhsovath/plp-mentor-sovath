import { IsString, IsOptional, IsDateString, IsObject, IsNumber, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class StudentCount {
  @ApiProperty()
  @IsNumber()
  male: number;

  @ApiProperty()
  @IsNumber()
  female: number;
}

class StudentCountsDto {
  @ApiProperty()
  @ValidateNested()
  @Type(() => StudentCount)
  grade1: StudentCount;

  @ApiProperty()
  @ValidateNested()
  @Type(() => StudentCount)
  grade2: StudentCount;

  @ApiProperty()
  @ValidateNested()
  @Type(() => StudentCount)
  grade3: StudentCount;

  @ApiProperty()
  @ValidateNested()
  @Type(() => StudentCount)
  grade4: StudentCount;

  @ApiProperty()
  @ValidateNested()
  @Type(() => StudentCount)
  grade5: StudentCount;

  @ApiProperty()
  @ValidateNested()
  @Type(() => StudentCount)
  grade6: StudentCount;
}

export class CreateTeacherObservationDto {
  @ApiProperty()
  @IsString()
  schoolName: string;

  @ApiProperty()
  @IsString()
  schoolCode: string;

  @ApiProperty()
  @IsString()
  village: string;

  @ApiProperty()
  @IsString()
  commune: string;

  @ApiProperty()
  @IsString()
  district: string;

  @ApiProperty()
  @IsString()
  province: string;

  @ApiProperty()
  @IsString()
  cluster: string;

  @ApiProperty()
  @IsString()
  observerName: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  observerCode?: string;

  @ApiProperty()
  @IsString()
  observerPosition: string;

  @ApiProperty()
  @IsDateString()
  observationDate: string;

  @ApiProperty()
  @IsString()
  grade: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  group?: string;

  @ApiProperty()
  @IsString()
  classType: string;

  @ApiProperty()
  @IsString()
  subject: string;

  @ApiProperty()
  @IsString()
  teacherName: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  teacherCode?: string;

  @ApiProperty()
  @IsString()
  teacherGender: string;

  @ApiProperty()
  @IsString()
  startTime: string;

  @ApiProperty()
  @IsString()
  endTime: string;

  @ApiProperty()
  @IsString()
  topic: string;

  @ApiProperty()
  @IsObject()
  introductionScores: Record<string, number>;

  @ApiProperty()
  @IsObject()
  teachingScores: Record<string, number>;

  @ApiProperty()
  @IsObject()
  learningScores: Record<string, number>;

  @ApiProperty()
  @IsObject()
  assessmentScores: Record<string, number>;

  @ApiProperty()
  @ValidateNested()
  @Type(() => StudentCountsDto)
  studentCounts: StudentCountsDto;

  @ApiProperty()
  @IsNumber()
  totalStudents: number;

  @ApiProperty()
  @IsNumber()
  presentStudents: number;

  @ApiProperty()
  @IsNumber()
  absentStudents: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  comments?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  teachingImprovements?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  principalSupport?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  clusterSupport?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  observerSignature?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  teacherSignature?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  observerId?: string;
}