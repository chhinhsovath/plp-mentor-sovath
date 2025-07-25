import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObservationSession, SessionStatus } from '../entities/observation-session.entity';
import { IndicatorResponse } from '../entities/indicator-response.entity';
import { ImprovementPlan } from '../entities/improvement-plan.entity';
import { User } from '../entities/user.entity';
import { AnalyticsFilterDto, TrendAnalysisDto } from './dto/analytics-filter.dto';
import { DataFilteringService } from '../hierarchy/data-filtering.service';

export interface TrendData {
  period: string;
  date: Date;
  value: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

export interface TrendAnalysis {
  metric: string;
  metricName: string;
  metricNameKh: string;
  currentValue: number;
  previousValue: number;
  overallChange: number;
  overallChangePercent: number;
  overallTrend: 'up' | 'down' | 'stable';
  data: TrendData[];
  prediction?: TrendPrediction;
  insights: TrendInsight[];
}

export interface TrendPrediction {
  nextPeriod: string;
  predictedValue: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
}

export interface TrendInsight {
  type: 'improvement' | 'decline' | 'stable' | 'seasonal' | 'anomaly';
  message: string;
  messageKh: string;
  severity: 'low' | 'medium' | 'high';
  period?: string;
  value?: number;
}

export interface ComparisonAnalysis {
  entities: ComparisonEntity[];
  metrics: ComparisonMetric[];
  insights: ComparisonInsight[];
  rankings: EntityRanking[];
}

export interface ComparisonEntity {
  id: string;
  name: string;
  nameKh: string;
  type: string;
  metrics: { [key: string]: number };
}

export interface ComparisonMetric {
  name: string;
  nameKh: string;
  unit: string;
  best: number;
  worst: number;
  average: number;
  standardDeviation: number;
}

export interface ComparisonInsight {
  type: 'leader' | 'laggard' | 'improvement' | 'concern';
  entityId: string;
  entityName: string;
  metric: string;
  value: number;
  message: string;
  messageKh: string;
}

export interface EntityRanking {
  entityId: string;
  entityName: string;
  entityNameKh: string;
  overallScore: number;
  rank: number;
  metricRankings: { [key: string]: number };
}

@Injectable()
export class TrendAnalysisService {
  constructor(
    @InjectRepository(ObservationSession)
    private sessionRepository: Repository<ObservationSession>,
    @InjectRepository(IndicatorResponse)
    private responseRepository: Repository<IndicatorResponse>,
    @InjectRepository(ImprovementPlan)
    private planRepository: Repository<ImprovementPlan>,
    private dataFilteringService: DataFilteringService,
  ) {}

  async analyzeTrend(
    currentUser: User,
    filterDto: AnalyticsFilterDto,
    trendDto: TrendAnalysisDto,
  ): Promise<TrendAnalysis> {
    const { metric, granularity = 'monthly', periods = 12, includePrediction = false } = trendDto;

    // Get time series data for the metric
    const timeSeriesData = await this.getTimeSeriesForMetric(
      currentUser,
      filterDto,
      metric,
      granularity,
      periods,
    );

    // Calculate trends and changes
    const trendData = this.calculateTrendData(timeSeriesData);

    // Generate insights
    const insights = this.generateTrendInsights(trendData, metric);

    // Calculate overall trend
    const currentValue = trendData.length > 0 ? trendData[trendData.length - 1].value : 0;
    const previousValue = trendData.length > 1 ? trendData[trendData.length - 2].value : 0;
    const overallChange = currentValue - previousValue;
    const overallChangePercent = previousValue !== 0 ? (overallChange / previousValue) * 100 : 0;
    const overallTrend = this.determineTrend(overallChangePercent);

    // Generate prediction if requested
    let prediction: TrendPrediction | undefined;
    if (includePrediction) {
      prediction = this.generatePrediction(trendData, granularity);
    }

    return {
      metric,
      metricName: this.getMetricName(metric),
      metricNameKh: this.getMetricNameKh(metric),
      currentValue,
      previousValue,
      overallChange,
      overallChangePercent,
      overallTrend,
      data: trendData,
      prediction,
      insights,
    };
  }

