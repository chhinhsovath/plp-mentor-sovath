import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { DashboardFilterDto } from './dto/analytics-filter.dto';
import { DataAggregationService, PerformanceMetrics } from './data-aggregation.service';
import { TrendAnalysisService, TrendAnalysis } from './trend-analysis.service';

export interface DashboardData {
  overview: DashboardOverview;
  performanceMetrics: PerformanceMetrics;
  recentTrends: TrendAnalysis[];
  topPerformers: TopPerformer[];
  alerts: DashboardAlert[];
  quickStats: QuickStat[];
  chartData: ChartData[];
  lastUpdated: Date;
}

export interface DashboardOverview {
  totalSessions: number;
  totalUsers: number;
  averageScore: number;
  completionRate: number;
  improvementPlansActive: number;
  trendsDirection: 'up' | 'down' | 'stable';
  periodComparison: PeriodComparison;
}

export interface TopPerformer {
  id: string;
  name: string;
  nameKh: string;
  type: 'zone' | 'province' | 'department' | 'cluster' | 'school' | 'user';
  score: number;
  improvement: number;
  rank: number;
}

export interface DashboardAlert {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  titleKh: string;
  message: string;
  messageKh: string;
  priority: 'low' | 'medium' | 'high';
  entityId?: string;
  entityName?: string;
  actionRequired: boolean;
  createdAt: Date;
}

export interface QuickStat {
  label: string;
  labelKh: string;
  value: number;
  unit: string;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  icon: string;
  color: string;
}

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  titleKh: string;
  data: any[];
  labels: string[];
  datasets: ChartDataset[];
  options?: any;
}

export interface ChartDataset {
  label: string;
  labelKh: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  fill?: boolean;
}

export interface PeriodComparison {
  current: {
    period: string;
    sessions: number;
    averageScore: number;
    completionRate: number;
  };
  previous: {
    period: string;
    sessions: number;
    averageScore: number;
    completionRate: number;
  };
  changes: {
    sessions: number;
    averageScore: number;
    completionRate: number;
  };
}

@Injectable()
export class DashboardService {
  constructor(
    private dataAggregationService: DataAggregationService,
    private trendAnalysisService: TrendAnalysisService,
  ) {}

  async getDashboardData(currentUser: User, filterDto: DashboardFilterDto): Promise<DashboardData> {
    const { timePeriod = 'last_30_days', viewType = 'overview' } = filterDto;

    // Get date range based on time period
    const dateRange = this.getDateRange(
      timePeriod,
      filterDto.customStartDate,
      filterDto.customEndDate,
    );

    // Build analytics filter
    const analyticsFilter = {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    };

    // Get performance metrics
    const performanceMetrics = await this.dataAggregationService.getPerformanceMetrics(
      currentUser,
      analyticsFilter,
    );

    // Get overview data
    const overview = await this.getDashboardOverview(
      currentUser,
      analyticsFilter,
      performanceMetrics,
    );

    // Get recent trends
    const recentTrends = await this.getRecentTrends(currentUser, analyticsFilter);

    // Get top performers
    const topPerformers = await this.getTopPerformers(currentUser, analyticsFilter);

    // Generate alerts
    const alerts = await this.generateAlerts(currentUser, performanceMetrics, recentTrends);

    // Get quick stats
    const quickStats = this.generateQuickStats(performanceMetrics, overview.periodComparison);

    // Get chart data
    const chartData = await this.generateChartData(currentUser, analyticsFilter, viewType);

    return {
      overview,
      performanceMetrics,
      recentTrends,
      topPerformers,
      alerts,
      quickStats,
      chartData,
      lastUpdated: new Date(),
    };
  }

  async getRealtimeUpdates(currentUser: User): Promise<any> {
    // Get latest data for real-time updates
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const todayFilter = {
      startDate: today,
      endDate: today,
    };

    const todayMetrics = await this.dataAggregationService.getPerformanceMetrics(
      currentUser,
      todayFilter,
    );

    return {
      timestamp: now,
      todaySessions: todayMetrics.totalSessions,
      todayCompletions: todayMetrics.completedSessions,
      activeUsers: todayMetrics.activeUsers,
      averageScore: todayMetrics.averageScore,
    };
  }

