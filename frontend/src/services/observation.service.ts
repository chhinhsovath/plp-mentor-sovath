import axios, { AxiosInstance } from 'axios';
import { ObservationSession, ObservationForm, ObservationFormData } from '../types/observation';
import { authService } from './auth.service';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

class ObservationService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = authService.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await authService.refreshToken();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            authService.logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Get all observation sessions with optional filters
  async getObservations(params?: {
    page?: number;
    limit?: number;
    status?: string;
    teacherId?: string;
    observerId?: string;
    schoolId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    teacherName?: string;
    schoolName?: string;
    subject?: string;
    grade?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const response = await this.axiosInstance.get('/observation-sessions', { params });
    return response.data;
  }

  // Get a single observation session by ID
  async getObservationById(id: string): Promise<ObservationSession> {
    const response = await this.axiosInstance.get(`/observation-sessions/${id}`);
    return response.data;
  }

  // Create a new observation session
  async createObservation(data: ObservationFormData): Promise<ObservationSession> {
    const response = await this.axiosInstance.post('/observation-sessions', data);
    return response.data;
  }

  // Update an existing observation session
  async updateObservation(id: string, data: Partial<ObservationFormData>): Promise<ObservationSession> {
    const response = await this.axiosInstance.patch(`/observation-sessions/${id}`, data);
    return response.data;
  }

  // Delete an observation session
  async deleteObservation(id: string): Promise<void> {
    await this.axiosInstance.delete(`/observation-sessions/${id}`);
  }

  // Update observation status
  async updateObservationStatus(id: string, status: 'draft' | 'in_progress' | 'completed' | 'approved'): Promise<ObservationSession> {
    const response = await this.axiosInstance.patch(`/observation-sessions/${id}/status`, { status });
    return response.data;
  }

  // Submit observation for approval
  async submitForApproval(id: string): Promise<ObservationSession> {
    const response = await this.axiosInstance.post(`/observation-sessions/${id}/submit`);
    return response.data;
  }

  // Approve observation (for supervisors)
  async approveObservation(id: string, comments?: string): Promise<ObservationSession> {
    const response = await this.axiosInstance.patch(`/observation-sessions/${id}/approve`, { comments });
    return response.data;
  }

  // Reject observation (for supervisors)
  async rejectObservation(id: string, reason: string): Promise<ObservationSession> {
    const response = await this.axiosInstance.patch(`/observation-sessions/${id}/reject`, { reason });
    return response.data;
  }

  // Get observation forms
  async getObservationForms(params?: {
    gradeLevel?: string;
    subject?: string;
    isActive?: boolean;
  }): Promise<ObservationForm[]> {
    const response = await this.axiosInstance.get('/observation-forms', { params });
    // Ensure we return an array
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && Array.isArray(response.data.data)) {
      // Handle paginated response
      return response.data.data;
    } else if (response.data && Array.isArray(response.data.forms)) {
      // Handle response with forms property
      return response.data.forms;
    }
    // Return empty array if data structure is unexpected
    console.warn('Unexpected response structure for observation forms:', response.data);
    return [];
  }

  // Get a single observation form by ID
  async getObservationFormById(id: string): Promise<ObservationForm> {
    const response = await this.axiosInstance.get(`/observation-forms/${id}`);
    return response.data;
  }

  // Export observation to PDF
  async exportToPDF(id: string): Promise<Blob> {
    const response = await this.axiosInstance.get(`/observation-sessions/${id}/export/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Export observations to Excel
  async exportToExcel(params?: {
    startDate?: string;
    endDate?: string;
    schoolId?: string;
    teacherId?: string;
  }): Promise<Blob> {
    const response = await this.axiosInstance.get('/observation-sessions/export/excel', {
      params,
      responseType: 'blob',
    });
    return response.data;
  }

  // Get observation statistics
  async getObservationStats(params?: {
    startDate?: string;
    endDate?: string;
    schoolId?: string;
    teacherId?: string;
  }) {
    const response = await this.axiosInstance.get('/observation-sessions/statistics', { params });
    return response.data;
  }

  // Save draft observation
  async saveDraft(data: Partial<ObservationFormData>): Promise<ObservationSession> {
    const response = await this.axiosInstance.post('/observation-sessions/draft', data);
    return response.data;
  }

  // Clone an existing observation
  async cloneObservation(id: string): Promise<ObservationSession> {
    const response = await this.axiosInstance.post(`/observation-sessions/${id}/clone`);
    return response.data;
  }

  // Add signature to observation
  async addSignature(id: string, signature: {
    role: 'teacher' | 'observer' | 'supervisor';
    signatureData: string;
  }): Promise<ObservationSession> {
    const response = await this.axiosInstance.post(`/observation-sessions/${id}/signatures`, signature);
    return response.data;
  }

  // Batch operations
  async batchDelete(ids: string[]): Promise<void> {
    await this.axiosInstance.post('/observation-sessions/batch/delete', { ids });
  }

  async batchUpdateStatus(ids: string[], status: string): Promise<void> {
    await this.axiosInstance.post('/observation-sessions/batch/status', { ids, status });
  }
}

export const observationService = new ObservationService();