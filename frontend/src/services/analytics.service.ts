import axios from 'axios';
import { DashboardFilter, ReportConfig, ExportOptions } from '../types/analytics';
import mockAnalyticsService from './analytics.mock.service';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true' || false;

export class AnalyticsService {
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  }

  async getDashboardData(filter: DashboardFilter = {}) {
    if (USE_MOCK) {
      return mockAnalyticsService.getDashboardData(filter);
    }

    try {
      const response = await axios.get(`${API_URL}/analytics/dashboard`, {
        params: {
          viewType: filter.viewType || 'overview',
          timePeriod: filter.timeRange?.preset || 'last_30_days',
          customStartDate: filter.timeRange?.startDate,
          customEndDate: filter.timeRange?.endDate,
        },
        headers: this.getAuthHeader(),
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      // Fall back to mock data if API fails
      if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
        console.warn('API not available, using mock data');
        return mockAnalyticsService.getDashboardData(filter);
      }
      throw error;
    }
  }

  async getPerformanceMetrics(filter: DashboardFilter = {}) {
    try {
      const response = await axios.get(`${API_URL}/analytics/performance-metrics`, {
        params: {
          startDate: filter.timeRange?.startDate,
          endDate: filter.timeRange?.endDate,
          zoneId: filter.zoneId,
          provinceId: filter.provinceId,
          departmentId: filter.departmentId,
          clusterId: filter.clusterId,
          schoolId: filter.schoolIds?.[0],
          grades: filter.gradeLevels,
          subjects: filter.subjects,
        },
        headers: this.getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      throw error;
    }
  }

  async getTimeSeriesData(filter: DashboardFilter = {}, granularity = 'monthly') {
    if (USE_MOCK) {
      return mockAnalyticsService.getTimeSeriesData(filter, granularity);
    }

    try {
      const response = await axios.get(`${API_URL}/analytics/time-series`, {
        params: {
          startDate: filter.timeRange?.startDate,
          endDate: filter.timeRange?.endDate,
          zoneId: filter.zoneId,
          provinceId: filter.provinceId,
          departmentId: filter.departmentId,
          clusterId: filter.clusterId,
          schoolId: filter.schoolIds?.[0],
          grades: filter.gradeLevels,
          subjects: filter.subjects,
          granularity,
        },
        headers: this.getAuthHeader(),
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching time series data:', error);
      // Fall back to mock data if API fails
      if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
        console.warn('API not available, using mock data');
        return mockAnalyticsService.getTimeSeriesData(filter, granularity);
      }
      throw error;
    }
  }

  async getGeographicPerformance(filter: DashboardFilter = {}, entityType = 'school') {
    if (USE_MOCK) {
      return mockAnalyticsService.getGeographicPerformance(filter, entityType);
    }

    try {
      const response = await axios.get(`${API_URL}/analytics/geographic-performance/${entityType}`, {
        params: {
          startDate: filter.timeRange?.startDate,
          endDate: filter.timeRange?.endDate,
          zoneId: filter.zoneId,
          provinceId: filter.provinceId,
          departmentId: filter.departmentId,
          clusterId: filter.clusterId,
          grades: filter.gradeLevels,
          subjects: filter.subjects,
        },
        headers: this.getAuthHeader(),
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching geographic performance:', error);
      if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
        console.warn('API not available, using mock data');
        return mockAnalyticsService.getGeographicPerformance(filter, entityType);
      }
      throw error;
    }
  }

  async getSubjectPerformance(filter: DashboardFilter = {}) {
    try {
      const response = await axios.get(`${API_URL}/analytics/subject-performance`, {
        params: {
          startDate: filter.timeRange?.startDate,
          endDate: filter.timeRange?.endDate,
          zoneId: filter.zoneId,
          provinceId: filter.provinceId,
          departmentId: filter.departmentId,
          clusterId: filter.clusterId,
          schoolId: filter.schoolIds?.[0],
          grades: filter.gradeLevels,
        },
        headers: this.getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching subject performance:', error);
      throw error;
    }
  }

  async analyzeTrend(filter: DashboardFilter = {}, metric: string, granularity = 'monthly', periods = 6) {
    try {
      const response = await axios.post(
        `${API_URL}/analytics/trend-analysis`,
        {
          metric,
          granularity,
          periods,
          includePrediction: true,
        },
        {
          params: {
            startDate: filter.timeRange?.startDate,
            endDate: filter.timeRange?.endDate,
            zoneId: filter.zoneId,
            provinceId: filter.provinceId,
            departmentId: filter.departmentId,
            clusterId: filter.clusterId,
            schoolId: filter.schoolIds?.[0],
            grades: filter.gradeLevels,
            subjects: filter.subjects,
          },
          headers: this.getAuthHeader(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error analyzing trend:', error);
      throw error;
    }
  }

  async compareEntities(
    filter: DashboardFilter = {},
    entityIds: string[],
    entityType: string,
    metrics: string[]
  ) {
    try {
      const response = await axios.post(
        `${API_URL}/analytics/comparison-analysis`,
        {
          entityIds,
          entityType,
          metrics,
        },
        {
          params: {
            startDate: filter.timeRange?.startDate,
            endDate: filter.timeRange?.endDate,
          },
          headers: this.getAuthHeader(),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error comparing entities:', error);
      throw error;
    }
  }

  async getReportTemplates() {
    if (USE_MOCK) {
      return mockAnalyticsService.getReportTemplates();
    }

    try {
      const response = await axios.get(`${API_URL}/analytics/reports/templates`, {
        headers: this.getAuthHeader(),
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching report templates:', error);
      if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
        console.warn('API not available, using mock data');
        return mockAnalyticsService.getReportTemplates();
      }
      throw error;
    }
  }

  async generateReport(config: ReportConfig) {
    try {
      const response = await axios.post(`${API_URL}/analytics/reports/generate`, config, {
        headers: this.getAuthHeader(),
        responseType: 'blob',
      });
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${new Date().toISOString().split('T')[0]}.${config.format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return true;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  async generateCustomReport(sections: string[], filters: DashboardFilter, format = 'pdf') {
    try {
      const response = await axios.post(
        `${API_URL}/analytics/reports/custom`,
        {
          sections,
          filters: {
            ...filters,
            format,
          },
        },
        {
          headers: this.getAuthHeader(),
          responseType: 'blob',
        }
      );
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `custom-report-${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return true;
    } catch (error) {
      console.error('Error generating custom report:', error);
      throw error;
    }
  }

  async exportData(filter: DashboardFilter = {}, dataType = 'sessions') {
    try {
      const response = await axios.get(`${API_URL}/analytics/export/data`, {
        params: {
          startDate: filter.timeRange?.startDate,
          endDate: filter.timeRange?.endDate,
          zoneId: filter.zoneId,
          provinceId: filter.provinceId,
          departmentId: filter.departmentId,
          clusterId: filter.clusterId,
          schoolId: filter.schoolIds?.[0],
          grades: filter.gradeLevels,
          subjects: filter.subjects,
          type: dataType,
        },
        headers: this.getAuthHeader(),
        responseType: 'blob',
      });
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics-data-${dataType}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return true;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  async getInsights(filter: DashboardFilter = {}) {
    try {
      const response = await axios.get(`${API_URL}/analytics/insights`, {
        params: {
          startDate: filter.timeRange?.startDate,
          endDate: filter.timeRange?.endDate,
          zoneId: filter.zoneId,
          provinceId: filter.provinceId,
          departmentId: filter.departmentId,
          clusterId: filter.clusterId,
          schoolId: filter.schoolIds?.[0],
          grades: filter.gradeLevels,
          subjects: filter.subjects,
        },
        headers: this.getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching insights:', error);
      throw error;
    }
  }

  async getRealtimeUpdates() {
    try {
      const response = await axios.get(`${API_URL}/analytics/dashboard/realtime`, {
        headers: this.getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching realtime updates:', error);
      throw error;
    }
  }

  async getTeacherPerformance(filter: DashboardFilter = {}) {
    if (USE_MOCK) {
      return mockAnalyticsService.getTeacherPerformance(filter);
    }

    try {
      const response = await axios.get(`${API_URL}/analytics/teacher-performance`, {
        params: {
          startDate: filter.timeRange?.startDate,
          endDate: filter.timeRange?.endDate,
          zoneId: filter.zoneId,
          provinceId: filter.provinceId,
          departmentId: filter.departmentId,
          clusterId: filter.clusterId,
          schoolId: filter.schoolIds?.[0],
          grades: filter.gradeLevels,
          subjects: filter.subjects,
        },
        headers: this.getAuthHeader(),
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching teacher performance:', error);
      if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
        console.warn('API not available, using mock data');
        return mockAnalyticsService.getTeacherPerformance(filter);
      }
      throw error;
    }
  }

  async getSchoolPerformance(filter: DashboardFilter = {}) {
    if (USE_MOCK) {
      return mockAnalyticsService.getSchoolPerformance(filter);
    }

    try {
      const response = await axios.get(`${API_URL}/analytics/school-performance`, {
        params: {
          startDate: filter.timeRange?.startDate,
          endDate: filter.timeRange?.endDate,
          zoneId: filter.zoneId,
          provinceId: filter.provinceId,
          departmentId: filter.departmentId,
          clusterId: filter.clusterId,
          grades: filter.gradeLevels,
          subjects: filter.subjects,
        },
        headers: this.getAuthHeader(),
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching school performance:', error);
      if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
        console.warn('API not available, using mock data');
        return mockAnalyticsService.getSchoolPerformance(filter);
      }
      throw error;
    }
  }
}

export default new AnalyticsService();