  private async getDashboardOverview(
    currentUser: User,
    analyticsFilter: any,
    performanceMetrics: PerformanceMetrics,
  ): Promise<DashboardOverview> {
    // Get previous period for comparison
    const previousPeriodFilter = this.getPreviousPeriodFilter(analyticsFilter);
    const previousMetrics = await this.dataAggregationService.getPerformanceMetrics(
      currentUser,
      previousPeriodFilter,
    );

    // Calculate period comparison
    const periodComparison: PeriodComparison = {
      current: {
        period: 'Current Period',
        sessions: performanceMetrics.totalSessions,
        averageScore: performanceMetrics.averageScore,
        completionRate: performanceMetrics.completionRate,
      },
      previous: {
        period: 'Previous Period',
        sessions: previousMetrics.totalSessions,
        averageScore: previousMetrics.averageScore,
        completionRate: previousMetrics.completionRate,
      },
      changes: {
        sessions: performanceMetrics.totalSessions - previousMetrics.totalSessions,
        averageScore: performanceMetrics.averageScore - previousMetrics.averageScore,
        completionRate: performanceMetrics.completionRate - previousMetrics.completionRate,
      },
    };

    // Determine overall trends direction
    const trendsDirection = this.determineTrendsDirection(periodComparison.changes);

    return {
      totalSessions: performanceMetrics.totalSessions,
      totalUsers: performanceMetrics.activeUsers,
      averageScore: performanceMetrics.averageScore,
      completionRate: performanceMetrics.completionRate,
      improvementPlansActive: performanceMetrics.improvementPlansCreated,
      trendsDirection,
      periodComparison,
    };
  }

  private async getRecentTrends(currentUser: User, analyticsFilter: any): Promise<TrendAnalysis[]> {
    const metrics = ['average_score', 'completion_rate', 'session_count'];
    const trends: TrendAnalysis[] = [];

    for (const metric of metrics) {
      const trendAnalysis = await this.trendAnalysisService.analyzeTrend(
        currentUser,
        analyticsFilter,
        { metric: metric as any, granularity: 'weekly', periods: 8 },
      );
      trends.push(trendAnalysis);
    }

    return trends;
  }

  private async getTopPerformers(currentUser: User, analyticsFilter: any): Promise<TopPerformer[]> {
    // Get geographic performance for different entity types
    const entityTypes = ['school', 'cluster', 'department'];
    const topPerformers: TopPerformer[] = [];

    for (const entityType of entityTypes) {
      try {
        const geoPerformance = await this.dataAggregationService.getGeographicPerformance(
          currentUser,
          analyticsFilter,
          entityType,
        );

        // Take top 3 performers from each type
        geoPerformance.slice(0, 3).forEach((geo, index) => {
          topPerformers.push({
            id: geo.entityId,
            name: geo.entityName,
            nameKh: geo.entityNameKh,
            type: entityType as any,
            score: geo.averageScore,
            improvement: geo.improvementRate,
            rank: geo.ranking,
          });
        });
      } catch (error) {
        // Continue if entity type is not accessible for this user
        console.warn(
          `Could not get ${entityType} performance for user ${currentUser.id}:`,
          error.message,
        );
      }
    }

    // Sort by score and limit to top 10
    return topPerformers
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((performer, index) => ({ ...performer, rank: index + 1 }));
  }

