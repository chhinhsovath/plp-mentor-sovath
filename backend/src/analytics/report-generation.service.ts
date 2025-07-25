import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { ReportFilterDto } from './dto/analytics-filter.dto';
import { DataAggregationService } from './data-aggregation.service';
import { TrendAnalysisService } from './trend-analysis.service';
import { ExportService, ReportData, ReportSummary } from './export.service';
import { Response } from 'express';

export interface ReportTemplate {
  id: string;
  name: string;
  nameKh: string;
  description: string;
  descriptionKh: string;
  sections: ReportSection[];
  defaultFilters: any;
}

export interface ReportSection {
  id: string;
  name: string;
  nameKh: string;
  type: 'metrics' | 'trends' | 'geographic' | 'subjects' | 'comparison' | 'summary';
  required: boolean;
  configurable: boolean;
  options?: any;
}

@Injectable()
export class ReportGenerationService {
  private readonly reportTemplates: ReportTemplate[] = [
    {
      id: 'summary',
      name: 'Executive Summary Report',
      nameKh: 'របាយការណ៍សង្ខេបប្រតិបត្តិ',
      description: 'High-level overview of key performance indicators and trends',
      descriptionKh: 'ទិដ្ឋភាពទូទៅនៃសូចនាករដែលមានការអនុវត្តសំខាន់ៗ និងទំនោរ',
      sections: [
        {
          id: 'overview',
          name: 'Overview',
          nameKh: 'ទិដ្ឋភាពទូទៅ',
          type: 'metrics',
          required: true,
          configurable: false,
        },
        {
          id: 'trends',
          name: 'Key Trends',
          nameKh: 'ទំនោរសំខាន់ៗ',
          type: 'trends',
          required: true,
          configurable: false,
        },
        {
          id: 'summary',
          name: 'Summary',
          nameKh: 'សង្ខេប',
          type: 'summary',
          required: true,
          configurable: false,
        },
      ],
      defaultFilters: { aggregationLevel: 'monthly' },
    },
    {
      id: 'detailed',
      name: 'Detailed Performance Report',
      nameKh: 'របាយការណ៍ការអនុវត្តលម្អិត',
      description: 'Comprehensive analysis of all performance metrics and geographic breakdowns',
      descriptionKh:
        'ការវិភាគទូលំទូលាយនៃការវាស់វែងការអនុវត្តទាំងអស់ និងការបែងចែកតាមតំបន់ភូមិសាស្ត្រ',
      sections: [
        {
          id: 'metrics',
          name: 'Performance Metrics',
          nameKh: 'ការវាស់វែងការអនុវត្ត',
          type: 'metrics',
          required: true,
          configurable: false,
        },
        {
          id: 'geographic',
          name: 'Geographic Performance',
          nameKh: 'ការអនុវត្តតាមតំបន់',
          type: 'geographic',
          required: true,
          configurable: true,
        },
        {
          id: 'subjects',
          name: 'Subject Analysis',
          nameKh: 'ការវិភាគមុខវិជ្ជា',
          type: 'subjects',
          required: false,
          configurable: true,
        },
        {
          id: 'trends',
          name: 'Trend Analysis',
          nameKh: 'ការវិភាគទំនោរ',
          type: 'trends',
          required: false,
          configurable: true,
        },
      ],
      defaultFilters: { aggregationLevel: 'monthly' },
    },
    {
      id: 'trend',
      name: 'Trend Analysis Report',
      nameKh: 'របាយការណ៍ការវិភាគទំនោរ',
      description: 'Focus on trends and patterns over time with predictive insights',
      descriptionKh: 'ផ្តោតលើទំនោរ និងលំនាំតាមពេលវេលាជាមួយនឹងការយល់ដឹងអំពីការព្យាករណ៍',
      sections: [
        {
          id: 'trends',
          name: 'Trend Analysis',
          nameKh: 'ការវិភាគទំនោរ',
          type: 'trends',
          required: true,
          configurable: true,
        },
        {
          id: 'seasonal',
          name: 'Seasonal Patterns',
          nameKh: 'លំនាំតាមរដូវ',
          type: 'trends',
          required: false,
          configurable: true,
        },
        {
          id: 'predictions',
          name: 'Predictions',
          nameKh: 'ការព្យាករណ៍',
          type: 'trends',
          required: false,
          configurable: true,
        },
      ],
      defaultFilters: { aggregationLevel: 'monthly', includePrediction: true },
    },
    {
      id: 'comparison',
      name: 'Comparative Analysis Report',
      nameKh: 'របាយការណ៍ការវិភាគប្រៀបធៀប',
      description: 'Compare performance across different entities and time periods',
      descriptionKh: 'ប្រៀបធៀបការអនុវត្តរវាងអង្គភាពផ្សេងៗ និងរយៈពេលផ្សេងៗ',
      sections: [
        {
          id: 'comparison',
          name: 'Entity Comparison',
          nameKh: 'ការប្រៀបធៀបអង្គភាព',
          type: 'comparison',
          required: true,
          configurable: true,
        },
        {
          id: 'rankings',
          name: 'Performance Rankings',
          nameKh: 'ចំណាត់ថ្នាក់ការអនុវត្ត',
          type: 'comparison',
          required: true,
          configurable: false,
        },
        {
          id: 'insights',
          name: 'Comparative Insights',
          nameKh: 'ការយល់ដឹងប្រៀបធៀប',
          type: 'summary',
          required: true,
          configurable: false,
        },
      ],
      defaultFilters: { aggregationLevel: 'monthly' },
    },
  ];