  async compareEntities(
    currentUser: User,
    filterDto: AnalyticsFilterDto,
    entityIds: string[],
    entityType: string,
    metrics: string[],
  ): Promise<ComparisonAnalysis> {
    const entities: ComparisonEntity[] = [];
    const metricData: { [key: string]: number[] } = {};

    // Initialize metric data arrays
    metrics.forEach((metric) => {
      metricData[metric] = [];
    });

    // Get data for each entity
    for (const entityId of entityIds) {
      const entityFilter = { ...filterDto, [`${entityType}Id`]: entityId };
      const entityMetrics: { [key: string]: number } = {};

      for (const metric of metrics) {
        const value = await this.getMetricValue(currentUser, entityFilter, metric);
        entityMetrics[metric] = value;
        metricData[metric].push(value);
      }

      entities.push({
        id: entityId,
        name: this.getEntityName(entityType, entityId),
        nameKh: this.getEntityNameKh(entityType, entityId),
        type: entityType,
        metrics: entityMetrics,
      });
    }

    // Calculate metric statistics
    const comparisonMetrics: ComparisonMetric[] = metrics.map((metric) => {
      const values = metricData[metric];
      const best = Math.max(...values);
      const worst = Math.min(...values);
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance =
        values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;
      const standardDeviation = Math.sqrt(variance);

      return {
        name: metric,
        nameKh: this.getMetricNameKh(metric),
        unit: this.getMetricUnit(metric),
        best,
        worst,
        average,
        standardDeviation,
      };
    });

    // Generate insights
    const insights = this.generateComparisonInsights(entities, comparisonMetrics);

    // Calculate rankings
    const rankings = this.calculateEntityRankings(entities, metrics);

    return {
      entities,
      metrics: comparisonMetrics,
      insights,
      rankings,
    };
  }

  async getSeasonalAnalysis(
    currentUser: User,
    filterDto: AnalyticsFilterDto,
    metric: string,
  ): Promise<any> {
    // Get monthly data for seasonal analysis
    const monthlyData = await this.getTimeSeriesForMetric(
      currentUser,
      filterDto,
      metric,
      'monthly',
      24, // 2 years of data
    );

    // Group by month to identify seasonal patterns
    const seasonalData = new Map<number, number[]>();

    monthlyData.forEach((data) => {
      const month = new Date(data.date).getMonth() + 1;
      if (!seasonalData.has(month)) {
        seasonalData.set(month, []);
      }
      seasonalData.get(month)!.push(data.value);
    });

    // Calculate seasonal averages and variations
    const seasonalAnalysis = Array.from(seasonalData.entries()).map(([month, values]) => {
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance =
        values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;

      return {
        month,
        monthName: this.getMonthName(month),
        monthNameKh: this.getMonthNameKh(month),
        average,
        variance: Math.sqrt(variance),
        dataPoints: values.length,
      };
    });

    return {
      metric,
      metricName: this.getMetricName(metric),
      metricNameKh: this.getMetricNameKh(metric),
      seasonalData: seasonalAnalysis,
      insights: this.generateSeasonalInsights(seasonalAnalysis),
    };
  }

