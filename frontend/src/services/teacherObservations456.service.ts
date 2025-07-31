import api from './api';
import { ObservationFormData } from '../components/observations/ObservationEntryForm';

export interface TeacherObservation456 extends ObservationFormData {
  id: string;
  observerId?: string;
  status: string;
  totalIntroductionScore: number;
  totalTeachingScore: number;
  totalLearningScore: number;
  totalAssessmentScore: number;
  overallScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface ObservationFilters {
  schoolCode?: string;
  grade?: string;
  subject?: string;
  observerId?: string;
  startDate?: string;
  endDate?: string;
}

export interface SchoolStatistics {
  totalObservations: number;
  averageScores: {
    introduction: number;
    teaching: number;
    learning: number;
    assessment: number;
    overall: number;
  };
  gradeDistribution: Record<string, number>;
  subjectDistribution: Record<string, number>;
  scoreDistribution: {
    excellent: number;
    good: number;
    needsImprovement: number;
  };
}

export interface DetailedReport {
  summary: {
    totalObservations: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
  data: Array<{
    id: string;
    schoolName: string;
    schoolCode: string;
    observationDate: string;
    grade: string;
    subject: string;
    teacherName: string;
    observerName: string;
    scores: {
      introduction: number;
      teaching: number;
      learning: number;
      assessment: number;
      overall: number;
    };
    studentCounts: ObservationFormData['studentCounts'];
  }>;
}

class TeacherObservations456Service {
  private baseUrl = '/teacher-observations-456';

  async create(data: ObservationFormData): Promise<TeacherObservation456> {
    const response = await api.post<TeacherObservation456>(this.baseUrl, data);
    return response.data;
  }

  async getAll(filters?: ObservationFilters): Promise<TeacherObservation456[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    
    const response = await api.get<TeacherObservation456[]>(`${this.baseUrl}?${params.toString()}`);
    return response.data;
  }

  async getById(id: string): Promise<TeacherObservation456> {
    const response = await api.get<TeacherObservation456>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async update(id: string, data: Partial<ObservationFormData>): Promise<TeacherObservation456> {
    const response = await api.patch<TeacherObservation456>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  async getSchoolStatistics(schoolCode: string, startDate?: string, endDate?: string): Promise<SchoolStatistics> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get<SchoolStatistics>(
      `${this.baseUrl}/statistics/school/${schoolCode}?${params.toString()}`
    );
    return response.data;
  }

  async getDetailedReport(filters?: ObservationFilters): Promise<DetailedReport> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    
    const response = await api.get<DetailedReport>(`${this.baseUrl}/report?${params.toString()}`);
    return response.data;
  }
}

export default new TeacherObservations456Service();