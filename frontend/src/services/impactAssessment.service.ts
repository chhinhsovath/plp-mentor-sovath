import axios from './api';

export interface ImpactAssessmentData {
  id: string;
  schoolName: string;
  schoolType: string;
  province: string;
  district: string;
  commune: string;
  village: string;
  gradeData: {
    grade: string;
    totalStudents: number;
    affectedStudents: number;
  }[];
  totals: {
    totalStudents: number;
    totalAffected: number;
    percentage: number;
  };
  impactTypes: string[];
  severity: number;
  incidentDate: string;
  duration?: number;
  teacherAffected?: number;
  contactInfo?: string;
  description?: string;
  submittedAt: string;
}

class ImpactAssessmentService {
  private baseURL = '/api/impact-assessments';

  async submitAssessment(data: Omit<ImpactAssessmentData, 'id' | 'submittedAt'>): Promise<ImpactAssessmentData> {
    try {
      const response = await axios.post(this.baseURL, data);
      return response.data.data;
    } catch (error: any) {
      // If API fails, throw error instead of fallback
      throw new Error(error.response?.data?.error || 'Failed to submit assessment');
    }
  }

  async getAssessments(filters?: {
    province?: string;
    severity?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: ImpactAssessmentData[]; pagination: any }> {
    try {
      const response = await axios.get(this.baseURL, { params: filters });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch assessments');
    }
  }

  async getAssessmentById(id: string): Promise<ImpactAssessmentData | null> {
    try {
      const response = await axios.get(`${this.baseURL}/${id}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch assessment');
    }
  }

  async getStatistics(filters?: any): Promise<{
    totalReports: number;
    affectedSchools: number;
    totalAffectedStudents: number;
    totalAffectedTeachers: number;
    byProvince: Record<string, number>;
    bySeverity: Record<number, number>;
    bySchoolType: Record<string, number>;
  }> {
    try {
      const response = await axios.get(`${this.baseURL}/statistics`, { params: filters });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch statistics');
    }
  }

  async updateAssessment(id: string, data: Partial<ImpactAssessmentData>): Promise<ImpactAssessmentData> {
    try {
      const response = await axios.patch(`${this.baseURL}/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update assessment');
    }
  }

  async deleteAssessment(id: string): Promise<void> {
    try {
      await axios.delete(`${this.baseURL}/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to delete assessment');
    }
  }

  async verifyAssessment(id: string, status: 'verified' | 'rejected', verificationNotes?: string): Promise<ImpactAssessmentData> {
    try {
      const response = await axios.post(`${this.baseURL}/${id}/verify`, {
        status,
        verificationNotes
      });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to verify assessment');
    }
  }

  async exportToCSV(filters?: any): Promise<Blob> {
    try {
      const response = await axios.get(`${this.baseURL}/export/csv`, {
        params: filters,
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to export data');
    }
  }

}

export default new ImpactAssessmentService();