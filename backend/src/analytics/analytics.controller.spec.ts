import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { DashboardService } from './dashboard.service';
import { ExportService } from './export.service';
import { User, UserRole } from '../entities/user.entity';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let analyticsService: AnalyticsService;
  let dashboardService: DashboardService;
  let exportService: ExportService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'testuser',
    fullName: 'Test User',
    role: UserRole.PROVINCIAL,
    locationScope: 'Phnom Penh',
  };

  const mockOverviewMetrics = {
    totalSessions: 150,
    completedSessions: 120,
    pendingSessions: 30,
    averageScore: 2.5,
    improvementPlansCreated: 45,
    activeTeachers: 75,
  };

  const mockTrendData = [
    { month: '2025-01', avg_score: 2.3, session_count: 25 },
    { month: '2025-02', avg_score: 2.5, session_count: 30 },
    { month: '2025-03', avg_score: 2.7, session_count: 35 },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: {
            getOverviewMetrics: jest.fn(),
            getPerformanceTrends: jest.fn(),
            getSubjectPerformance: jest.fn(),
            getGradePerformance: jest.fn(),
            getImprovementPlanMetrics: jest.fn(),
            getTeacherRankings: jest.fn(),
            getSchoolComparison: jest.fn(),
            exportAnalyticsData: jest.fn(),
          },
        },
        {
          provide: DashboardService,
          useValue: {
            getDashboardData: jest.fn(),
            getRealtimeUpdates: jest.fn(),
          },
        },
        {
          provide: ExportService,
          useValue: {
            exportToPDF: jest.fn(),
            exportToExcel: jest.fn(),
            exportToCSV: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    analyticsService = module.get<AnalyticsService>(AnalyticsService);
    dashboardService = module.get<DashboardService>(DashboardService);
    exportService = module.get<ExportService>(ExportService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getOverview', () => {
    it('should return overview metrics', async () => {
      jest.spyOn(analyticsService, 'getOverviewMetrics').mockResolvedValue(mockOverviewMetrics);

      const result = await controller.getOverview(mockUser as User);

      expect(result).toEqual(mockOverviewMetrics);
      expect(analyticsService.getOverviewMetrics).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getPerformanceTrends', () => {
    it('should return performance trends with filters', async () => {
      const filterDto = {
        startDate: '2025-01-01',
        endDate: '2025-03-31',
        subject: 'Khmer',
      };

      jest.spyOn(analyticsService, 'getPerformanceTrends').mockResolvedValue(mockTrendData);

      const result = await controller.getPerformanceTrends(filterDto, mockUser as User);

      expect(result).toEqual(mockTrendData);
      expect(analyticsService.getPerformanceTrends).toHaveBeenCalledWith(mockUser, filterDto);
    });
  });

  describe('getSubjectPerformance', () => {
    it('should return subject performance data', async () => {
      const mockSubjectData = [
        { subject: 'Khmer', avg_score: 2.6, session_count: 45 },
        { subject: 'Mathematics', avg_score: 2.4, session_count: 38 },
      ];

      jest.spyOn(analyticsService, 'getSubjectPerformance').mockResolvedValue(mockSubjectData);

      const result = await controller.getSubjectPerformance(mockUser as User);

      expect(result).toEqual(mockSubjectData);
      expect(analyticsService.getSubjectPerformance).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getGradePerformance', () => {
    it('should return grade performance data', async () => {
      const mockGradeData = [
        { grade: '1', avg_score: 2.7, session_count: 28 },
        { grade: '2', avg_score: 2.5, session_count: 25 },
      ];

      jest.spyOn(analyticsService, 'getGradePerformance').mockResolvedValue(mockGradeData);

      const result = await controller.getGradePerformance(mockUser as User);

      expect(result).toEqual(mockGradeData);
      expect(analyticsService.getGradePerformance).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getImprovementPlanMetrics', () => {
    it('should return improvement plan metrics', async () => {
      const mockPlanMetrics = {
        totalPlans: 45,
        completedPlans: 32,
        inProgressPlans: 10,
        overdueActivities: 8,
        averageCompletionTime: 15.5,
      };

      jest.spyOn(analyticsService, 'getImprovementPlanMetrics').mockResolvedValue(mockPlanMetrics);

      const result = await controller.getImprovementPlanMetrics(mockUser as User);

      expect(result).toEqual(mockPlanMetrics);
      expect(analyticsService.getImprovementPlanMetrics).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getTeacherRankings', () => {
    it('should return teacher rankings with limit', async () => {
      const mockRankings = [
        { teacher_name: 'Ms. Sophea', avg_score: 2.8, session_count: 12 },
        { teacher_name: 'Mr. Dara', avg_score: 2.6, session_count: 10 },
      ];

      jest.spyOn(analyticsService, 'getTeacherRankings').mockResolvedValue(mockRankings);

      const result = await controller.getTeacherRankings({ limit: 10 }, mockUser as User);

      expect(result).toEqual(mockRankings);
      expect(analyticsService.getTeacherRankings).toHaveBeenCalledWith(mockUser, { limit: 10 });
    });
  });

  describe('getSchoolComparison', () => {
    it('should return school comparison data', async () => {
      const mockComparison = [
        { school_name: 'Hun Sen Primary School', avg_score: 2.7, session_count: 25 },
        { school_name: 'Preah Sisowath School', avg_score: 2.5, session_count: 20 },
      ];

      jest.spyOn(analyticsService, 'getSchoolComparison').mockResolvedValue(mockComparison);

      const result = await controller.getSchoolComparison(mockUser as User);

      expect(result).toEqual(mockComparison);
      expect(analyticsService.getSchoolComparison).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getDashboard', () => {
    it('should return dashboard data', async () => {
      const mockDashboardData = {
        overview: mockOverviewMetrics,
        trends: mockTrendData,
        recentSessions: [],
        upcomingActivities: [],
      };

      jest.spyOn(dashboardService, 'getDashboardData').mockResolvedValue(mockDashboardData);

      const result = await controller.getDashboard(mockUser as User);

      expect(result).toEqual(mockDashboardData);
      expect(dashboardService.getDashboardData).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getRealtimeUpdates', () => {
    it('should return realtime updates', async () => {
      const mockUpdates = {
        lastUpdated: new Date(),
        newSessions: 3,
        completedToday: 5,
        overdueActivities: 2,
      };

      jest.spyOn(dashboardService, 'getRealtimeUpdates').mockResolvedValue(mockUpdates);

      const result = await controller.getRealtimeUpdates(mockUser as User);

      expect(result).toEqual(mockUpdates);
      expect(dashboardService.getRealtimeUpdates).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('exportData', () => {
    it('should export data in PDF format', async () => {
      const exportDto = {
        format: 'pdf' as const,
        startDate: '2025-01-01',
        endDate: '2025-07-31',
        includeCharts: true,
      };

      const mockPDFBuffer = Buffer.from('mock-pdf-content');
      jest.spyOn(exportService, 'exportToPDF').mockResolvedValue(mockPDFBuffer);

      const result = await controller.exportData(exportDto, mockUser as User);

      expect(result).toEqual(mockPDFBuffer);
      expect(exportService.exportToPDF).toHaveBeenCalledWith(mockUser, exportDto);
    });

    it('should export data in Excel format', async () => {
      const exportDto = {
        format: 'excel' as const,
        startDate: '2025-01-01',
        endDate: '2025-07-31',
      };

      const mockExcelBuffer = Buffer.from('mock-excel-content');
      jest.spyOn(exportService, 'exportToExcel').mockResolvedValue(mockExcelBuffer);

      const result = await controller.exportData(exportDto, mockUser as User);

      expect(result).toEqual(mockExcelBuffer);
      expect(exportService.exportToExcel).toHaveBeenCalledWith(mockUser, exportDto);
    });

    it('should export data in CSV format', async () => {
      const exportDto = {
        format: 'csv' as const,
        startDate: '2025-01-01',
        endDate: '2025-07-31',
      };

      const mockCSVString = 'school,teacher,subject,grade,score\nTest School,Test Teacher,Khmer,1,2.5';
      jest.spyOn(exportService, 'exportToCSV').mockResolvedValue(mockCSVString);

      const result = await controller.exportData(exportDto, mockUser as User);

      expect(result).toEqual(mockCSVString);
      expect(exportService.exportToCSV).toHaveBeenCalledWith(mockUser, exportDto);
    });
  });
});