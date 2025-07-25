import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { AnalyticsFilterDto, TrendAnalysisDto, ComparisonDto } from './dto/analytics-filter.dto';
import { DataAggregationService, PerformanceMetrics } from './data-aggregation.service';
import { TrendAnalysisService, TrendAnalysis, ComparisonAnalysis } from './trend-analysis.service';
import { DashboardService, DashboardData } from './dashboard.service';
import { ReportGenerationService } from './report-generation.service';

export interface AnalyticsOverview {
  performanceMetrics: PerformanceMetrics;
  keyTrends: TrendAnalysis[];
  topInsights: AnalyticsInsight[];
  alerts: AnalyticsAlert[];
  recommendations: AnalyticsRecommendation[];
  lastUpdated: Date;
}

export interface AnalyticsInsight {
  id: string;
  type: 'performance' | 'trend' | 'comparison' | 'anomaly';
  title: string;
  titleKh: string;
  description: string;
  descriptionKh: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  relatedMetrics: string[];
  actionable: boolean;
  createdAt: Date;
}

export interface AnalyticsAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  title: string;
  titleKh: string;
  message: string;
  messageKh: string;
  threshold: number;
  currentValue: number;
  entityId?: string;
  entityName?: string;
  entityNameKh?: string;
  actionRequired: boolean;
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

export interface AnalyticsRecommendation {
  id: string;
  category: 'improvement' | 'optimization' | 'intervention' | 'recognition';
  title: string;
  titleKh: string;
  description: string;
  descriptionKh: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: string;
  estimatedImpactKh: string;
  targetEntities: string[];
  implementationSteps: string[];
  implementationStepsKh: string[];
  expectedOutcome: string;
  expectedOutcomeKh: string;
  createdAt: Date;
}

export interface BenchmarkData {
  entityId: string;
  entityName: string;
  entityNameKh: string;
  entityType: string;
  metrics: { [key: string]: number };
  benchmarks: { [key: string]: BenchmarkValue };
  overallScore: number;
  rank: number;
  percentile: number;
}

