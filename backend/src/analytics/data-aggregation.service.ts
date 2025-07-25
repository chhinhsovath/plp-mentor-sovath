import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ObservationSession, SessionStatus } from '../entities/observation-session.entity';
import { IndicatorResponse } from '../entities/indicator-response.entity';
import { ImprovementPlan } from '../entities/improvement-plan.entity';
import { User, UserRole } from '../entities/user.entity';
import { AnalyticsFilterDto } from './dto/analytics-filter.dto';
import { DataFilteringService } from '../hierarchy/data-filtering.service';

export interface PerformanceMetrics {
  totalSessions: number;
  completedSessions: number;
  averageScore: number;
  completionRate: number;
  improvementPlansCreated: number;
  activeUsers: number;
  averageSessionDuration: number;
  topPerformingIndicators: IndicatorPerformance[];
  lowPerformingIndicators: IndicatorPerformance[];
}

export interface IndicatorPerformance {
  indicatorId: string;
  indicatorName: string;
  indicatorNameKh: string;
  averageScore: number;
  responseCount: number;
  improvementNeeded: boolean;
}

export interface GeographicPerformance {
  entityId: string;
  entityName: string;
  entityNameKh: string;
  entityType: string;
  totalSessions: number;
  averageScore: number;
  completionRate: number;
  improvementRate: number;
  ranking: number;
}

export interface SubjectPerformance {
  subject: string;
  subjectKh: string;
  totalSessions: number;
  averageScore: number;
  improvementTrend: number;
  gradeBreakdown: GradePerformance[];
}

export interface GradePerformance {
  grade: string;
  totalSessions: number;
  averageScore: number;
  completionRate: number;
}

export interface TimeSeriesData {
  period: string;
  date: Date;
  totalSessions: number;
  completedSessions: number;
  averageScore: number;
  improvementPlans: number;
  activeUsers: number;
}

@Injectable()
export class DataAggregationService {
  constructor(
    @InjectRepository(ObservationSession)
    private sessionRepository: Repository<ObservationSession>,
    @InjectRepository(IndicatorResponse)
    private responseRepository: Repository<IndicatorResponse>,
    @InjectRepository(ImprovementPlan)
    private planRepository: Repository<ImprovementPlan>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataFilteringService: DataFilteringService,
  ) {}

  async getPerformanceMetrics(
    currentUser: User,
    filterDto: AnalyticsFilterDto,
  ): Promise<PerformanceMetrics> {
    // Build base queries with hierarchical filtering
    const sessionQuery = this.sessionRepository.createQueryBuilder('session');
    const responseQuery = this.responseRepository.createQueryBuilder('response');
    const planQuery = this.planRepository.createQueryBuilder('plan');
    const userQuery = this.userRepository.createQueryBuilder('user');

    // Apply hierarchical filtering
    await this.dataFilteringService.applyHierarchicalFiltering(
      sessionQuery,
      currentUser,
      'session',
    );
    await this.dataFilteringService.applyHierarchicalFiltering(
      responseQuery,
      currentUser,
      'response',
    );
    await this.dataFilteringService.applyHierarchicalFiltering(planQuery, currentUser, 'plan');
    await this.dataFilteringService.applyHierarchicalFiltering(userQuery, currentUser, 'user');

    // Apply additional filters
    this.applyFilters(sessionQuery, filterDto, 'session');
    this.applyFilters(responseQuery, filterDto, 'response');
    this.applyFilters(planQuery, filterDto, 'plan');

    // Execute aggregation queries
    const [
      totalSessions,
      completedSessions,
      averageScoreResult,
      improvementPlansCreated,
      activeUsers,
      averageSessionDuration,
    ] = await Promise.all([
      sessionQuery.getCount(),
      sessionQuery
        .clone()
        .andWhere('session.status = :status', { status: SessionStatus.COMPLETED })
        .getCount(),
      this.getAverageScore(responseQuery),
      planQuery.getCount(),
      userQuery.andWhere('user.isActive = :isActive', { isActive: true }).getCount(),
      this.getAverageSessionDuration(sessionQuery),
    ]);

    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
    const averageScore = averageScoreResult || 0;

    // Get indicator performance data
    const [topPerformingIndicators, lowPerformingIndicators] = await Promise.all([
      this.getTopPerformingIndicators(currentUser, filterDto, 5),
      this.getLowPerformingIndicators(currentUser, filterDto, 5),
    ]);

    return {
      totalSessions,
      completedSessions,
      averageScore,
      completionRate,
      improvementPlansCreated,
      activeUsers,
      averageSessionDuration,
      topPerformingIndicators,
      lowPerformingIndicators,
    };
  }

