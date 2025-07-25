import { DashboardFilter, ReportConfig, ExportOptions } from '../types/analytics';

// Mock data generator for analytics
export class MockAnalyticsService {
  private generateRandomData(min: number, max: number, count: number): number[] {
    return Array.from({ length: count }, () => Math.floor(Math.random() * (max - min + 1)) + min);
  }

  private generateTimeSeriesData(days: number) {
    const data = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        observations: Math.floor(Math.random() * 50) + 20,
        avgScore: Math.floor(Math.random() * 30) + 60,
        completionRate: Math.floor(Math.random() * 20) + 70,
      });
    }
    
    return data;
  }

  async getDashboardData(filter: DashboardFilter = {}) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      summary: {
        totalObservations: 1234,
        totalTeachers: 156,
        totalSchools: 42,
        avgScore: 78.5,
        completionRate: 85.2,
        improvementRate: 12.3,
      },
      recentActivity: {
        todayObservations: 23,
        weekObservations: 134,
        monthObservations: 567,
        pendingReviews: 12,
      },
      topPerformers: {
        schools: [
          { id: '1', name: 'សាលាបឋមសិក្សា ភ្នំពេញ', avgScore: 92.3, observations: 45 },
          { id: '2', name: 'សាលាបឋមសិក្សា សៀមរាប', avgScore: 89.7, observations: 38 },
          { id: '3', name: 'សាលាបឋមសិក្សា បាត់ដំបង', avgScore: 87.2, observations: 42 },
        ],
        teachers: [
          { id: '1', name: 'គ្រូ សុខា', avgScore: 95.2, observations: 12 },
          { id: '2', name: 'គ្រូ ចន្ធា', avgScore: 93.8, observations: 15 },
          { id: '3', name: 'គ្រូ វិចិត្រា', avgScore: 91.5, observations: 11 },
        ],
      },
      scoreDistribution: {
        excellent: 234,  // 90-100
        good: 456,       // 80-89
        satisfactory: 389, // 70-79
        needsImprovement: 155, // <70
      },
    };
  }

  async getPerformanceMetrics(filter: DashboardFilter = {}) {
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      metrics: [
        {
          name: 'Average Score',
          value: 78.5,
          change: 3.2,
          trend: 'up',
          sparkline: this.generateRandomData(70, 85, 7),
        },
        {
          name: 'Completion Rate',
          value: 85.2,
          change: -1.5,
          trend: 'down',
          sparkline: this.generateRandomData(80, 90, 7),
        },
        {
          name: 'Active Teachers',
          value: 142,
          change: 5,
          trend: 'up',
          sparkline: this.generateRandomData(135, 145, 7),
        },
        {
          name: 'Observations/Day',
          value: 23.4,
          change: 2.1,
          trend: 'up',
          sparkline: this.generateRandomData(18, 28, 7),
        },
      ],
    };
  }

  async getTimeSeriesData(filter: DashboardFilter = {}, granularity = 'monthly') {
    await new Promise(resolve => setTimeout(resolve, 400));

    const days = granularity === 'daily' ? 30 : granularity === 'weekly' ? 84 : 365;
    return this.generateTimeSeriesData(days);
  }

  async getGeographicPerformance(filter: DashboardFilter = {}, entityType = 'school') {
    await new Promise(resolve => setTimeout(resolve, 300));

    const provinces = [
      'ភ្នំពេញ', 'កណ្តាល', 'កំពង់ចាម', 'កំពង់ឆ្នាំង', 'កំពង់ស្ពឺ',
      'កំពង់ធំ', 'កំពត', 'តាកែវ', 'បាត់ដំបង', 'បន្ទាយមានជ័យ'
    ];

    return provinces.map((name, index) => ({
      entityId: `${entityType}-${index + 1}`,
      entityName: name,
      entityNameKh: name,
      totalSessions: Math.floor(Math.random() * 100) + 50,
      averageScore: Math.floor(Math.random() * 20) + 70,
      completionRate: Math.floor(Math.random() * 20) + 75,
      improvementRate: Math.floor(Math.random() * 10) + 5,
      topPerformers: Math.floor(Math.random() * 10) + 5,
      needsSupport: Math.floor(Math.random() * 5) + 1,
    }));
  }

  async getSubjectPerformance(filter: DashboardFilter = {}) {
    await new Promise(resolve => setTimeout(resolve, 300));

    const subjects = ['ភាសាខ្មែរ', 'គណិតវិទ្យា', 'វិទ្យាសាស្ត្រ', 'សិក្សាសង្គម'];
    
    return subjects.map(subject => ({
      subject,
      averageScore: Math.floor(Math.random() * 20) + 70,
      totalSessions: Math.floor(Math.random() * 200) + 100,
      improvement: Math.floor(Math.random() * 10) - 5,
      breakdown: {
        excellent: Math.floor(Math.random() * 30) + 20,
        good: Math.floor(Math.random() * 40) + 30,
        satisfactory: Math.floor(Math.random() * 30) + 20,
        needsImprovement: Math.floor(Math.random() * 20) + 10,
      },
    }));
  }

  async getGradePerformance(filter: DashboardFilter = {}) {
    await new Promise(resolve => setTimeout(resolve, 300));

    const grades = ['ថ្នាក់ទី១', 'ថ្នាក់ទី២', 'ថ្នាក់ទី៣', 'ថ្នាក់ទី៤', 'ថ្នាក់ទី៥', 'ថ្នាក់ទី៦'];
    
    return grades.map(grade => ({
      grade,
      averageScore: Math.floor(Math.random() * 20) + 70,
      totalSessions: Math.floor(Math.random() * 150) + 50,
      completionRate: Math.floor(Math.random() * 20) + 75,
      activeTeachers: Math.floor(Math.random() * 20) + 10,
    }));
  }

  async analyzeTrend(filter: DashboardFilter = {}, metric: string, granularity: string, periods: number) {
    await new Promise(resolve => setTimeout(resolve, 300));

    const dataPoints = [];
    const today = new Date();
    
    for (let i = periods - 1; i >= 0; i--) {
      const date = new Date(today);
      if (granularity === 'daily') {
        date.setDate(date.getDate() - i);
      } else if (granularity === 'weekly') {
        date.setDate(date.getDate() - (i * 7));
      } else if (granularity === 'monthly') {
        date.setMonth(date.getMonth() - i);
      }
      
      dataPoints.push({
        period: date.toISOString().split('T')[0],
        value: Math.floor(Math.random() * 30) + 60,
        change: Math.floor(Math.random() * 10) - 5,
      });
    }

    return {
      metric,
      granularity,
      periods,
      dataPoints,
      trend: Math.random() > 0.5 ? 'increasing' : 'decreasing',
      averageValue: 75.5,
      totalChange: 5.2,
    };
  }

  async compareEntities(entityType: string, entityIds: string[]) {
    await new Promise(resolve => setTimeout(resolve, 400));

    return entityIds.map(id => ({
      entityId: id,
      entityName: `Entity ${id}`,
      metrics: {
        averageScore: Math.floor(Math.random() * 20) + 70,
        totalSessions: Math.floor(Math.random() * 100) + 50,
        completionRate: Math.floor(Math.random() * 20) + 75,
        improvementRate: Math.floor(Math.random() * 10) + 5,
      },
      timeSeriesData: this.generateTimeSeriesData(30),
    }));
  }

  async getReportTemplates() {
    await new Promise(resolve => setTimeout(resolve, 200));

    return [
      {
        id: '1',
        name: 'Monthly Performance Report',
        nameKh: 'របាយការណ៍ប្រចាំខែ',
        description: 'Comprehensive monthly performance analysis',
        descriptionKh: 'ការវិភាគលម្អិតអំពីការអនុវត្តប្រចាំខែ',
        category: 'performance',
        parameters: ['timeRange', 'school', 'grade', 'subject'],
      },
      {
        id: '2',
        name: 'Teacher Progress Report',
        nameKh: 'របាយការណ៍វឌ្ឍនភាពគ្រូ',
        description: 'Individual teacher progress and observations',
        descriptionKh: 'វឌ្ឍនភាព និងការសង្កេតរបស់គ្រូម្នាក់ៗ',
        category: 'teacher',
        parameters: ['teacher', 'timeRange', 'includeObservations'],
      },
      {
        id: '3',
        name: 'School Comparison Report',
        nameKh: 'របាយការណ៍ប្រៀបធៀបសាលា',
        description: 'Compare performance across schools',
        descriptionKh: 'ប្រៀបធៀបការអនុវត្តរវាងសាលារៀន',
        category: 'comparison',
        parameters: ['schools', 'timeRange', 'metrics'],
      },
    ];
  }

  async generateReport(config: ReportConfig) {
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      reportId: `report-${Date.now()}`,
      title: config.title,
      generatedAt: new Date().toISOString(),
      status: 'completed',
      downloadUrl: '/api/reports/download/sample-report.pdf',
    };
  }

  async exportData(filter: DashboardFilter = {}, options: ExportOptions) {
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      exportId: `export-${Date.now()}`,
      format: options.format,
      status: 'completed',
      downloadUrl: `/api/exports/download/sample-export.${options.format}`,
    };
  }

  async getRecentActivity(limit = 10) {
    await new Promise(resolve => setTimeout(resolve, 300));

    const activities = [];
    const types = ['observation_completed', 'plan_created', 'report_generated', 'teacher_joined'];
    const users = ['គ្រូ សុខា', 'គ្រូ ចន្ធា', 'គ្រូ វិចិត្រា', 'គ្រូ សុភាព'];
    
    for (let i = 0; i < limit; i++) {
      const date = new Date();
      date.setMinutes(date.getMinutes() - (i * 30));
      
      activities.push({
        id: `activity-${i}`,
        type: types[Math.floor(Math.random() * types.length)],
        user: users[Math.floor(Math.random() * users.length)],
        timestamp: date.toISOString(),
        description: 'Activity description',
      });
    }
    
    return activities;
  }

  async getNotifications() {
    await new Promise(resolve => setTimeout(resolve, 200));

    return [
      {
        id: '1',
        type: 'info',
        message: 'New observation forms available',
        messageKh: 'មានទម្រង់សង្កេតថ្មី',
        timestamp: new Date().toISOString(),
        read: false,
      },
      {
        id: '2',
        type: 'warning',
        message: '5 observations pending review',
        messageKh: 'ការសង្កេតចំនួន ៥ កំពុងរង់ចាំការត្រួតពិនិត្យ',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        read: false,
      },
    ];
  }

  async getTeacherPerformance(filter: any = {}) {
    await new Promise(resolve => setTimeout(resolve, 300));

    return [
      {
        id: '1',
        teacherName: 'វុឌ្ឍី សុធារ៉ា',
        schoolName: 'វិទ្យាល័យហុន សែន - កំពត',
        completedObservations: 12,
        averageScore: 88,
        lastObservation: '2024-01-15',
        improvement: 5.2
      },
      {
        id: '2',
        teacherName: 'ស៊ុន រតនា',
        schoolName: 'វិទ្យាល័យព្រះអង្គម្ចាស់',
        completedObservations: 8,
        averageScore: 76,
        lastObservation: '2024-01-14',
        improvement: -2.1
      },
      {
        id: '3',
        teacherName: 'ជា សុភាព',
        schoolName: 'រោងរៀនបឋមសិក្សាអង្គរ',
        completedObservations: 15,
        averageScore: 92,
        lastObservation: '2024-01-16',
        improvement: 8.5
      },
      {
        id: '4',
        teacherName: 'យ៉ូ វុធី',
        schoolName: 'វិទ្យាល័យចំការមន',
        completedObservations: 6,
        averageScore: 65,
        lastObservation: '2024-01-13',
        improvement: 1.2
      },
      {
        id: '5',
        teacherName: 'លី ម៉ុុងលីន',
        schoolName: 'រោងរៀនបឋមសិក្សាភ្នំពេញ',
        completedObservations: 10,
        averageScore: 82,
        lastObservation: '2024-01-15',
        improvement: 3.8
      }
    ];
  }

  async getSchoolPerformance(filter: any = {}) {
    await new Promise(resolve => setTimeout(resolve, 300));

    return [
      {
        id: '1',
        schoolName: 'វិទ្យាល័យហុន សែន - កំពត',
        totalTeachers: 25,
        totalObservations: 180,
        completionRate: 88,
        averageScore: 85,
        improvement: 7.2
      },
      {
        id: '2',
        schoolName: 'វិទ្យាល័យព្រះអង្គម្ចាស់',
        totalTeachers: 18,
        totalObservations: 120,
        completionRate: 75,
        averageScore: 78,
        improvement: -1.5
      },
      {
        id: '3',
        schoolName: 'រោងរៀនបឋមសិក្សាអង្គរ',
        totalTeachers: 32,
        totalObservations: 240,
        completionRate: 92,
        averageScore: 89,
        improvement: 12.3
      },
      {
        id: '4',
        schoolName: 'វិទ្យាល័យចំការមន',
        totalTeachers: 15,
        totalObservations: 85,
        completionRate: 65,
        averageScore: 72,
        improvement: 2.1
      },
      {
        id: '5',
        schoolName: 'រោងរៀនបឋមសិក្សាភ្នំពេញ',
        totalTeachers: 28,
        totalObservations: 210,
        completionRate: 82,
        averageScore: 81,
        improvement: 4.7
      }
    ];
  }
}

// Export a singleton instance
export default new MockAnalyticsService();