  private async generateAlerts(
    currentUser: User,
    performanceMetrics: PerformanceMetrics,
    recentTrends: TrendAnalysis[],
  ): Promise<DashboardAlert[]> {
    const alerts: DashboardAlert[] = [];

    // Check for low completion rate
    if (performanceMetrics.completionRate < 70) {
      alerts.push({
        id: `completion-rate-${Date.now()}`,
        type: 'warning',
        title: 'Low Completion Rate',
        titleKh: 'អត្រាបញ្ចប់ទាប',
        message: `Completion rate is ${performanceMetrics.completionRate.toFixed(1)}%, below the 70% target`,
        messageKh: `អត្រាបញ្ចប់គឺ ${performanceMetrics.completionRate.toFixed(1)}% ក្រោមគោលដៅ 70%`,
        priority: 'high',
        actionRequired: true,
        createdAt: new Date(),
      });
    }

    // Check for declining trends
    recentTrends.forEach((trend) => {
      if (trend.overallTrend === 'down' && Math.abs(trend.overallChangePercent) > 10) {
        alerts.push({
          id: `trend-decline-${trend.metric}-${Date.now()}`,
          type: 'warning',
          title: `Declining ${trend.metricName}`,
          titleKh: `${trend.metricNameKh}កំពុងធ្លាក់ចុះ`,
          message: `${trend.metricName} has declined by ${Math.abs(trend.overallChangePercent).toFixed(1)}%`,
          messageKh: `${trend.metricNameKh} បានធ្លាក់ចុះ ${Math.abs(trend.overallChangePercent).toFixed(1)}%`,
          priority: 'medium',
          actionRequired: true,
          createdAt: new Date(),
        });
      }
    });

    // Check for low average score
    if (performanceMetrics.averageScore < 2.0) {
      alerts.push({
        id: `low-score-${Date.now()}`,
        type: 'error',
        title: 'Low Average Score',
        titleKh: 'ពិន្ទុមធ្យមទាប',
        message: `Average score is ${performanceMetrics.averageScore.toFixed(2)}, indicating need for improvement`,
        messageKh: `ពិន្ទុមធ្យមគឺ ${performanceMetrics.averageScore.toFixed(2)} បង្ហាញពីការត្រូវការកែលម្អ`,
        priority: 'high',
        actionRequired: true,
        createdAt: new Date(),
      });
    }

    // Check for positive trends
    recentTrends.forEach((trend) => {
      if (trend.overallTrend === 'up' && trend.overallChangePercent > 15) {
        alerts.push({
          id: `trend-improvement-${trend.metric}-${Date.now()}`,
          type: 'success',
          title: `Improving ${trend.metricName}`,
          titleKh: `${trend.metricNameKh}កំពុងប្រសើរឡើង`,
          message: `${trend.metricName} has improved by ${trend.overallChangePercent.toFixed(1)}%`,
          messageKh: `${trend.metricNameKh} បានប្រសើរឡើង ${trend.overallChangePercent.toFixed(1)}%`,
          priority: 'low',
          actionRequired: false,
          createdAt: new Date(),
        });
      }
    });

    return alerts.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private generateQuickStats(
    performanceMetrics: PerformanceMetrics,
    periodComparison: PeriodComparison,
  ): QuickStat[] {
    return [
      {
        label: 'Total Sessions',
        labelKh: 'វគ្គសរុប',
        value: performanceMetrics.totalSessions,
        unit: 'sessions',
        change: periodComparison.changes.sessions,
        changePercent:
          periodComparison.previous.sessions > 0
            ? (periodComparison.changes.sessions / periodComparison.previous.sessions) * 100
            : 0,
        trend:
          periodComparison.changes.sessions > 0
            ? 'up'
            : periodComparison.changes.sessions < 0
              ? 'down'
              : 'stable',
        icon: 'sessions',
        color: '#3B82F6',
      },
      {
        label: 'Average Score',
        labelKh: 'ពិន្ទុមធ្យម',
        value: performanceMetrics.averageScore,
        unit: 'points',
        change: periodComparison.changes.averageScore,
        changePercent:
          periodComparison.previous.averageScore > 0
            ? (periodComparison.changes.averageScore / periodComparison.previous.averageScore) * 100
            : 0,
        trend:
          periodComparison.changes.averageScore > 0.1
            ? 'up'
            : periodComparison.changes.averageScore < -0.1
              ? 'down'
              : 'stable',
        icon: 'score',
        color: '#10B981',
      },
      {
        label: 'Completion Rate',
        labelKh: 'អត្រាបញ្ចប់',
        value: performanceMetrics.completionRate,
        unit: '%',
        change: periodComparison.changes.completionRate,
        changePercent:
          periodComparison.previous.completionRate > 0
            ? (periodComparison.changes.completionRate / periodComparison.previous.completionRate) *
              100
            : 0,
        trend:
          periodComparison.changes.completionRate > 2
            ? 'up'
            : periodComparison.changes.completionRate < -2
              ? 'down'
              : 'stable',
        icon: 'completion',
        color: '#F59E0B',
      },
      {
        label: 'Active Users',
        labelKh: 'អ្នកប្រើប្រាស់សកម្ម',
        value: performanceMetrics.activeUsers,
        unit: 'users',
        change: 0, // Would need historical data
        changePercent: 0,
        trend: 'stable',
        icon: 'users',
        color: '#8B5CF6',
      },
    ];
  }

  private async generateChartData(
    currentUser: User,
    analyticsFilter: any,
    viewType: string,
  ): Promise<ChartData[]> {
    const chartData: ChartData[] = [];

    // Sessions over time chart
    const timeSeriesData = await this.dataAggregationService.getTimeSeriesData(
      currentUser,
      analyticsFilter,
      'monthly',
    );

    chartData.push({
      type: 'line',
      title: 'Sessions Over Time',
      titleKh: 'វគ្គតាមពេលវេលា',
      data: timeSeriesData,
      labels: timeSeriesData.map((d) => d.period),
      datasets: [
        {
          label: 'Total Sessions',
          labelKh: 'វគ្គសរុប',
          data: timeSeriesData.map((d) => d.totalSessions),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
        },
        {
          label: 'Completed Sessions',
          labelKh: 'វគ្គបញ្ចប់',
          data: timeSeriesData.map((d) => d.completedSessions),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
        },
      ],
    });

    // Average score trend chart
    chartData.push({
      type: 'area',
      title: 'Average Score Trend',
      titleKh: 'ទំនោរពិន្ទុមធ្យម',
      data: timeSeriesData,
      labels: timeSeriesData.map((d) => d.period),
      datasets: [
        {
          label: 'Average Score',
          labelKh: 'ពិន្ទុមធ្យម',
          data: timeSeriesData.map((d) => d.averageScore),
          borderColor: '#F59E0B',
          backgroundColor: 'rgba(245, 158, 11, 0.2)',
          fill: true,
        },
      ],
    });

    // Subject performance chart (if available)
    try {
      const subjectPerformance = await this.dataAggregationService.getSubjectPerformance(
        currentUser,
        analyticsFilter,
      );

      if (subjectPerformance.length > 0) {
        chartData.push({
          type: 'bar',
          title: 'Subject Performance',
          titleKh: 'ការអនុវត្តតាមមុខវិជ្ជា',
          data: subjectPerformance,
          labels: subjectPerformance.map((s) => s.subject),
          datasets: [
            {
              label: 'Average Score',
              labelKh: 'ពិន្ទុមធ្យម',
              data: subjectPerformance.map((s) => s.averageScore),
              backgroundColor: [
                '#3B82F6',
                '#10B981',
                '#F59E0B',
                '#EF4444',
                '#8B5CF6',
                '#EC4899',
                '#14B8A6',
              ],
            },
          ],
        });
      }
    } catch (error) {
      console.warn('Could not generate subject performance chart:', error.message);
    }

    return chartData;
  }

  private getDateRange(
    timePeriod: string,
    customStartDate?: string,
    customEndDate?: string,
  ): { startDate: string; endDate: string } {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];
    let startDate: string;

    switch (timePeriod) {
      case 'last_7_days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'last_30_days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'last_90_days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'last_year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'custom':
        startDate = customStartDate || endDate;
        return { startDate, endDate: customEndDate || endDate };
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    return { startDate, endDate };
  }

  private getPreviousPeriodFilter(currentFilter: any): any {
    const startDate = new Date(currentFilter.startDate);
    const endDate = new Date(currentFilter.endDate);
    const periodLength = endDate.getTime() - startDate.getTime();

    const previousEndDate = new Date(startDate.getTime() - 1);
    const previousStartDate = new Date(previousEndDate.getTime() - periodLength);

    return {
      startDate: previousStartDate.toISOString().split('T')[0],
      endDate: previousEndDate.toISOString().split('T')[0],
    };
  }

  private determineTrendsDirection(changes: any): 'up' | 'down' | 'stable' {
    const positiveChanges = [
      changes.sessions > 0,
      changes.averageScore > 0.1,
      changes.completionRate > 2,
    ].filter(Boolean).length;

    const negativeChanges = [
      changes.sessions < 0,
      changes.averageScore < -0.1,
      changes.completionRate < -2,
    ].filter(Boolean).length;

    if (positiveChanges > negativeChanges) return 'up';
    if (negativeChanges > positiveChanges) return 'down';
    return 'stable';
  }
}