  async getGeographicPerformance(
    currentUser: User,
    filterDto: AnalyticsFilterDto,
    entityType: string,
  ): Promise<GeographicPerformance[]> {
    const query = this.sessionRepository
      .createQueryBuilder('session')
      .select([
        `session.${entityType}Id as entityId`,
        'COUNT(session.id) as totalSessions',
        'AVG(CASE WHEN response.selectedScore IS NOT NULL THEN response.selectedScore END) as averageScore',
        'COUNT(CASE WHEN session.status = :completedStatus THEN 1 END) as completedSessions',
        'COUNT(CASE WHEN plan.id IS NOT NULL THEN 1 END) as improvementPlans',
      ])
      .leftJoin('session.indicatorResponses', 'response')
      .leftJoin('session.improvementPlans', 'plan')
      .where(`session.${entityType}Id IS NOT NULL`)
      .groupBy(`session.${entityType}Id`);

    // Apply hierarchical filtering
    await this.dataFilteringService.applyHierarchicalFiltering(query, currentUser, 'session');
    this.applyFilters(query, filterDto, 'session');

    query.setParameter('completedStatus', SessionStatus.COMPLETED);

    const results = await query.getRawMany();

    // Transform results and add entity names, rankings
    const performanceData: GeographicPerformance[] = results.map((result, index) => ({
      entityId: result.entityId,
      entityName: this.getEntityName(entityType, result.entityId),
      entityNameKh: this.getEntityNameKh(entityType, result.entityId),
      entityType,
      totalSessions: parseInt(result.totalSessions),
      averageScore: parseFloat(result.averageScore) || 0,
      completionRate:
        result.totalSessions > 0 ? (result.completedSessions / result.totalSessions) * 100 : 0,
      improvementRate:
        result.totalSessions > 0 ? (result.improvementPlans / result.totalSessions) * 100 : 0,
      ranking: index + 1,
    }));

    // Sort by average score descending and update rankings
    performanceData.sort((a, b) => b.averageScore - a.averageScore);
    performanceData.forEach((item, index) => {
      item.ranking = index + 1;
    });

    return performanceData;
  }

  async getSubjectPerformance(
    currentUser: User,
    filterDto: AnalyticsFilterDto,
  ): Promise<SubjectPerformance[]> {
    const query = this.sessionRepository
      .createQueryBuilder('session')
      .select([
        'session.subject',
        'session.grade',
        'COUNT(session.id) as totalSessions',
        'AVG(CASE WHEN response.selectedScore IS NOT NULL THEN response.selectedScore END) as averageScore',
        'COUNT(CASE WHEN session.status = :completedStatus THEN 1 END) as completedSessions',
      ])
      .leftJoin('session.indicatorResponses', 'response')
      .groupBy('session.subject, session.grade');

    await this.dataFilteringService.applyHierarchicalFiltering(query, currentUser, 'session');
    this.applyFilters(query, filterDto, 'session');

    query.setParameter('completedStatus', SessionStatus.COMPLETED);

    const results = await query.getRawMany();

    // Group by subject and aggregate grade data
    const subjectMap = new Map<string, any>();

    results.forEach((result) => {
      const subject = result.session_subject;
      if (!subjectMap.has(subject)) {
        subjectMap.set(subject, {
          subject,
          subjectKh: this.getSubjectNameKh(subject),
          totalSessions: 0,
          totalScore: 0,
          sessionCount: 0,
          gradeBreakdown: [],
        });
      }

      const subjectData = subjectMap.get(subject);
      const totalSessions = parseInt(result.totalSessions);
      const averageScore = parseFloat(result.averageScore) || 0;

      subjectData.totalSessions += totalSessions;
      subjectData.totalScore += averageScore * totalSessions;
      subjectData.sessionCount += totalSessions;

      subjectData.gradeBreakdown.push({
        grade: result.session_grade,
        totalSessions,
        averageScore,
        completionRate: totalSessions > 0 ? (result.completedSessions / totalSessions) * 100 : 0,
      });
    });

    // Calculate improvement trends (simplified - would need historical data)
    const subjectPerformance: SubjectPerformance[] = Array.from(subjectMap.values()).map(
      (data) => ({
        subject: data.subject,
        subjectKh: data.subjectKh,
        totalSessions: data.totalSessions,
        averageScore: data.sessionCount > 0 ? data.totalScore / data.sessionCount : 0,
        improvementTrend: 0, // Would calculate from historical data
        gradeBreakdown: data.gradeBreakdown,
      }),
    );

    return subjectPerformance.sort((a, b) => b.averageScore - a.averageScore);
  }