  constructor(
    private dataAggregationService: DataAggregationService,
    private trendAnalysisService: TrendAnalysisService,
    private exportService: ExportService,
  ) {}

  async generateReport(
    currentUser: User,
    filterDto: ReportFilterDto,
    response: Response,
  ): Promise<void> {
    const { template = 'summary', format = 'pdf', language = 'en' } = filterDto;

    // Get report template
    const reportTemplate = this.getReportTemplate(template);
    if (!reportTemplate) {
      throw new Error(`Report template '${template}' not found`);
    }

    // Generate report data based on template sections
    const reportData = await this.generateReportData(currentUser, filterDto, reportTemplate);

    // Export report in requested format
    await this.exportService.exportReport(reportData, format, language, response);
  }

  async getAvailableTemplates(currentUser: User): Promise<ReportTemplate[]> {
    // Filter templates based on user permissions
    return this.reportTemplates.filter((template) => {
      // All users can access summary reports
      if (template.id === 'summary') return true;

      // Detailed reports require higher permissions
      if (template.id === 'detailed') {
        return ['Administrator', 'Zone', 'Provincial', 'Department'].includes(currentUser.role);
      }

      // Trend and comparison reports require analysis permissions
      if (['trend', 'comparison'].includes(template.id)) {
        return ['Administrator', 'Zone', 'Provincial'].includes(currentUser.role);
      }

      return true;
    });
  }

  async generateCustomReport(
    currentUser: User,
    sections: string[],
    filterDto: ReportFilterDto,
    response: Response,
  ): Promise<void> {
    const { format = 'pdf', language = 'en' } = filterDto;

    // Create custom template
    const customTemplate: ReportTemplate = {
      id: 'custom',
      name: 'Custom Report',
      nameKh: 'របាយការណ៍ផ្ទាល់ខ្លួន',
      description: 'Custom report with selected sections',
      descriptionKh: 'របាយការណ៍ផ្ទាល់ខ្លួនជាមួយផ្នែកដែលបានជ្រើសរើស',
      sections: this.buildCustomSections(sections),
      defaultFilters: {},
    };

    // Generate report data
    const reportData = await this.generateReportData(currentUser, filterDto, customTemplate);

    // Export report
    await this.exportService.exportReport(reportData, format, language, response);
  }

  private async generateReportData(
    currentUser: User,
    filterDto: ReportFilterDto,
    template: ReportTemplate,
  ): Promise<ReportData> {
    const reportData: ReportData = {
      title: template.name,
      titleKh: template.nameKh,
      generatedAt: new Date(),
      generatedBy: currentUser.fullName,
      filters: filterDto,
    };

    // Generate data for each section
    for (const section of template.sections) {
      switch (section.type) {
        case 'metrics':
          reportData.performanceMetrics = await this.dataAggregationService.getPerformanceMetrics(
            currentUser,
            filterDto,
          );
          break;

        case 'geographic':
          // Determine appropriate entity type based on user role
          const entityType = this.getAppropriateEntityType(currentUser);
          reportData.geographicPerformance =
            await this.dataAggregationService.getGeographicPerformance(
              currentUser,
              filterDto,
              entityType,
            );
          break;

        case 'subjects':
          reportData.subjectPerformance = await this.dataAggregationService.getSubjectPerformance(
            currentUser,
            filterDto,
          );
          break;

        case 'trends':
          const trendMetrics = ['average_score', 'completion_rate', 'session_count'];
          reportData.trendAnalysis = [];

          for (const metric of trendMetrics) {
            const trendAnalysis = await this.trendAnalysisService.analyzeTrend(
              currentUser,
              filterDto,
              {
                metric: metric as any,
                granularity: filterDto.aggregationLevel || 'monthly',
                periods: 12,
                includePrediction: false,
              },
            );
            reportData.trendAnalysis.push(trendAnalysis);
          }
          break;

        case 'summary':
          reportData.summary = await this.generateReportSummary(currentUser, filterDto, reportData);
          break;
      }
    }

    return reportData;
  }