  private async getTimeSeriesForMetric(
    currentUser: User,
    filterDto: AnalyticsFilterDto,
    metric: string,
    granularity: string,
    periods: number,
  ): Promise<any[]> {
    const dateFormat = this.getDateFormat(granularity);
    let query;

    switch (metric) {
      case 'average_score':
        query = this.responseRepository
          .createQueryBuilder('response')
          .select([
            `DATE_FORMAT(session.dateObserved, '${dateFormat}') as period`,
            'session.dateObserved as date',
            'AVG(response.selectedScore) as value',
          ])
          .innerJoin('response.session', 'session')
          .where('response.selectedScore IS NOT NULL')
          .groupBy('period')
          .orderBy('session.dateObserved', 'DESC')
          .limit(periods);
        break;

      case 'completion_rate':
        query = this.sessionRepository
          .createQueryBuilder('session')
          .select([
            `DATE_FORMAT(session.dateObserved, '${dateFormat}') as period`,
            'session.dateObserved as date',
            '(COUNT(CASE WHEN session.status = :completedStatus THEN 1 END) * 100.0 / COUNT(session.id)) as value',
          ])
          .groupBy('period')
          .orderBy('session.dateObserved', 'DESC')
          .limit(periods);

        query.setParameter('completedStatus', SessionStatus.COMPLETED);
        break;

      case 'session_count':
        query = this.sessionRepository
          .createQueryBuilder('session')
          .select([
            `DATE_FORMAT(session.dateObserved, '${dateFormat}') as period`,
            'session.dateObserved as date',
            'COUNT(session.id) as value',
          ])
          .groupBy('period')
          .orderBy('session.dateObserved', 'DESC')
          .limit(periods);
        break;

      case 'improvement_rate':
        query = this.planRepository
          .createQueryBuilder('plan')
          .select([
            `DATE_FORMAT(session.dateObserved, '${dateFormat}') as period`,
            'session.dateObserved as date',
            'COUNT(plan.id) as value',
          ])
          .innerJoin('plan.session', 'session')
          .groupBy('period')
          .orderBy('session.dateObserved', 'DESC')
          .limit(periods);
        break;

      default:
        throw new Error(`Unsupported metric: ${metric}`);
    }

    // Apply hierarchical filtering
    await this.dataFilteringService.applyHierarchicalFiltering(query, currentUser, 'session');
    this.applyFilters(query, filterDto);

    const results = await query.getRawMany();

    return results.reverse().map((result) => ({
      period: result.period,
      date: new Date(result.date),
      value: parseFloat(result.value) || 0,
    }));
  }

  private calculateTrendData(timeSeriesData: any[]): TrendData[] {
    return timeSeriesData.map((data, index) => {
      const previousValue = index > 0 ? timeSeriesData[index - 1].value : data.value;
      const change = data.value - previousValue;
      const changePercent = previousValue !== 0 ? (change / previousValue) * 100 : 0;
      const trend = this.determineTrend(changePercent);

      return {
        period: data.period,
        date: data.date,
        value: data.value,
        change,
        changePercent,
        trend,
      };
    });
  }

  private generateTrendInsights(trendData: TrendData[], metric: string): TrendInsight[] {
    const insights: TrendInsight[] = [];

    if (trendData.length < 2) return insights;

    // Find significant changes
    const significantChanges = trendData.filter((data) => Math.abs(data.changePercent) > 10);

    significantChanges.forEach((change) => {
      const type = change.changePercent > 0 ? 'improvement' : 'decline';
      const severity = Math.abs(change.changePercent) > 25 ? 'high' : 'medium';

      insights.push({
        type,
        message: `Significant ${type} of ${Math.abs(change.changePercent).toFixed(1)}% in ${change.period}`,
        messageKh: `ការ${type === 'improvement' ? 'ប្រសើរឡើង' : 'ធ្លាក់ចុះ'}យ៉ាងខ្លាំង ${Math.abs(change.changePercent).toFixed(1)}% ក្នុង ${change.period}`,
        severity,
        period: change.period,
        value: change.value,
      });
    });

    // Detect overall trend
    const recentTrends = trendData.slice(-3).map((d) => d.trend);
    const consistentTrend = recentTrends.every((t) => t === recentTrends[0]);

    if (consistentTrend && recentTrends[0] !== 'stable') {
      insights.push({
        type: recentTrends[0] === 'up' ? 'improvement' : 'decline',
        message: `Consistent ${recentTrends[0] === 'up' ? 'improvement' : 'decline'} trend over recent periods`,
        messageKh: `ទំនោរ${recentTrends[0] === 'up' ? 'ប្រសើរឡើង' : 'ធ្លាក់ចុះ'}ជាប់ៗគ្នាក្នុងរយៈពេលថ្មីៗ`,
        severity: 'medium',
      });
    }

    return insights;
  }

