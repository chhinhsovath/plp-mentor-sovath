import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObservationSession } from '../entities/observation-session.entity';
import { IndicatorResponse } from '../entities/indicator-response.entity';
import { ImprovementPlan } from '../entities/improvement-plan.entity';
import { Repository } from 'typeorm';
import { AnalyticsFilterDto } from './dto/analytics-filter.dto';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let sessionRepository: Repository<ObservationSession>;
  let indicatorRepository: Repository<IndicatorResponse>;
  let improvementRepository: Repository<ImprovementPlan>;

  const mockSessionRepository = {
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        {
          id: '1',
          schoolName: 'Test School 1',
          teacherName: 'Teacher 1',
          subject: 'Khmer',
          grade: '1',
          dateObserved: new Date('2025-01-01'),
          status: 'COMPLETED',
          indicatorResponses: [
            { indicatorId: '1', selectedScore: 3 },
            { indicatorId: '2', selectedScore: 2 },
          ],
        },
        {
          id: '2',
          schoolName: 'Test School 2',
          teacherName: 'Teacher 2',
          subject: 'Math',
          grade: '2',
          dateObserved: new Date('2025-01-02'),
          status: 'COMPLETED',
          indicatorResponses: [
            { indicatorId: '1', selectedScore: 2 },
            { indicatorId: '2', selectedScore: 1 },
          ],
        },
      ]),
      getCount: jest.fn().mockResolvedValue(2),
    })),
    count: jest.fn().mockResolvedValue(2),
    find: jest.fn().mockResolvedValue([
      {
        id: '1',
        schoolName: 'Test School 1',
        teacherName: 'Teacher 1',
        subject: 'Khmer',
        grade: '1',
      },
      {
        id: '2',
        schoolName: 'Test School 2',
        teacherName: 'Teacher 2',
        subject: 'Math',
        grade: '2',
      },
    ]),
  };

  const mockIndicatorRepository = {
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        { indicatorId: '1', avgScore: 2.5, responseCount: 2 },
        { indicatorId: '2', avgScore: 1.5, responseCount: 2 },
      ]),
    })),
  };

  const mockImprovementRepository = {
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        {
          id: '1',
          sessionId: '1',
          status: 'IN_PROGRESS',
          createdAt: new Date('2025-01-01'),
          actions: [
            { id: '1', description: 'Action 1', status: 'COMPLETED' },
            { id: '2', description: 'Action 2', status: 'PENDING' },
          ],
        },
      ]),
      getCount: jest.fn().mockResolvedValue(1),
    })),
    count: jest.fn().mockResolvedValue(1),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: getRepositoryToken(ObservationSession),
          useValue: mockSessionRepository,
        },
        {
          provide: getRepositoryToken(IndicatorResponse),
          useValue: mockIndicatorRepository,
        },
        {
          provide: getRepositoryToken(ImprovementPlan),
          useValue: mockImprovementRepository,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    sessionRepository = module.get<Repository<ObservationSession>>(
      getRepositoryToken(ObservationSession),
    );
    indicatorRepository = module.get<Repository<IndicatorResponse>>(
      getRepositoryToken(IndicatorResponse),
    );
    improvementRepository = module.get<Repository<ImprovementPlan>>(
      getRepositoryToken(ImprovementPlan),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getObservationMetrics', () => {
    it('should return observation metrics', async () => {
      const filter: AnalyticsFilterDto = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        province: 'Test Province',
        district: 'Test District',
        school: 'Test School',
        grade: '1',
        subject: 'Khmer',
      };

      const result = await service.getObservationMetrics(filter);

      expect(result).toBeDefined();
      expect(result.totalObservations).toBe(2);
      expect(sessionRepository.createQueryBuilder).toHaveBeenCalled();
    });

    it('should handle empty filter', async () => {
      const filter: AnalyticsFilterDto = {};

      const result = await service.getObservationMetrics(filter);

      expect(result).toBeDefined();
      expect(result.totalObservations).toBe(2);
    });
  });

  describe('getIndicatorPerformance', () => {
    it('should return indicator performance data', async () => {
      const filter: AnalyticsFilterDto = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      };

      const result = await service.getIndicatorPerformance(filter);

      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result[0].indicatorId).toBe('1');
      expect(result[0].avgScore).toBe(2.5);
      expect(indicatorRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('getImprovementPlanMetrics', () => {
    it('should return improvement plan metrics', async () => {
      const filter: AnalyticsFilterDto = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      };

      const result = await service.getImprovementPlanMetrics(filter);

      expect(result).toBeDefined();
      expect(result.totalPlans).toBe(1);
      expect(improvementRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('getPerformanceTrends', () => {
    it('should return performance trends over time', async () => {
      const filter: AnalyticsFilterDto = {
        startDate: '2025-01-01',
        endDate: '2025-03-31',
        timeUnit: 'month',
      };

      // Mock the implementation for this specific test
      mockSessionRepository.createQueryBuilder = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { period: '2025-01', avgScore: 2.5, observationCount: 2 },
          { period: '2025-02', avgScore: 2.7, observationCount: 3 },
          { period: '2025-03', avgScore: 2.9, observationCount: 4 },
        ]),
      }));

      const result = await service.getPerformanceTrends(filter);

      expect(result).toBeDefined();
      expect(result.length).toBe(3);
      expect(result[0].period).toBe('2025-01');
      expect(result[0].avgScore).toBe(2.5);
    });

    it('should default to monthly trends if timeUnit not specified', async () => {
      const filter: AnalyticsFilterDto = {
        startDate: '2025-01-01',
        endDate: '2025-03-31',
      };

      // Mock the implementation for this specific test
      mockSessionRepository.createQueryBuilder = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { period: '2025-01', avgScore: 2.5, observationCount: 2 },
          { period: '2025-02', avgScore: 2.7, observationCount: 3 },
          { period: '2025-03', avgScore: 2.9, observationCount: 4 },
        ]),
      }));

      const result = await service.getPerformanceTrends(filter);

      expect(result).toBeDefined();
      expect(result.length).toBe(3);
    });
  });

  describe('getSchoolComparison', () => {
    it('should return school comparison data', async () => {
      const filter: AnalyticsFilterDto = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        district: 'Test District',
      };

      // Mock the implementation for this specific test
      mockSessionRepository.createQueryBuilder = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { schoolName: 'School A', avgScore: 2.8, observationCount: 5 },
          { schoolName: 'School B', avgScore: 2.5, observationCount: 4 },
          { schoolName: 'School C', avgScore: 2.9, observationCount: 6 },
        ]),
      }));

      const result = await service.getSchoolComparison(filter);

      expect(result).toBeDefined();
      expect(result.length).toBe(3);
      expect(result[0].schoolName).toBe('School A');
      expect(result[0].avgScore).toBe(2.8);
    });
  });

  describe('getSubjectPerformance', () => {
    it('should return subject performance data', async () => {
      const filter: AnalyticsFilterDto = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      };

      // Mock the implementation for this specific test
      mockSessionRepository.createQueryBuilder = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { subject: 'Khmer', avgScore: 2.7, observationCount: 10 },
          { subject: 'Math', avgScore: 2.5, observationCount: 8 },
          { subject: 'Science', avgScore: 2.8, observationCount: 6 },
        ]),
      }));

      const result = await service.getSubjectPerformance(filter);

      expect(result).toBeDefined();
      expect(result.length).toBe(3);
      expect(result[0].subject).toBe('Khmer');
      expect(result[0].avgScore).toBe(2.7);
    });
  });
});