  private async generateReportSummary(
    currentUser: User,
    filterDto: ReportFilterDto,
    reportData: ReportData,
  ): Promise<ReportSummary> {
    const keyFindings: string[] = [];
    const keyFindingsKh: string[] = [];
    const recommendations: string[] = [];
    const recommendationsKh: string[] = [];

    // Analyze performance metrics for key findings
    if (reportData.performanceMetrics) {
      const metrics = reportData.performanceMetrics;

      if (metrics.completionRate > 80) {
        keyFindings.push(
          `High completion rate of ${metrics.completionRate.toFixed(1)}% indicates strong engagement`,
        );
        keyFindingsKh.push(
          `អត្រាបញ្ចប់ខ្ពស់ ${metrics.completionRate.toFixed(1)}% បង្ហាញពីការចូលរួមដ៏រឹងមាំ`,
        );
      } else if (metrics.completionRate < 60) {
        keyFindings.push(
          `Low completion rate of ${metrics.completionRate.toFixed(1)}% requires attention`,
        );
        keyFindingsKh.push(
          `អត្រាបញ្ចប់ទាប ${metrics.completionRate.toFixed(1)}% ត្រូវការការយកចិត្តទុកដាក់`,
        );
        recommendations.push('Implement strategies to improve session completion rates');
        recommendationsKh.push('អនុវត្តយុទ្ធសាស្ត្រដើម្បីកែលម្អអត្រាបញ្ចប់វគ្គ');
      }

      if (metrics.averageScore > 2.5) {
        keyFindings.push(
          `Strong average score of ${metrics.averageScore.toFixed(2)} demonstrates good teaching quality`,
        );
        keyFindingsKh.push(
          `ពិន្ទុមធ្យមខ្ពស់ ${metrics.averageScore.toFixed(2)} បង្ហាញពីគុណភាពបង្រៀនល្អ`,
        );
      } else if (metrics.averageScore < 2.0) {
        keyFindings.push(
          `Average score of ${metrics.averageScore.toFixed(2)} indicates need for improvement`,
        );
        keyFindingsKh.push(
          `ពិន្ទុមធ្យម ${metrics.averageScore.toFixed(2)} បង្ហាញពីការត្រូវការកែលម្អ`,
        );
        recommendations.push(
          'Focus on professional development and targeted support for low-performing areas',
        );
        recommendationsKh.push(
          'ផ្តោតលើការអភិវឌ្ឍន៍វិជ្ជាជីវៈ និងការគាំទ្រដែលមានគោលដៅសម្រាប់តំបន់ដែលមានការអនុវត្តទាប',
        );
      }

      if (metrics.improvementPlansCreated > metrics.totalSessions * 0.3) {
        keyFindings.push(
          `High rate of improvement plan creation (${((metrics.improvementPlansCreated / metrics.totalSessions) * 100).toFixed(1)}%) shows proactive approach`,
        );
        keyFindingsKh.push(
          `អត្រាខ្ពស់នៃការបង្កើតផែនការកែលម្អ (${((metrics.improvementPlansCreated / metrics.totalSessions) * 100).toFixed(1)}%) បង្ហាញពីវិធីសាស្រ្តសកម្ម`,
        );
      }
    }

    // Analyze trends for insights
    if (reportData.trendAnalysis) {
      reportData.trendAnalysis.forEach((trend) => {
        if (trend.overallTrend === 'up' && trend.overallChangePercent > 10) {
          keyFindings.push(
            `${trend.metricName} shows positive trend with ${trend.overallChangePercent.toFixed(1)}% improvement`,
          );
          keyFindingsKh.push(
            `${trend.metricNameKh} បង្ហាញទំនោរវិជ្ជមានជាមួយនឹងការកែលម្អ ${trend.overallChangePercent.toFixed(1)}%`,
          );
        } else if (trend.overallTrend === 'down' && Math.abs(trend.overallChangePercent) > 10) {
          keyFindings.push(
            `${trend.metricName} shows declining trend with ${Math.abs(trend.overallChangePercent).toFixed(1)}% decrease`,
          );
          keyFindingsKh.push(
            `${trend.metricNameKh} បង្ហាញទំនោរធ្លាក់ចុះជាមួយនឹងការថយចុះ ${Math.abs(trend.overallChangePercent).toFixed(1)}%`,
          );
          recommendations.push(
            `Address factors contributing to declining ${trend.metricName.toLowerCase()}`,
          );
          recommendationsKh.push(`ដោះស្រាយកត្តាដែលរួមចំណែកដល់ការធ្លាក់ចុះ ${trend.metricNameKh}`);
        }
      });
    }

    // Analyze geographic performance for insights
    if (reportData.geographicPerformance) {
      const topPerformer = reportData.geographicPerformance[0];
      const bottomPerformer =
        reportData.geographicPerformance[reportData.geographicPerformance.length - 1];

      if (
        topPerformer &&
        bottomPerformer &&
        topPerformer.averageScore - bottomPerformer.averageScore > 0.5
      ) {
        keyFindings.push(
          `Significant performance gap between top (${topPerformer.entityName}: ${topPerformer.averageScore.toFixed(2)}) and bottom performers (${bottomPerformer.entityName}: ${bottomPerformer.averageScore.toFixed(2)})`,
        );
        keyFindingsKh.push(
          `គម្លាតការអនុវត្តសំខាន់រវាងអ្នកអនុវត្តកំពូល (${topPerformer.entityNameKh}: ${topPerformer.averageScore.toFixed(2)}) និងអ្នកអនុវត្តចុងក្រោយ (${bottomPerformer.entityNameKh}: ${bottomPerformer.averageScore.toFixed(2)})`,
        );
        recommendations.push(
          'Implement knowledge sharing programs between high and low performing entities',
        );
        recommendationsKh.push(
          'អនុវត្តកម្មវិធីចែករំលែកចំណេះដឹងរវាងអង្គភាពដែលមានការអនុវត្តខ្ពស់ និងទាប',
        );
      }
    }

    // Generate period and scope information
    const period = this.formatPeriod(filterDto.startDate, filterDto.endDate);
    const scope = this.getUserScopeDescription(currentUser);
    const scopeKh = this.getUserScopeDescriptionKh(currentUser);

    return {
      keyFindings,
      keyFindingsKh,
      recommendations,
      recommendationsKh,
      period,
      scope,
      scopeKh,
    };
  }

