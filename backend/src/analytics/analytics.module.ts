import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { ReportGenerationService } from './report-generation.service';
import { DataAggregationService } from './data-aggregation.service';
import { TrendAnalysisService } from './trend-analysis.service';
import { ExportService } from './export.service';
import { DashboardService } from './dashboard.service';
import { ObservationSession } from '../entities/observation-session.entity';
import { IndicatorResponse } from '../entities/indicator-response.entity';
import { ImprovementPlan } from '../entities/improvement-plan.entity';
import { User } from '../entities/user.entity';
import { ObservationForm } from '../entities/observation-form.entity';
import { Indicator } from '../entities/indicator.entity';
import { HierarchyModule } from '../hierarchy/hierarchy.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ObservationSession,
      IndicatorResponse,
      ImprovementPlan,
      User,
      ObservationForm,
      Indicator,
    ]),
    HierarchyModule,
  ],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    ReportGenerationService,
    DataAggregationService,
    TrendAnalysisService,
    ExportService,
    DashboardService,
  ],
  exports: [
    AnalyticsService,
    ReportGenerationService,
    DataAggregationService,
    TrendAnalysisService,
    ExportService,
    DashboardService,
  ],
})
export class AnalyticsModule {}
