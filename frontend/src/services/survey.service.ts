import api from './api';
import { Survey, SurveyResponse, Answer, SurveyStatistics } from '../types/survey';

export interface CreateSurveyDto {
  title: string;
  description?: string;
  settings?: Survey['settings'];
  questions: Array<Omit<Survey['questions'][0], 'id'>>;
  metadata?: Record<string, any>;
}

export interface UpdateSurveyDto extends Partial<CreateSurveyDto> {
  status?: 'draft' | 'published' | 'closed';
}

export interface SubmitResponseDto {
  answers: Answer[];
  metadata?: SurveyResponse['metadata'];
}

export interface SaveDraftResponseDto extends SubmitResponseDto {
  responseId?: string;
}

export interface SurveyFilterParams {
  status?: 'draft' | 'published' | 'closed';
  search?: string;
  createdBy?: string;
  createdFrom?: string;
  createdTo?: string;
  activeOnly?: boolean;
}

const surveyService = {
  // Survey CRUD operations
  async createSurvey(data: CreateSurveyDto): Promise<Survey> {
    const response = await api.post('/surveys', data);
    return response.data;
  },

  async getSurveys(params?: SurveyFilterParams): Promise<Survey[]> {
    const response = await api.get('/surveys', { params });
    return response.data;
  },

  async getSurveyById(id: string): Promise<Survey> {
    const response = await api.get(`/surveys/${id}`);
    return response.data;
  },

  async getSurveyBySlug(slug: string): Promise<Survey> {
    const response = await api.get(`/surveys/public/${slug}`);
    return response.data;
  },

  async updateSurvey(id: string, data: UpdateSurveyDto): Promise<Survey> {
    const response = await api.patch(`/surveys/${id}`, data);
    return response.data;
  },

  async deleteSurvey(id: string): Promise<void> {
    await api.delete(`/surveys/${id}`);
  },

  async getSurveyStatistics(id: string): Promise<SurveyStatistics> {
    const response = await api.get(`/surveys/${id}/statistics`);
    return response.data;
  },

  // Response operations
  async submitResponse(surveyId: string, data: SubmitResponseDto, files?: File[]): Promise<SurveyResponse> {
    const formData = new FormData();
    
    // Add answers as JSON
    formData.append('answers', JSON.stringify(data.answers));
    
    // Add metadata if provided
    if (data.metadata) {
      formData.append('metadata', JSON.stringify(data.metadata));
    }
    
    // Add files if provided
    if (files && files.length > 0) {
      files.forEach((file, index) => {
        const questionId = file.name.split('_')[0]; // Expecting file name format: questionId_filename
        formData.append(`file_${questionId}_${index}`, file);
      });
    }
    
    const response = await api.post(`/surveys/${surveyId}/responses`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async saveDraftResponse(surveyId: string, data: SaveDraftResponseDto, files?: File[]): Promise<SurveyResponse> {
    const formData = new FormData();
    
    // Add response ID if updating existing draft
    if (data.responseId) {
      formData.append('responseId', data.responseId);
    }
    
    // Add answers as JSON
    formData.append('answers', JSON.stringify(data.answers));
    
    // Add metadata if provided
    if (data.metadata) {
      formData.append('metadata', JSON.stringify(data.metadata));
    }
    
    // Add files if provided
    if (files && files.length > 0) {
      files.forEach((file, index) => {
        const questionId = file.name.split('_')[0];
        formData.append(`file_${questionId}_${index}`, file);
      });
    }
    
    const response = await api.post(`/surveys/${surveyId}/responses/draft`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getResponseByUuid(uuid: string): Promise<SurveyResponse> {
    const response = await api.get(`/surveys/responses/${uuid}`);
    return response.data;
  },

  async exportResponses(surveyId: string, format: 'csv' | 'json' = 'csv'): Promise<any> {
    const response = await api.get(`/surveys/${surveyId}/export`, {
      params: { format },
      responseType: format === 'csv' ? 'blob' : 'json',
    });
    
    if (format === 'csv') {
      // Create download link for CSV
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `survey-responses-${surveyId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }
    
    return response.data;
  },

  // Utility functions
  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  validateQuestion(question: Omit<Survey['questions'][0], 'id'>): string[] {
    const errors: string[] = [];
    
    if (!question.label.trim()) {
      errors.push('Question label is required');
    }
    
    if (!question.type) {
      errors.push('Question type is required');
    }
    
    if (['select', 'radio', 'checkbox'].includes(question.type) && (!question.options || question.options.length === 0)) {
      errors.push('Options are required for select/radio/checkbox questions');
    }
    
    if (question.validation) {
      if (question.validation.min !== undefined && question.validation.max !== undefined && question.validation.min > question.validation.max) {
        errors.push('Min value cannot be greater than max value');
      }
      
      if (question.validation.minLength !== undefined && question.validation.maxLength !== undefined && question.validation.minLength > question.validation.maxLength) {
        errors.push('Min length cannot be greater than max length');
      }
    }
    
    return errors;
  },
};

export default surveyService;