import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  Request,
  Response,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response as ExpressResponse } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../entities/user.entity';
import { AnalyticsService } from './analytics.service';
import { DataAggregationService } from './data-aggregation.service';
import { TrendAnalysisService } from './trend-analysis.service';
import { DashboardService } from './dashboard.service';
import { ReportGenerationService } from './report-generation.service';
import {
  AnalyticsFilterDto,
  ReportFilterDto,
  DashboardFilterDto,
  TrendAnalysisDto,
  ComparisonDto,
} from './dto/analytics-filter.dto';

@ApiTags('Analytics & Reporting')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly dataAggregationService: DataAggregationService,
    private readonly trendAnalysisService: TrendAnalysisService,
    private readonly dashboardService: DashboardService,
    private readonly reportGenerationService: ReportGenerationService,
  ) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get analytics overview with key insights and recommendations' })
  @ApiResponse({
    status: 200,
    description: 'Analytics overview retrieved successfully',
  })
  @Roles(
    UserRole.ADMINISTRATOR,
    UserRole.ZONE,
    UserRole.PROVINCIAL,
    UserRole.DEPARTMENT,
    UserRole.CLUSTER,
    UserRole.DIRECTOR,
  )
  async getAnalyticsOverview(
    @CurrentUser() currentUser: User,
    @Query() filterDto: AnalyticsFilterDto,
  ) {
    return this.analyticsService.getAnalyticsOverview(currentUser, filterDto);
  }

  @Get('performance-metrics')
  @ApiOperation({ summary: 'Get detailed performance metrics' })
  @ApiResponse({
    status: 200,
    description: 'Performance metrics retrieved successfully',
  })
  async getPerformanceMetrics(
    @CurrentUser() currentUser: User,
    @Query() filterDto: AnalyticsFilterDto,
  ) {
    return this.analyticsService.getPerformanceMetrics(currentUser, filterDto);
  }

  @Get('geographic-performance/:entityType')
  @ApiOperation({ summary: 'Get performance data by geographic entity type' })
  @ApiResponse({
    status: 200,
    description: 'Geographic performance data retrieved successfully',
  })
  @ApiQuery({ name: 'entityType', enum: ['zone', 'province', 'department', 'cluster', 'school'] })
  async getGeographicPerformance(
    @CurrentUser() currentUser: User,
    @Param('entityType') entityType: string,
    @Query() filterDto: AnalyticsFilterDto,
  ) {
    const validEntityTypes = ['zone', 'province', 'department', 'cluster', 'school'];
    if (!validEntityTypes.includes(entityType)) {
      throw new BadRequestException(
        `Invalid entity type. Must be one of: ${validEntityTypes.join(', ')}`,
      );
    }

    return this.dataAggregationService.getGeographicPerformance(currentUser, filterDto, entityType);
  }

  @Get('subject-performance')
  @ApiOperation({ summary: 'Get performance data by subject' })
  @ApiResponse({
    status: 200,
    description: 'Subject performance data retrieved successfully',
  })
  async getSubjectPerformance(
    @CurrentUser() currentUser: User,
    @Query() filterDto: AnalyticsFilterDto,
  ) {
    return this.dataAggregationService.getSubjectPerformance(currentUser, filterDto);
  }

  @Get('time-series')
  @ApiOperation({ summary: 'Get time series data for trend analysis' })
  @ApiResponse({
    status: 200,
    description: 'Time series data retrieved successfully',
  })
  @ApiQuery({
    name: 'granularity',
    enum: ['daily', 'weekly', 'monthly', 'quarterly'],
    required: false,
  })
  async getTimeSeriesData(
    @CurrentUser() currentUser: User,
    @Query() filterDto: AnalyticsFilterDto,
    @Query('granularity') granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' = 'monthly',
  ) {
    return this.dataAggregationService.getTimeSeriesData(currentUser, filterDto, granularity);
  }

  @Post('trend-analysis')
  @ApiOperation({ summary: 'Analyze trends for specific metrics' })
  @ApiResponse({
    status: 200,
    description: 'Trend analysis completed successfully',
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL, UserRole.DEPARTMENT)
  async analyzeTrend(
    @CurrentUser() currentUser: User,
    @Query() filterDto: AnalyticsFilterDto,
    @Body() trendDto: TrendAnalysisDto,
  ) {
    return this.analyticsService.getTrendAnalysis(currentUser, filterDto, trendDto);
  }

  @Post('comparison-analysis')
  @ApiOperation({ summary: 'Compare performance across entities' })
  @ApiResponse({
    status: 200,
    description: 'Comparison analysis completed successfully',
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL, UserRole.DEPARTMENT)
  async compareEntities(
    @CurrentUser() currentUser: User,
    @Query() filterDto: AnalyticsFilterDto,
    @Body() comparisonDto: ComparisonDto,
  ) {
    return this.analyticsService.getComparisonAnalysis(currentUser, filterDto, comparisonDto);
  }

  @Get('benchmarks/:entityType')
  @ApiOperation({ summary: 'Get benchmark data for entities' })
  @ApiResponse({
    status: 200,
    description: 'Benchmark data retrieved successfully',
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL, UserRole.DEPARTMENT)
  async getBenchmarkData(
    @CurrentUser() currentUser: User,
    @Param('entityType') entityType: string,
    @Query() filterDto: AnalyticsFilterDto,
  ) {
    const validEntityTypes = ['zone', 'province', 'department', 'cluster', 'school'];
    if (!validEntityTypes.includes(entityType)) {
      throw new BadRequestException(
        `Invalid entity type. Must be one of: ${validEntityTypes.join(', ')}`,
      );
    }

    return this.analyticsService.getBenchmarkData(currentUser, filterDto, entityType);
  }

  @Get('seasonal-analysis/:metric')
  @ApiOperation({ summary: 'Get seasonal analysis for a specific metric' })
  @ApiResponse({
    status: 200,
    description: 'Seasonal analysis retrieved successfully',
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL)
  async getSeasonalAnalysis(
    @CurrentUser() currentUser: User,
    @Param('metric') metric: string,
    @Query() filterDto: AnalyticsFilterDto,
  ) {
    const validMetrics = ['average_score', 'completion_rate', 'session_count', 'improvement_rate'];
    if (!validMetrics.includes(metric)) {
      throw new BadRequestException(`Invalid metric. Must be one of: ${validMetrics.join(', ')}`);
    }

    return this.analyticsService.getSeasonalAnalysis(currentUser, filterDto, metric);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard data with real-time metrics' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully',
  })
  async getDashboardData(@CurrentUser() currentUser: User, @Query() filterDto: DashboardFilterDto) {
    return this.analyticsService.getDashboardData(currentUser, filterDto);
  }

  @Get('dashboard/realtime')
  @ApiOperation({ summary: 'Get real-time updates for dashboard' })
  @ApiResponse({
    status: 200,
    description: 'Real-time updates retrieved successfully',
  })
  async getRealtimeUpdates(@CurrentUser() currentUser: User) {
    return this.analyticsService.getRealtimeUpdates(currentUser);
  }

  @Get('reports/templates')
  @ApiOperation({ summary: 'Get available report templates' })
  @ApiResponse({
    status: 200,
    description: 'Report templates retrieved successfully',
  })
  async getReportTemplates(@CurrentUser() currentUser: User) {
    return this.reportGenerationService.getAvailableTemplates(currentUser);
  }

  @Post('reports/generate')
  @ApiOperation({ summary: 'Generate and download report' })
  @ApiResponse({
    status: 200,
    description: 'Report generated successfully',
    headers: {
      'Content-Type': {
        description: 'MIME type of the generated report',
        schema: { type: 'string' },
      },
      'Content-Disposition': {
        description: 'Attachment filename',
        schema: { type: 'string' },
      },
    },
  })
  @Roles(
    UserRole.ADMINISTRATOR,
    UserRole.ZONE,
    UserRole.PROVINCIAL,
    UserRole.DEPARTMENT,
    UserRole.CLUSTER,
    UserRole.DIRECTOR,
  )
  async generateReport(
    @CurrentUser() currentUser: User,
    @Body() filterDto: ReportFilterDto,
    @Response() response: ExpressResponse,
  ) {
    await this.reportGenerationService.generateReport(currentUser, filterDto, response);
  }

  @Post('reports/custom')
  @ApiOperation({ summary: 'Generate custom report with selected sections' })
  @ApiResponse({
    status: 200,
    description: 'Custom report generated successfully',
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL, UserRole.DEPARTMENT)
  async generateCustomReport(
    @CurrentUser() currentUser: User,
    @Body() body: { sections: string[]; filters: ReportFilterDto },
    @Response() response: ExpressResponse,
  ) {
    const { sections, filters } = body;

    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      throw new BadRequestException('Sections array is required and must not be empty');
    }

    await this.reportGenerationService.generateCustomReport(
      currentUser,
      sections,
      filters,
      response,
    );
  }

  @Get('export/data')
  @ApiOperation({ summary: 'Export raw data in CSV format' })
  @ApiResponse({
    status: 200,
    description: 'Data exported successfully',
    headers: {
      'Content-Type': {
        description: 'text/csv',
        schema: { type: 'string' },
      },
    },
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL, UserRole.DEPARTMENT)
  async exportData(
    @CurrentUser() currentUser: User,
    @Query() filterDto: AnalyticsFilterDto,
    @Query('type') dataType: 'sessions' | 'responses' | 'plans' = 'sessions',
    @Response() response: ExpressResponse,
  ) {
    // This would implement raw data export functionality
    // For now, we'll return a simple CSV with performance metrics
    const performanceMetrics = await this.analyticsService.getPerformanceMetrics(
      currentUser,
      filterDto,
    );

    const csvData = [
      ['Metric', 'Value'],
      ['Total Sessions', performanceMetrics.totalSessions.toString()],
      ['Completed Sessions', performanceMetrics.completedSessions.toString()],
      ['Average Score', performanceMetrics.averageScore.toFixed(2)],
      ['Completion Rate', `${performanceMetrics.completionRate.toFixed(1)}%`],
      ['Improvement Plans Created', performanceMetrics.improvementPlansCreated.toString()],
      ['Active Users', performanceMetrics.activeUsers.toString()],
    ];

    const csvContent = csvData.map((row) => row.join(',')).join('\n');

    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="analytics_data_${new Date().toISOString().split('T')[0]}.csv"`,
    );
    response.write('\ufeff'); // BOM for proper UTF-8 encoding
    response.end(csvContent);
  }

  @Get('insights')
  @ApiOperation({ summary: 'Get AI-generated insights and recommendations' })
  @ApiResponse({
    status: 200,
    description: 'Insights retrieved successfully',
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL, UserRole.DEPARTMENT)
  async getInsights(@CurrentUser() currentUser: User, @Query() filterDto: AnalyticsFilterDto) {
    const overview = await this.analyticsService.getAnalyticsOverview(currentUser, filterDto);
    return {
      insights: overview.topInsights,
      recommendations: overview.recommendations,
      alerts: overview.alerts,
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Get analytics system health status' })
  @ApiResponse({
    status: 200,
    description: 'System health status retrieved successfully',
  })
  @Roles(UserRole.ADMINISTRATOR)
  async getSystemHealth(@CurrentUser() currentUser: User) {
    // Basic health check - in production, this would check database connections,
    // cache status, external service availability, etc.
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date(),
      services: {
        database: 'healthy',
        cache: 'healthy',
        analytics: 'healthy',
        reporting: 'healthy',
      },
      metrics: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        version: process.version,
      },
    };

    return healthStatus;
  }
}