  private getReportTemplate(templateId: string): ReportTemplate | undefined {
    return this.reportTemplates.find((template) => template.id === templateId);
  }

  private buildCustomSections(sectionIds: string[]): ReportSection[] {
    const allSections: ReportSection[] = [
      {
        id: 'metrics',
        name: 'Performance Metrics',
        nameKh: 'ការវាស់វែងការអនុវត្ត',
        type: 'metrics',
        required: false,
        configurable: true,
      },
      {
        id: 'geographic',
        name: 'Geographic Performance',
        nameKh: 'ការអនុវត្តតាមតំបន់',
        type: 'geographic',
        required: false,
        configurable: true,
      },
      {
        id: 'subjects',
        name: 'Subject Analysis',
        nameKh: 'ការវិភាគមុខវិជ្ជា',
        type: 'subjects',
        required: false,
        configurable: true,
      },
      {
        id: 'trends',
        name: 'Trend Analysis',
        nameKh: 'ការវិភាគទំនោរ',
        type: 'trends',
        required: false,
        configurable: true,
      },
      {
        id: 'comparison',
        name: 'Comparative Analysis',
        nameKh: 'ការវិភាគប្រៀបធៀប',
        type: 'comparison',
        required: false,
        configurable: true,
      },
      {
        id: 'summary',
        name: 'Summary',
        nameKh: 'សង្ខេប',
        type: 'summary',
        required: false,
        configurable: true,
      },
    ];

    return allSections.filter((section) => sectionIds.includes(section.id));
  }

  private getAppropriateEntityType(currentUser: User): string {
    switch (currentUser.role) {
      case 'Administrator':
      case 'Zone':
        return 'province';
      case 'Provincial':
        return 'department';
      case 'Department':
        return 'cluster';
      case 'Cluster':
        return 'school';
      default:
        return 'school';
    }
  }

  private formatPeriod(startDate?: string, endDate?: string): string {
    if (!startDate || !endDate) {
      return 'All time';
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  }

  private getUserScopeDescription(currentUser: User): string {
    switch (currentUser.role) {
      case 'Administrator':
        return 'National Level';
      case 'Zone':
        return `Zone Level`;
      case 'Provincial':
        return `Provincial Level`;
      case 'Department':
        return `Department Level`;
      case 'Cluster':
        return `Cluster Level`;
      case 'Director':
        return `School Level`;
      case 'Teacher':
        return `Individual Level`;
      default:
        return 'Unknown Scope';
    }
  }

  private getUserScopeDescriptionKh(currentUser: User): string {
    switch (currentUser.role) {
      case 'Administrator':
        return 'កម្រិតជាតិ';
      case 'Zone':
        return 'កម្រិតតំបន់';
      case 'Provincial':
        return 'កម្រិតខេត្ត';
      case 'Department':
        return 'កម្រិតនាយកដ្ឋាន';
      case 'Cluster':
        return 'កម្រិតចង្កោម';
      case 'Director':
        return 'កម្រិតសាលារៀន';
      case 'Teacher':
        return 'កម្រិតបុគ្គល';
      default:
        return 'វិសាលភាពមិនស្គាល់';
    }
  }
}
