export type QuestionType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'time'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'location'
  | 'audio'
  | 'video';

export interface QuestionOption {
  label: string;
  value: string;
  order?: number;
}

export interface QuestionValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
}

export interface QuestionLogic {
  conditions: Array<{
    questionId: string;
    operator: '=' | '!=' | '>' | '<' | 'contains' | 'in';
    value: any;
  }>;
  action: 'show' | 'hide' | 'skip';
}

export interface Question {
  id?: string;
  type: QuestionType;
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  order: number;
  options?: QuestionOption[];
  validation?: QuestionValidation;
  logic?: QuestionLogic;
  parentQuestionId?: string;
  groupId?: string;
  allowOther?: boolean;
  metadata?: Record<string, any>;
}

export interface Survey {
  id: string;
  title: string;
  slug: string;
  description?: string;
  settings?: {
    allowAnonymous?: boolean;
    requireAuth?: boolean;
    allowMultipleSubmissions?: boolean;
    showProgressBar?: boolean;
    shuffleQuestions?: boolean;
    timeLimit?: number;
    startDate?: Date | string;
    endDate?: Date | string;
  };
  status: 'draft' | 'published' | 'closed';
  metadata?: Record<string, any>;
  questions: Question[];
  createdBy?: {
    id: string;
    name: string;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Answer {
  questionId: string;
  answer: any;
  files?: Array<{
    originalName: string;
    filename: string;
    mimetype: string;
    size: number;
    path: string;
  }>;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  userId?: string;
  uuid: string;
  status: 'draft' | 'submitted';
  submittedAt?: Date | string;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    location?: {
      latitude: number;
      longitude: number;
      accuracy?: number;
    };
    duration?: number;
    device?: string;
  };
  answers: Answer[];
}

export interface SurveyStatistics {
  survey: {
    id: string;
    title: string;
    totalQuestions: number;
  };
  totalResponses: number;
  questionStats: Array<{
    id: string;
    label: string;
    type: string;
    response_count: number;
    value_distribution?: Array<{
      value: any;
      count: number;
    }>;
  }>;
}