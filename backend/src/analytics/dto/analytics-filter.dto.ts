import {
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
  IsArray,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { SessionStatus } from '../../entities/observation-session.entity';
import { UserRole } from '../../entities/user.entity';

export class AnalyticsFilterDto {
  @ApiProperty({
    description: 'Start date for filtering data',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'End date for filtering data',
    example: '2024-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Zone ID to filter by',
    example: 'zone-001',
    required: false,
  })
  @IsOptional()
  @IsString()
  zoneId?: string;

  @ApiProperty({
    description: 'Province ID to filter by',
    example: 'province-001',
    required: false,
  })
  @IsOptional()
  @IsString()
  provinceId?: string;

  @ApiProperty({
    description: 'Department ID to filter by',
    example: 'dept-001',
    required: false,
  })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiProperty({
    description: 'Cluster ID to filter by',
    example: 'cluster-001',
    required: false,
  })
  @IsOptional()
  @IsString()
  clusterId?: string;

  @ApiProperty({
    description: 'School ID to filter by',
    example: 'school-001',
    required: false,
  })
  @IsOptional()
  @IsString()
  schoolId?: string;

  @ApiProperty({
    description: 'Grade levels to filter by',
    example: ['1', '2', '3'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  grades?: string[];

  @ApiProperty({
    description: 'Subjects to filter by',
    example: ['Math', 'Khmer', 'Science'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjects?: string[];

  @ApiProperty({
    description: 'Session statuses to filter by',
    enum: SessionStatus,
    example: [SessionStatus.COMPLETED, SessionStatus.APPROVED],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(SessionStatus, { each: true })
  statuses?: SessionStatus[];

  @ApiProperty({
    description: 'User roles to filter by',
    enum: UserRole,
    example: [UserRole.TEACHER, UserRole.DIRECTOR],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];

  @ApiProperty({
    description: 'Observer IDs to filter by',
    example: ['user-001', 'user-002'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  observerIds?: string[];

  @ApiProperty({
    description: 'Aggregation level for data grouping',
    example: 'monthly',
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    required: false,
  })
  @IsOptional()
  @IsString()
  aggregationLevel?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

  @ApiProperty({
    description: 'Metric types to include in analysis',
    example: ['performance', 'improvement', 'completion'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metricTypes?: string[];
}

export class ReportFilterDto extends AnalyticsFilterDto {
  @ApiProperty({
    description: 'Report format',
    example: 'pdf',
    enum: ['pdf', 'excel', 'csv'],
    required: false,
  })
  @IsOptional()
  @IsString()
  format?: 'pdf' | 'excel' | 'csv';

  @ApiProperty({
    description: 'Report template type',
    example: 'summary',
    enum: ['summary', 'detailed', 'trend', 'comparison'],
    required: false,
  })
  @IsOptional()
  @IsString()
  template?: 'summary' | 'detailed' | 'trend' | 'comparison';

  @ApiProperty({
    description: 'Include charts and visualizations',
    example: true,
    required: false,
  })
  @IsOptional()
  includeCharts?: boolean;

  @ApiProperty({
    description: 'Language for report generation',
    example: 'km',
    enum: ['en', 'km'],
    required: false,
  })
  @IsOptional()
  @IsString()
  language?: 'en' | 'km';
}

export class DashboardFilterDto {
  @ApiProperty({
    description: 'Dashboard view type',
    example: 'overview',
    enum: ['overview', 'performance', 'trends', 'comparison'],
    required: false,
  })
  @IsOptional()
  @IsString()
  viewType?: 'overview' | 'performance' | 'trends' | 'comparison';

  @ApiProperty({
    description: 'Time period for dashboard data',
    example: 'last_30_days',
    enum: ['last_7_days', 'last_30_days', 'last_90_days', 'last_year', 'custom'],
    required: false,
  })
  @IsOptional()
  @IsString()
  timePeriod?: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_year' | 'custom';

  @ApiProperty({
    description: 'Custom start date for dashboard (when timePeriod is custom)',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  customStartDate?: string;

  @ApiProperty({
    description: 'Custom end date for dashboard (when timePeriod is custom)',
    example: '2024-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  customEndDate?: string;

  @ApiProperty({
    description: 'Refresh interval in seconds',
    example: 300,
    minimum: 30,
    maximum: 3600,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(3600)
  @Transform(({ value }) => parseInt(value))
  refreshInterval?: number;
}

export class TrendAnalysisDto {
  @ApiProperty({
    description: 'Metric to analyze trends for',
    example: 'average_score',
    enum: ['average_score', 'completion_rate', 'improvement_rate', 'session_count'],
    required: true,
  })
  @IsString()
  metric: 'average_score' | 'completion_rate' | 'improvement_rate' | 'session_count';

  @ApiProperty({
    description: 'Time granularity for trend analysis',
    example: 'monthly',
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    required: false,
  })
  @IsOptional()
  @IsString()
  granularity?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

  @ApiProperty({
    description: 'Number of periods to analyze',
    example: 12,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  periods?: number;

  @ApiProperty({
    description: 'Include trend prediction',
    example: true,
    required: false,
  })
  @IsOptional()
  includePrediction?: boolean;
}

export class ComparisonDto {
  @ApiProperty({
    description: 'Entities to compare',
    example: ['school-001', 'school-002'],
    required: true,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  entityIds: string[];

  @ApiProperty({
    description: 'Entity type for comparison',
    example: 'school',
    enum: ['zone', 'province', 'department', 'cluster', 'school'],
    required: true,
  })
  @IsString()
  entityType: 'zone' | 'province' | 'department' | 'cluster' | 'school';

  @ApiProperty({
    description: 'Metrics to compare',
    example: ['average_score', 'completion_rate'],
    required: true,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  metrics: string[];

  @ApiProperty({
    description: 'Comparison period',
    example: 'last_quarter',
    enum: ['last_month', 'last_quarter', 'last_year', 'custom'],
    required: false,
  })
  @IsOptional()
  @IsString()
  period?: 'last_month' | 'last_quarter' | 'last_year' | 'custom';
}