export interface BenchmarkValue {
  value: number;
  benchmark: number;
  variance: number;
  status: 'above' | 'at' | 'below';
  percentile: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    private dataAggregationService: DataAggregationService,
    private trendAnalysisService: TrendAnalysisService,
    private dashboardService: DashboardService,
    private reportGenerationService: ReportGenerationService,
  ) {}

  async getAnalyticsOverview(
    currentUser: User,
    filterDto: AnalyticsFilterDto,
  ): Promise<AnalyticsOverview> {
    // Get performance metrics
    const performanceMetrics = await this.dataAggregationService.getPerformanceMetrics(
      currentUser,
      filterDto,
    );

    // Get key trends
    const keyTrends = await this.getKeyTrends(currentUser, filterDto);

    // Generate insights
    const topInsights = await this.generateInsights(
      currentUser,
      filterDto,
      performanceMetrics,
      keyTrends,
    );

    // Generate alerts
    const alerts = await this.generateAlerts(currentUser, performanceMetrics, keyTrends);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(
      currentUser,
      performanceMetrics,
      keyTrends,
      topInsights,
    );

    return {
      performanceMetrics,
      keyTrends,
      topInsights,
      alerts,
      recommendations,
      lastUpdated: new Date(),
    };
  }

  async getPerformanceMetrics(
    currentUser: User,
    filterDto: AnalyticsFilterDto,
  ): Promise<PerformanceMetrics> {
    return this.dataAggregationService.getPerformanceMetrics(currentUser, filterDto);
  }

  async getTrendAnalysis(
    currentUser: User,
    filterDto: AnalyticsFilterDto,
    trendDto: TrendAnalysisDto,
  ): Promise<TrendAnalysis> {
    return this.trendAnalysisService.analyzeTrend(currentUser, filterDto, trendDto);
  }

  async getComparisonAnalysis(
    currentUser: User,
    filterDto: AnalyticsFilterDto,
    comparisonDto: ComparisonDto,
  ): Promise<ComparisonAnalysis> {
    return this.trendAnalysisService.compareEntities(
      currentUser,
      filterDto,
      comparisonDto.entityIds,
      comparisonDto.entityType,
      comparisonDto.metrics,
    );
  }

  async getBenchmarkData(
    currentUser: User,
    filterDto: AnalyticsFilterDto,
    entityType: string,
  ): Promise<BenchmarkData[]> {
    // Get geographic performance data
    const geoPerformance = await this.dataAggregationService.getGeographicPerformance(
      currentUser,
      filterDto,
      entityType,
    );

    // Calculate benchmarks (using median as benchmark)
    const metrics = ['averageScore', 'completionRate', 'improvementRate'];
    const benchmarks: { [key: string]: number } = {};

    metrics.forEach((metric) => {
      const values = geoPerformance.map((geo) => geo[metric]).sort((a, b) => a - b);
      benchmarks[metric] = values[Math.floor(values.length / 2)]; // Median as benchmark
    });

    // Transform to benchmark data
    return geoPerformance.map((geo, index) => {
      const entityBenchmarks: { [key: string]: BenchmarkValue } = {};
      const metricScores: number[] = [];

      metrics.forEach((metric) => {
        const value = geo[metric];
        const benchmark = benchmarks[metric];
        const variance = ((value - benchmark) / benchmark) * 100;
        const status =
          value > benchmark * 1.05 ? 'above' : value < benchmark * 0.95 ? 'below' : 'at';

        // Calculate percentile
        const sortedValues = geoPerformance.map((g) => g[metric]).sort((a, b) => a - b);
        const percentile = (sortedValues.indexOf(value) / sortedValues.length) * 100;

        entityBenchmarks[metric] = {
          value,
          benchmark,
          variance,
          status,
          percentile,
        };

        // Normalize score for overall calculation (0-100 scale)
        metricScores.push(Math.min(100, Math.max(0, (value / 3) * 100))); // Assuming max score is 3
      });

      const overallScore =
        metricScores.reduce((sum, score) => sum + score, 0) / metricScores.length;

      return {
        entityId: geo.entityId,
        entityName: geo.entityName,
        entityNameKh: geo.entityNameKh,
        entityType: geo.entityType,
        metrics: {
          averageScore: geo.averageScore,
          completionRate: geo.completionRate,
          improvementRate: geo.improvementRate,
          totalSessions: geo.totalSessions,
        },
        benchmarks: entityBenchmarks,
        overallScore,
        rank: geo.ranking,
        percentile: ((geoPerformance.length - geo.ranking + 1) / geoPerformance.length) * 100,
      };
    });
  }

  async getSeasonalAnalysis(
    currentUser: User,
    filterDto: AnalyticsFilterDto,
    metric: string,
  ): Promise<any> {
    return this.trendAnalysisService.getSeasonalAnalysis(currentUser, filterDto, metric);
  }

  async getDashboardData(currentUser: User, filterDto: any): Promise<DashboardData> {
    return this.dashboardService.getDashboardData(currentUser, filterDto);
  }

  async getRealtimeUpdates(currentUser: User): Promise<any> {
    return this.dashboardService.getRealtimeUpdates(currentUser);
  }

  private async getKeyTrends(
    currentUser: User,
    filterDto: AnalyticsFilterDto,
  ): Promise<TrendAnalysis[]> {
    const keyMetrics = ['average_score', 'completion_rate', 'session_count'];
    const trends: TrendAnalysis[] = [];

    for (const metric of keyMetrics) {
      try {
        const trendAnalysis = await this.trendAnalysisService.analyzeTrend(currentUser, filterDto, {
          metric: metric as any,
          granularity: filterDto.aggregationLevel || 'monthly',
          periods: 6,
          includePrediction: false,
        });
        trends.push(trendAnalysis);
      } catch (error) {
        console.warn(`Could not analyze trend for ${metric}:`, error.message);
      }
    }

    return trends;
  }

  private async generateInsights(
    currentUser: User,
    filterDto: AnalyticsFilterDto,
    performanceMetrics: PerformanceMetrics,
    keyTrends: TrendAnalysis[],
  ): Promise<AnalyticsInsight[]> {
    const insights: AnalyticsInsight[] = [];

    // Performance-based insights
    if (performanceMetrics.averageScore > 2.5) {
      insights.push({
        id: `high-performance-${Date.now()}`,
        type: 'performance',
        title: 'High Performance Achievement',
        titleKh: 'ការសម្រេចបានការអនុវត្តខ្ពស់',
        description: `Average score of ${performanceMetrics.averageScore.toFixed(2)} indicates excellent teaching quality across the system`,
        descriptionKh: `ពិន្ទុមធ្យម ${performanceMetrics.averageScore.toFixed(2)} បង្ហាញពីគុណភាពបង្រៀនដ៏ល្អឥតខ្ចោះនៅទូទាំងប្រព័ន្ធ`,
        impact: 'high',
        confidence: 85,
        relatedMetrics: ['average_score'],
        actionable: false,
        createdAt: new Date(),
      });
    }

    if (performanceMetrics.completionRate < 60) {
      insights.push({
        id: `low-completion-${Date.now()}`,
        type: 'performance',
        title: 'Low Completion Rate Concern',
        titleKh: 'ការព្រួយបារម្ភអត្រាបញ្ចប់ទាប',
        description: `Completion rate of ${performanceMetrics.completionRate.toFixed(1)}% suggests engagement challenges that need addressing`,
        descriptionKh: `អត្រាបញ្ចប់ ${performanceMetrics.completionRate.toFixed(1)}% បង្ហាញពីបញ្ហាប្រឈមការចូលរួមដែលត្រូវការដោះស្រាយ`,
        impact: 'high',
        confidence: 90,
        relatedMetrics: ['completion_rate'],
        actionable: true,
        createdAt: new Date(),
      });
    }

    // Trend-based insights
    keyTrends.forEach((trend) => {
      if (trend.overallTrend === 'up' && trend.overallChangePercent > 15) {
        insights.push({
          id: `positive-trend-${trend.metric}-${Date.now()}`,
          type: 'trend',
          title: `Positive ${trend.metricName} Trend`,
          titleKh: `ទំនោរវិជ្ជមាន ${trend.metricNameKh}`,
          description: `${trend.metricName} has improved by ${trend.overallChangePercent.toFixed(1)}% showing positive momentum`,
          descriptionKh: `${trend.metricNameKh} បានប្រសើរឡើង ${trend.overallChangePercent.toFixed(1)}% បង្ហាញពីសន្ទុះវិជ្ជមាន`,
          impact: 'medium',
          confidence: 75,
          relatedMetrics: [trend.metric],
          actionable: false,
          createdAt: new Date(),
        });
      }

      if (trend.overallTrend === 'down' && Math.abs(trend.overallChangePercent) > 10) {
        insights.push({
          id: `negative-trend-${trend.metric}-${Date.now()}`,
          type: 'trend',
          title: `Declining ${trend.metricName} Trend`,
          titleKh: `ទំនោរធ្លាក់ចុះ ${trend.metricNameKh}`,
          description: `${trend.metricName} has declined by ${Math.abs(trend.overallChangePercent).toFixed(1)}% requiring intervention`,
          descriptionKh: `${trend.metricNameKh} បានធ្លាក់ចុះ ${Math.abs(trend.overallChangePercent).toFixed(1)}% ត្រូវការការអន្តរាគមន៍`,
          impact: 'high',
          confidence: 80,
          relatedMetrics: [trend.metric],
          actionable: true,
          createdAt: new Date(),
        });
      }
    });

    // Indicator performance insights
    if (performanceMetrics.topPerformingIndicators.length > 0) {
      const topIndicator = performanceMetrics.topPerformingIndicators[0];
      insights.push({
        id: `top-indicator-${Date.now()}`,
        type: 'performance',
        title: 'Strongest Teaching Area Identified',
        titleKh: 'បានកំណត់តំបន់បង្រៀនដ៏រឹងមាំបំផុត',
        description: `${topIndicator.indicatorName} shows excellent performance with average score of ${topIndicator.averageScore.toFixed(2)}`,
        descriptionKh: `${topIndicator.indicatorNameKh} បង្ហាញការអនុវត្តដ៏ល្អឥតខ្ចោះជាមួយពិន្ទុមធ្យម ${topIndicator.averageScore.toFixed(2)}`,
        impact: 'medium',
        confidence: 85,
        relatedMetrics: ['indicator_performance'],
        actionable: false,
        createdAt: new Date(),
      });
    }

    if (performanceMetrics.lowPerformingIndicators.length > 0) {
      const lowIndicator = performanceMetrics.lowPerformingIndicators[0];
      insights.push({
        id: `low-indicator-${Date.now()}`,
        type: 'performance',
        title: 'Teaching Area Needing Support',
        titleKh: 'តំបន់បង្រៀនដែលត្រូវការការគាំទ្រ',
        description: `${lowIndicator.indicatorName} requires attention with average score of ${lowIndicator.averageScore.toFixed(2)}`,
        descriptionKh: `${lowIndicator.indicatorNameKh} ត្រូវការការយកចិត្តទុកដាក់ជាមួយពិន្ទុមធ្យម ${lowIndicator.averageScore.toFixed(2)}`,
        impact: 'high',
        confidence: 90,
        relatedMetrics: ['indicator_performance'],
        actionable: true,
        createdAt: new Date(),
      });
    }

    return insights
      .sort((a, b) => {
        const impactOrder = { high: 3, medium: 2, low: 1 };
        return impactOrder[b.impact] - impactOrder[a.impact];
      })
      .slice(0, 10); // Return top 10 insights
  }

  private async generateAlerts(
    currentUser: User,
    performanceMetrics: PerformanceMetrics,
    keyTrends: TrendAnalysis[],
  ): Promise<AnalyticsAlert[]> {
    const alerts: AnalyticsAlert[] = [];

    // Critical performance alerts
    if (performanceMetrics.averageScore < 1.5) {
      alerts.push({
        id: `critical-score-${Date.now()}`,
        type: 'critical',
        title: 'Critical Performance Alert',
        titleKh: 'ការជូនដំណឹងការអនុវត្តធ្ងន់ធ្ងរ',
        message: `Average score of ${performanceMetrics.averageScore.toFixed(2)} is critically low`,
        messageKh: `ពិន្ទុមធ្យម ${performanceMetrics.averageScore.toFixed(2)} ទាបខ្លាំងណាស់`,
        threshold: 1.5,
        currentValue: performanceMetrics.averageScore,
        actionRequired: true,
        createdAt: new Date(),
      });
    }

    if (performanceMetrics.completionRate < 40) {
      alerts.push({
        id: `critical-completion-${Date.now()}`,
        type: 'critical',
        title: 'Critical Completion Rate',
        titleKh: 'អត្រាបញ្ចប់ធ្ងន់ធ្ងរ',
        message: `Completion rate of ${performanceMetrics.completionRate.toFixed(1)}% is critically low`,
        messageKh: `អត្រាបញ្ចប់ ${performanceMetrics.completionRate.toFixed(1)}% ទាបខ្លាំងណាស់`,
        threshold: 40,
        currentValue: performanceMetrics.completionRate,
        actionRequired: true,
        createdAt: new Date(),
      });
    }

    // Warning alerts
    if (performanceMetrics.averageScore < 2.0 && performanceMetrics.averageScore >= 1.5) {
      alerts.push({
        id: `warning-score-${Date.now()}`,
        type: 'warning',
        title: 'Low Performance Warning',
        titleKh: 'ការព្រមានការអនុវត្តទាប',
        message: `Average score of ${performanceMetrics.averageScore.toFixed(2)} is below target`,
        messageKh: `ពិន្ទុមធ្យម ${performanceMetrics.averageScore.toFixed(2)} ស្ថិតក្រោមគោលដៅ`,
        threshold: 2.0,
        currentValue: performanceMetrics.averageScore,
        actionRequired: true,
        createdAt: new Date(),
      });
    }

    // Trend-based alerts
    keyTrends.forEach((trend) => {
      if (trend.overallTrend === 'down' && Math.abs(trend.overallChangePercent) > 20) {
        alerts.push({
          id: `trend-alert-${trend.metric}-${Date.now()}`,
          type: 'warning',
          title: `Declining ${trend.metricName}`,
          titleKh: `${trend.metricNameKh}កំពុងធ្លាក់ចុះ`,
          message: `${trend.metricName} has declined by ${Math.abs(trend.overallChangePercent).toFixed(1)}%`,
          messageKh: `${trend.metricNameKh} បានធ្លាក់ចុះ ${Math.abs(trend.overallChangePercent).toFixed(1)}%`,
          threshold: -20,
          currentValue: trend.overallChangePercent,
          actionRequired: true,
          createdAt: new Date(),
        });
      }
    });

    return alerts.sort((a, b) => {
      const typeOrder = { critical: 3, warning: 2, info: 1 };
      return typeOrder[b.type] - typeOrder[a.type];
    });
  }

  private async generateRecommendations(
    currentUser: User,
    performanceMetrics: PerformanceMetrics,
    keyTrends: TrendAnalysis[],
    insights: AnalyticsInsight[],
  ): Promise<AnalyticsRecommendation[]> {
    const recommendations: AnalyticsRecommendation[] = [];

    // Performance-based recommendations
    if (performanceMetrics.completionRate < 70) {
      recommendations.push({
        id: `improve-completion-${Date.now()}`,
        category: 'improvement',
        title: 'Improve Session Completion Rates',
        titleKh: 'កែលម្អអត្រាបញ្ចប់វគ្គ',
        description: 'Implement strategies to increase observation session completion rates',
        descriptionKh: 'អនុវត្តយុទ្ធសាស្ត្រដើម្បីបង្កើនអត្រាបញ្ចប់វគ្គសង្កេត',
        priority: 'high',
        estimatedImpact: 'Could improve completion rates by 15-25%',
        estimatedImpactKh: 'អាចកែលម្អអត្រាបញ្ចប់បាន 15-25%',
        targetEntities: ['all'],
        implementationSteps: [
          'Analyze reasons for incomplete sessions',
          'Provide additional training on session management',
          'Implement reminder systems',
          'Simplify complex observation forms',
        ],
        implementationStepsKh: [
          'វិភាគមូលហេតុនៃវគ្គមិនបានបញ្ចប់',
          'ផ្តល់ការបណ្តុះបណ្តាលបន្ថែមអំពីការគ្រប់គ្រងវគ្គ',
          'អនុវត្តប្រព័ន្ធរំលឹក',
          'ធ្វើឱ្យសាមញ្ញនូវទម្រង់សង្កេតស្មុគស្មាញ',
        ],
        expectedOutcome: 'Increased engagement and better data quality',
        expectedOutcomeKh: 'ការចូលរួមកាន់តែច្រើន និងគុណភាពទិន្នន័យប្រសើរជាង',
        createdAt: new Date(),
      });
    }

    if (performanceMetrics.averageScore < 2.0) {
      recommendations.push({
        id: `improve-teaching-${Date.now()}`,
        category: 'intervention',
        title: 'Intensive Teaching Quality Improvement',
        titleKh: 'ការកែលម្អគុណភាពបង្រៀនយ៉ាងខ្លាំង',
        description:
          'Launch comprehensive professional development program to improve teaching quality',
        descriptionKh: 'ចាប់ផ្តើមកម្មវិធីអភិវឌ្ឍន៍វិជ្ជាជីវៈទូលំទូលាយដើម្បីកែលម្អគុណភាពបង្រៀន',
        priority: 'high',
        estimatedImpact: 'Could improve average scores by 0.3-0.5 points',
        estimatedImpactKh: 'អាចកែលម្អពិន្ទុមធ្យមបាន 0.3-0.5 ពិន្ទុ',
        targetEntities: ['low_performing'],
        implementationSteps: [
          'Identify specific areas needing improvement',
          'Design targeted training programs',
          'Implement peer mentoring systems',
          'Provide ongoing coaching support',
          'Monitor progress regularly',
        ],
        implementationStepsKh: [
          'កំណត់តំបន់ជាក់លាក់ដែលត្រូវការកែលម្អ',
          'រចនាកម្មវិធីបណ្តុះបណ្តាលដែលមានគោលដៅ',
          'អនុវត្តប្រព័ន្ធការណែនាំដោយមិត្តភក្តិ',
          'ផ្តល់ការគាំទ្រការបង្វឹកបន្ត',
          'តាមដានវឌ្ឍនភាពជាទៀងទាត់',
        ],
        expectedOutcome: 'Significant improvement in teaching quality and student outcomes',
        expectedOutcomeKh: 'ការកែលម្អយ៉ាងខ្លាំងក្នុងគុណភាពបង្រៀន និងលទ្ធផលសិស្ស',
        createdAt: new Date(),
      });
    }

    // Trend-based recommendations
    const decliningTrends = keyTrends.filter(
      (trend) => trend.overallTrend === 'down' && Math.abs(trend.overallChangePercent) > 10,
    );

    if (decliningTrends.length > 0) {
      recommendations.push({
        id: `address-trends-${Date.now()}`,
        category: 'intervention',
        title: 'Address Declining Performance Trends',
        titleKh: 'ដោះស្រាយទំនោរការអនុវត្តធ្លាក់ចុះ',
        description: 'Implement corrective measures to reverse negative performance trends',
        descriptionKh: 'អនុវត្តវិធានការកែតម្រូវដើម្បីបញ្ច្រាសទំនោរការអនុវត្តអវិជ្ជមាន',
        priority: 'high',
        estimatedImpact: 'Could stabilize and reverse declining trends within 3-6 months',
        estimatedImpactKh: 'អាចធ្វើឱ្យមានស្ថិរភាព និងបញ្ច្រាសទំនោរធ្លាក់ចុះក្នុងរយៈពេល 3-6 ខែ',
        targetEntities: ['declining_entities'],
        implementationSteps: [
          'Conduct root cause analysis',
          'Develop targeted intervention plans',
          'Allocate additional resources',
          'Implement intensive monitoring',
        ],
        implementationStepsKh: [
          'ធ្វើការវិភាគមូលហេតុ',
          'អភិវឌ្ឍផែនការអន្តរាគមន៍ដែលមានគោលដៅ',
          'បែងចែកធនធានបន្ថែម',
          'អនុវត្តការតាមដានយ៉ាងខ្លាំង',
        ],
        expectedOutcome: 'Stabilization and improvement of declining metrics',
        expectedOutcomeKh: 'ស្ថិរភាព និងការកែលម្អនៃការវាស់វែងដែលកំពុងធ្លាក់ចុះ',
        createdAt: new Date(),
      });
    }

    // Recognition recommendations
    if (performanceMetrics.averageScore > 2.5) {
      recommendations.push({
        id: `recognize-excellence-${Date.now()}`,
        category: 'recognition',
        title: 'Recognize and Share Best Practices',
        titleKh: 'ទទួលស្គាល់ និងចែករំលែកការអនុវត្តល្អបំផុត',
        description: 'Identify and share successful practices from high-performing entities',
        descriptionKh: 'កំណត់ និងចែករំលែកការអនុវត្តដែលទទួលបានជោគជ័យពីអង្គភាពដែលមានការអនុវត្តខ្ពស់',
        priority: 'medium',
        estimatedImpact: 'Could improve system-wide performance by 10-15%',
        estimatedImpactKh: 'អាចកែលម្អការអនុវត្តទូទាំងប្រព័ន្ធបាន 10-15%',
        targetEntities: ['high_performing'],
        implementationSteps: [
          'Document successful practices',
          'Create knowledge sharing platforms',
          'Organize peer learning sessions',
          'Develop case studies',
        ],
        implementationStepsKh: [
          'ចងក្រងការអនុវត្តដែលទទួលបានជោគជ័យ',
          'បង្កើតវេទិកាចែករំលែកចំណេះដឹង',
          'រៀបចំវគ្គសិក្សាពីមិត្តភក្តិ',
          'អភិវឌ្ឍករណីសិក្សា',
        ],
        expectedOutcome: 'Spread of best practices and overall system improvement',
        expectedOutcomeKh: 'ការរីករាលដាលនៃការអនុវត្តល្អបំផុត និងការកែលម្អប្រព័ន្ធទូទៅ',
        createdAt: new Date(),
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
}