  async getTimeSeriesData(
    currentUser: User,
    filterDto: AnalyticsFilterDto,
    granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' = 'monthly',
  ): Promise<TimeSeriesData[]> {
    const dateFormat = this.getDateFormat(granularity);

    const query = this.sessionRepository
      .createQueryBuilder('session')
      .select([
        `DATE_FORMAT(session.dateObserved, '${dateFormat}') as period`,
        'session.dateObserved as date',
        'COUNT(session.id) as totalSessions',
        'COUNT(CASE WHEN session.status = :completedStatus THEN 1 END) as completedSessions',
        'AVG(CASE WHEN response.selectedScore IS NOT NULL THEN response.selectedScore END) as averageScore',
        'COUNT(CASE WHEN plan.id IS NOT NULL THEN 1 END) as improvementPlans',
        'COUNT(DISTINCT session.observerId) as activeUsers',
      ])
      .leftJoin('session.indicatorResponses', 'response')
      .leftJoin('session.improvementPlans', 'plan')
      .groupBy('period')
      .orderBy('session.dateObserved', 'ASC');

    await this.dataFilteringService.applyHierarchicalFiltering(query, currentUser, 'session');
    this.applyFilters(query, filterDto, 'session');

    query.setParameter('completedStatus', SessionStatus.COMPLETED);

    const results = await query.getRawMany();

    return results.map((result) => ({
      period: result.period,
      date: new Date(result.date),
      totalSessions: parseInt(result.totalSessions),
      completedSessions: parseInt(result.completedSessions),
      averageScore: parseFloat(result.averageScore) || 0,
      improvementPlans: parseInt(result.improvementPlans),
      activeUsers: parseInt(result.activeUsers),
    }));
  }

  private async getAverageScore(
    responseQuery: SelectQueryBuilder<IndicatorResponse>,
  ): Promise<number> {
    const result = await responseQuery
      .select('AVG(response.selectedScore)', 'averageScore')
      .where('response.selectedScore IS NOT NULL')
      .getRawOne();

    return parseFloat(result?.averageScore) || 0;
  }

  private async getAverageSessionDuration(
    sessionQuery: SelectQueryBuilder<ObservationSession>,
  ): Promise<number> {
    const result = await sessionQuery
      .select(
        'AVG(TIME_TO_SEC(TIMEDIFF(session.endTime, session.startTime)) / 60)',
        'averageDuration',
      )
      .where('session.startTime IS NOT NULL AND session.endTime IS NOT NULL')
      .getRawOne();

    return parseFloat(result?.averageDuration) || 0;
  }

  private async getTopPerformingIndicators(
    currentUser: User,
    filterDto: AnalyticsFilterDto,
    limit: number,
  ): Promise<IndicatorPerformance[]> {
    const query = this.responseRepository
      .createQueryBuilder('response')
      .select([
        'response.indicatorId',
        'indicator.name as indicatorName',
        'indicator.nameKh as indicatorNameKh',
        'AVG(response.selectedScore) as averageScore',
        'COUNT(response.id) as responseCount',
      ])
      .innerJoin('response.indicator', 'indicator')
      .innerJoin('response.session', 'session')
      .where('response.selectedScore IS NOT NULL')
      .groupBy('response.indicatorId, indicator.name, indicator.nameKh')
      .orderBy('averageScore', 'DESC')
      .limit(limit);

    await this.dataFilteringService.applyHierarchicalFiltering(query, currentUser, 'session');
    this.applyFilters(query, filterDto, 'session');

    const results = await query.getRawMany();

    return results.map((result) => ({
      indicatorId: result.response_indicatorId,
      indicatorName: result.indicatorName,
      indicatorNameKh: result.indicatorNameKh,
      averageScore: parseFloat(result.averageScore),
      responseCount: parseInt(result.responseCount),
      improvementNeeded: parseFloat(result.averageScore) < 2.0,
    }));
  }