  private generatePrediction(trendData: TrendData[], granularity: string): TrendPrediction {
    if (trendData.length < 3) {
      return {
        nextPeriod: 'N/A',
        predictedValue: 0,
        confidence: 0,
        trend: 'stable',
      };
    }

    // Simple linear regression for prediction
    const recentData = trendData.slice(-6); // Use last 6 periods
    const n = recentData.length;

    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumXX = 0;

    recentData.forEach((data, index) => {
      const x = index;
      const y = data.value;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const predictedValue = slope * n + intercept;
    const trend = slope > 0.1 ? 'up' : slope < -0.1 ? 'down' : 'stable';

    // Calculate confidence based on R-squared
    const meanY = sumY / n;
    let ssRes = 0,
      ssTot = 0;

    recentData.forEach((data, index) => {
      const predicted = slope * index + intercept;
      ssRes += Math.pow(data.value - predicted, 2);
      ssTot += Math.pow(data.value - meanY, 2);
    });

    const rSquared = 1 - ssRes / ssTot;
    const confidence = Math.max(0, Math.min(100, rSquared * 100));

    return {
      nextPeriod: this.getNextPeriod(trendData[trendData.length - 1].period, granularity),
      predictedValue: Math.max(0, predictedValue),
      confidence,
      trend,
    };
  }

  private async getMetricValue(
    currentUser: User,
    filterDto: AnalyticsFilterDto,
    metric: string,
  ): Promise<number> {
    const timeSeriesData = await this.getTimeSeriesForMetric(
      currentUser,
      filterDto,
      metric,
      'monthly',
      1,
    );

    return timeSeriesData.length > 0 ? timeSeriesData[0].value : 0;
  }

  private generateComparisonInsights(
    entities: ComparisonEntity[],
    metrics: ComparisonMetric[],
  ): ComparisonInsight[] {
    const insights: ComparisonInsight[] = [];

    metrics.forEach((metric) => {
      // Find best and worst performers
      const sortedEntities = entities.sort(
        (a, b) => b.metrics[metric.name] - a.metrics[metric.name],
      );
      const leader = sortedEntities[0];
      const laggard = sortedEntities[sortedEntities.length - 1];

      if (leader.metrics[metric.name] > metric.average * 1.2) {
        insights.push({
          type: 'leader',
          entityId: leader.id,
          entityName: leader.name,
          metric: metric.name,
          value: leader.metrics[metric.name],
          message: `${leader.name} leads in ${metric.name} with ${leader.metrics[metric.name].toFixed(2)}`,
          messageKh: `${leader.nameKh} នាំមុខក្នុង ${metric.nameKh} ជាមួយ ${leader.metrics[metric.name].toFixed(2)}`,
        });
      }

      if (laggard.metrics[metric.name] < metric.average * 0.8) {
        insights.push({
          type: 'laggard',
          entityId: laggard.id,
          entityName: laggard.name,
          metric: metric.name,
          value: laggard.metrics[metric.name],
          message: `${laggard.name} needs improvement in ${metric.name}`,
          messageKh: `${laggard.nameKh} ត្រូវការកែលម្អក្នុង ${metric.nameKh}`,
        });
      }
    });

    return insights;
  }

  private calculateEntityRankings(
    entities: ComparisonEntity[],
    metrics: string[],
  ): EntityRanking[] {
    return entities
      .map((entity) => {
        const metricRankings: { [key: string]: number } = {};
        let totalScore = 0;

        metrics.forEach((metric) => {
          const sortedByMetric = entities.sort((a, b) => b.metrics[metric] - a.metrics[metric]);
          const rank = sortedByMetric.findIndex((e) => e.id === entity.id) + 1;
          metricRankings[metric] = rank;
          totalScore += entities.length - rank + 1; // Higher score for better rank
        });

        return {
          entityId: entity.id,
          entityName: entity.name,
          entityNameKh: entity.nameKh,
          overallScore: totalScore / metrics.length,
          rank: 0, // Will be calculated after sorting
          metricRankings,
        };
      })
      .sort((a, b) => b.overallScore - a.overallScore)
      .map((ranking, index) => ({ ...ranking, rank: index + 1 }));
  }

  private generateSeasonalInsights(seasonalData: any[]): any[] {
    const insights = [];

    // Find peak and low seasons
    const sortedByAverage = [...seasonalData].sort((a, b) => b.average - a.average);
    const peak = sortedByAverage[0];
    const low = sortedByAverage[sortedByAverage.length - 1];

    insights.push({
      type: 'seasonal',
      message: `Peak performance in ${peak.monthName} (${peak.average.toFixed(2)})`,
      messageKh: `ការអនុវត្តកំពូលក្នុង ${peak.monthNameKh} (${peak.average.toFixed(2)})`,
      month: peak.month,
      value: peak.average,
    });

    insights.push({
      type: 'seasonal',
      message: `Lowest performance in ${low.monthName} (${low.average.toFixed(2)})`,
      messageKh: `ការអនុវត្តទាបបំផុតក្នុង ${low.monthNameKh} (${low.average.toFixed(2)})`,
      month: low.month,
      value: low.average,
    });

    return insights;
  }

  private determineTrend(changePercent: number): 'up' | 'down' | 'stable' {
    if (changePercent > 2) return 'up';
    if (changePercent < -2) return 'down';
    return 'stable';
  }

  private getDateFormat(granularity: string): string {
    switch (granularity) {
      case 'daily':
        return '%Y-%m-%d';
      case 'weekly':
        return '%Y-%u';
      case 'monthly':
        return '%Y-%m';
      case 'quarterly':
        return '%Y-Q%q';
      default:
        return '%Y-%m';
    }
  }

  private getNextPeriod(currentPeriod: string, granularity: string): string {
    // Simple implementation - would need more sophisticated date handling
    const [year, period] = currentPeriod.split('-');
    const yearNum = parseInt(year);
    const periodNum = parseInt(period);

    switch (granularity) {
      case 'monthly':
        return periodNum === 12
          ? `${yearNum + 1}-01`
          : `${year}-${(periodNum + 1).toString().padStart(2, '0')}`;
      case 'quarterly':
        return periodNum === 4 ? `${yearNum + 1}-Q1` : `${year}-Q${periodNum + 1}`;
      default:
        return 'Next Period';
    }
  }

  private getMetricName(metric: string): string {
    const names = {
      average_score: 'Average Score',
      completion_rate: 'Completion Rate',
      session_count: 'Session Count',
      improvement_rate: 'Improvement Rate',
    };
    return names[metric] || metric;
  }

  private getMetricNameKh(metric: string): string {
    const names = {
      average_score: 'ពិន្ទុមធ្យម',
      completion_rate: 'អត្រាបញ្ចប់',
      session_count: 'ចំនួនវគ្គ',
      improvement_rate: 'អត្រាកែលម្អ',
    };
    return names[metric] || metric;
  }

  private getMetricUnit(metric: string): string {
    const units = {
      average_score: 'points',
      completion_rate: '%',
      session_count: 'sessions',
      improvement_rate: 'plans',
    };
    return units[metric] || '';
  }

  private getEntityName(entityType: string, entityId: string): string {
    // Mock implementation
    return `${entityType}-${entityId}`;
  }

  private getEntityNameKh(entityType: string, entityId: string): string {
    // Mock implementation
    return `${entityType}-${entityId}`;
  }

  private getMonthName(month: number): string {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[month - 1];
  }

  private getMonthNameKh(month: number): string {
    const months = [
      'មករា',
      'កុម្ភៈ',
      'មីនា',
      'មេសា',
      'ឧសភា',
      'មិថុនា',
      'កក្កដា',
      'សីហា',
      'កញ្ញា',
      'តុលា',
      'វិច្ឆិកា',
      'ធ្នូ',
    ];
    return months[month - 1];
  }

  private applyFilters(queryBuilder: any, filterDto: AnalyticsFilterDto): void {
    if (filterDto.startDate) {
      queryBuilder.andWhere('session.dateObserved >= :startDate', {
        startDate: filterDto.startDate,
      });
    }

    if (filterDto.endDate) {
      queryBuilder.andWhere('session.dateObserved <= :endDate', {
        endDate: filterDto.endDate,
      });
    }

    if (filterDto.grades && filterDto.grades.length > 0) {
      queryBuilder.andWhere('session.grade IN (:...grades)', {
        grades: filterDto.grades,
      });
    }

    if (filterDto.subjects && filterDto.subjects.length > 0) {
      queryBuilder.andWhere('session.subject IN (:...subjects)', {
        subjects: filterDto.subjects,
      });
    }
  }
}
