import axios from 'axios';
import { FormTemplate, FormSubmission, FormStatistics } from '../types/form';
import { authService } from './auth.service';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

class FormService {
  private getAuthHeader() {
    const token = authService.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Form Template Management
  async getForms(params?: {
    category?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ forms: FormTemplate[]; total: number }> {
    try {
      // Use observation-forms endpoint directly since forms endpoint doesn't exist
      const response = await axios.get(`${API_BASE_URL}/observation-forms`, {
        params: {
          ...params,
          subject: params?.category,
        },
        headers: this.getAuthHeader(),
      });
      const data = response.data.data || response.data;
      
      // Transform observation forms to generic form template structure
      const forms = Array.isArray(data) ? data : (data.forms || []);
      const transformedForms = forms.map((form: any) => ({
        id: form.id,
        name: form.title,
        nameKm: form.title,
        description: form.subject,
        descriptionKm: form.subject,
        category: 'observation',
        status: 'published',
        sections: form.lessonPhases || [],
        metadata: {
          createdAt: form.createdAt || new Date().toISOString(),
          updatedAt: form.updatedAt || new Date().toISOString(),
          createdBy: form.createdBy || 'system',
          version: '1.0',
        },
        settings: {
          allowSaveDraft: true,
          requireApproval: false,
          enableVersioning: false,
        },
        validation: {},
      }));
      
      return {
        forms: transformedForms,
        total: transformedForms.length
      };
    } catch (error) {
      console.error('Failed to fetch forms:', error);
      return {
        forms: [],
        total: 0
      };
    }
  }

  async getForm(id: string): Promise<FormTemplate> {
    try {
      // Use observation-forms endpoint directly
      const response = await axios.get(`${API_BASE_URL}/observation-forms/${id}`, {
        headers: this.getAuthHeader(),
      });
      const form = response.data.data || response.data;
      
      // Transform observation form to generic form template structure
      return {
        id: form.id,
        name: form.title,
        nameKm: form.title,
        description: form.subject,
        descriptionKm: form.subject,
        category: 'observation',
        status: 'published',
        sections: form.lessonPhases || [],
        metadata: {
          createdAt: form.createdAt || new Date().toISOString(),
          updatedAt: form.updatedAt || new Date().toISOString(),
          createdBy: form.createdBy || 'system',
          version: '1.0',
        },
        settings: {
          allowSaveDraft: true,
          requireApproval: false,
          enableVersioning: false,
        },
        validation: {},
      };
    } catch (error) {
      console.error('Failed to fetch form:', error);
      throw error;
    }
  }

  async createForm(form: Partial<FormTemplate>): Promise<FormTemplate> {
    const response = await axios.post(`${API_BASE_URL}/forms`, form, {
      headers: this.getAuthHeader(),
    });
    return response.data.data || response.data;
  }

  async updateForm(id: string, form: Partial<FormTemplate>): Promise<FormTemplate> {
    const response = await axios.put(`${API_BASE_URL}/forms/${id}`, form, {
      headers: this.getAuthHeader(),
    });
    return response.data.data || response.data;
  }

  async deleteForm(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/forms/${id}`, {
      headers: this.getAuthHeader(),
    });
  }

  async publishForm(id: string): Promise<FormTemplate> {
    const response = await axios.post(`${API_BASE_URL}/forms/${id}/publish`, {}, {
      headers: this.getAuthHeader(),
    });
    return response.data.data || response.data;
  }

  async archiveForm(id: string): Promise<FormTemplate> {
    const response = await axios.post(`${API_BASE_URL}/forms/${id}/archive`, {}, {
      headers: this.getAuthHeader(),
    });
    return response.data.data || response.data;
  }

  async duplicateForm(id: string, name: string): Promise<FormTemplate> {
    const response = await axios.post(`${API_BASE_URL}/forms/${id}/duplicate`, { name }, {
      headers: this.getAuthHeader(),
    });
    return response.data.data || response.data;
  }

  // Form Submissions
  async getSubmissions(formId: string, params?: {
    status?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ submissions: FormSubmission[]; total: number }> {
    const response = await axios.get(`${API_BASE_URL}/forms/${formId}/submissions`, {
      params,
      headers: this.getAuthHeader(),
    });
    return response.data.data || response.data;
  }

  async getSubmission(formId: string, submissionId: string): Promise<FormSubmission> {
    const response = await axios.get(
      `${API_BASE_URL}/forms/${formId}/submissions/${submissionId}`,
      { headers: this.getAuthHeader() }
    );
    return response.data.data || response.data;
  }

  async submitForm(formId: string, data: Record<string, any>, isDraft = false): Promise<FormSubmission> {
    const response = await axios.post(
      `${API_BASE_URL}/forms/${formId}/submissions`,
      { data, status: isDraft ? 'draft' : 'submitted' },
      { headers: this.getAuthHeader() }
    );
    return response.data.data || response.data;
  }

  async updateSubmission(
    formId: string, 
    submissionId: string, 
    data: Record<string, any>,
    isDraft = false
  ): Promise<FormSubmission> {
    const response = await axios.put(
      `${API_BASE_URL}/forms/${formId}/submissions/${submissionId}`,
      { data, status: isDraft ? 'draft' : 'submitted' },
      { headers: this.getAuthHeader() }
    );
    return response.data.data || response.data;
  }

  async approveSubmission(formId: string, submissionId: string): Promise<FormSubmission> {
    const response = await axios.post(
      `${API_BASE_URL}/forms/${formId}/submissions/${submissionId}/approve`,
      {},
      { headers: this.getAuthHeader() }
    );
    return response.data.data || response.data;
  }

  async rejectSubmission(
    formId: string, 
    submissionId: string, 
    reason: string
  ): Promise<FormSubmission> {
    const response = await axios.post(
      `${API_BASE_URL}/forms/${formId}/submissions/${submissionId}/reject`,
      { reason },
      { headers: this.getAuthHeader() }
    );
    return response.data.data || response.data;
  }

  // Form Statistics
  async getFormStatistics(formId: string): Promise<FormStatistics> {
    const response = await axios.get(
      `${API_BASE_URL}/forms/${formId}/statistics`,
      { headers: this.getAuthHeader() }
    );
    return response.data.data || response.data;
  }

  // Export Form Data
  async exportSubmissions(formId: string, format: 'csv' | 'excel' | 'pdf'): Promise<Blob> {
    const response = await axios.get(
      `${API_BASE_URL}/forms/${formId}/export`,
      {
        params: { format },
        headers: this.getAuthHeader(),
        responseType: 'blob',
      }
    );
    return response.data;
  }

  // Form Templates Library
  async getFormTemplates(category?: string): Promise<FormTemplate[]> {
    const response = await axios.get(`${API_BASE_URL}/forms/templates`, {
      params: { category },
      headers: this.getAuthHeader(),
    });
    return response.data.data || response.data;
  }

  async importFormTemplate(templateId: string): Promise<FormTemplate> {
    const response = await axios.post(
      `${API_BASE_URL}/forms/templates/${templateId}/import`,
      {},
      { headers: this.getAuthHeader() }
    );
    return response.data.data || response.data;
  }
}

export const formService = new FormService();