  private async getLowPerformingIndicators(
    currentUser: User,
    filterDto: AnalyticsFilterDto,
    limit: number,
  ): Promise<IndicatorPerformance[]> {
    const query = this.responseRepository
      .createQueryBuilder('response')
      .select([
        'response.indicatorId',
        'indicator.name as indicatorName',
        'indicator.nameKh as indicatorNameKh',
        'AVG(response.selectedScore) as averageScore',
        'COUNT(response.id) as responseCount',
      ])
      .innerJoin('response.indicator', 'indicator')
      .innerJoin('response.session', 'session')
      .where('response.selectedScore IS NOT NULL')
      .groupBy('response.indicatorId, indicator.name, indicator.nameKh')
      .orderBy('averageScore', 'ASC')
      .limit(limit);

    await this.dataFilteringService.applyHierarchicalFiltering(query, currentUser, 'session');
    this.applyFilters(query, filterDto, 'session');

    const results = await query.getRawMany();

    return results.map((result) => ({
      indicatorId: result.response_indicatorId,
      indicatorName: result.indicatorName,
      indicatorNameKh: result.indicatorNameKh,
      averageScore: parseFloat(result.averageScore),
      responseCount: parseInt(result.responseCount),
      improvementNeeded: true,
    }));
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<any>,
    filterDto: AnalyticsFilterDto,
    tableAlias: string,
  ): void {
    if (filterDto.startDate) {
      queryBuilder.andWhere(`${tableAlias}.dateObserved >= :startDate`, {
        startDate: filterDto.startDate,
      });
    }

    if (filterDto.endDate) {
      queryBuilder.andWhere(`${tableAlias}.dateObserved <= :endDate`, {
        endDate: filterDto.endDate,
      });
    }

    if (filterDto.grades && filterDto.grades.length > 0) {
      queryBuilder.andWhere(`${tableAlias}.grade IN (:...grades)`, {
        grades: filterDto.grades,
      });
    }

    if (filterDto.subjects && filterDto.subjects.length > 0) {
      queryBuilder.andWhere(`${tableAlias}.subject IN (:...subjects)`, {
        subjects: filterDto.subjects,
      });
    }

    if (filterDto.statuses && filterDto.statuses.length > 0) {
      queryBuilder.andWhere(`${tableAlias}.status IN (:...statuses)`, {
        statuses: filterDto.statuses,
      });
    }

    if (filterDto.observerIds && filterDto.observerIds.length > 0) {
      queryBuilder.andWhere(`${tableAlias}.observerId IN (:...observerIds)`, {
        observerIds: filterDto.observerIds,
      });
    }
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

  private getEntityName(entityType: string, entityId: string): string {
    // Mock implementation - in production, this would query the geographic entities
    const entityNames = {
      zone: { 'zone-001': 'Central Zone', 'zone-002': 'Northern Zone' },
      province: { 'province-001': 'Phnom Penh', 'province-002': 'Kandal' },
      department: { 'dept-001': 'Phnom Penh Education Department' },
      cluster: { 'cluster-001': 'Daun Penh Cluster' },
      school: { 'school-001': 'Hun Sen Primary School' },
    };

    return entityNames[entityType]?.[entityId] || `${entityType}-${entityId}`;
  }

  private getEntityNameKh(entityType: string, entityId: string): string {
    // Mock implementation - in production, this would query the geographic entities
    const entityNamesKh = {
      zone: { 'zone-001': 'តំបន់កណ្តាល', 'zone-002': 'តំបន់ខាងជើង' },
      province: { 'province-001': 'ភ្នំពេញ', 'province-002': 'កណ្តាល' },
      department: { 'dept-001': 'នាយកដ្ឋានអប់រំភ្នំពេញ' },
      cluster: { 'cluster-001': 'ចង្កោមដូនពេញ' },
      school: { 'school-001': 'សាលាបឋមសិក្សាហ៊ុនសែន' },
    };

    return entityNamesKh[entityType]?.[entityId] || `${entityType}-${entityId}`;
  }

  private getSubjectNameKh(subject: string): string {
    const subjectNamesKh = {
      Math: 'គណិតវិទ្យា',
      Khmer: 'ភាសាខ្មែរ',
      Science: 'វិទ្យាសាស្ត្រ',
      'Social Studies': 'សង្គមវិទ្យា',
      English: 'ភាសាអង់គ្លេស',
      'Physical Education': 'អប់រំកាយ',
      Arts: 'សិល្បៈ',
    };

    return subjectNamesKh[subject] || subject;
  }
}
