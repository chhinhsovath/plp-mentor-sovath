export type FieldType = 
  | 'text'
  | 'number'
  | 'email'
  | 'tel'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'time'
  | 'datetime'
  | 'file'
  | 'rating'
  | 'scale'
  | 'section'
  | 'divider';

export interface FieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  customValidator?: (value: any) => string | null;
}

export interface FieldOption {
  label: string;
  value: string;
}

export interface FormField {
  id: string;
  type: FieldType;
  name: string;
  label: string;
  description?: string;
  placeholder?: string;
  defaultValue?: any;
  options?: FieldOption[];
  validation?: FieldValidation;
  conditional?: {
    field: string;
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
    value: any;
  };
  grid?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
  order: number;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  order: number;
}

export interface FormTemplate {
  id: string;
  name: string;
  nameKm?: string;
  description?: string;
  descriptionKm?: string;
  category: 'observation' | 'evaluation' | 'survey' | 'checklist' | 'custom';
  sections: FormSection[];
  settings: {
    allowSaveDraft?: boolean;
    requireApproval?: boolean;
    allowAnonymous?: boolean;
    enableVersioning?: boolean;
    maxSubmissions?: number;
    validFrom?: Date;
    validUntil?: Date;
  };
  metadata: {
    version: number;
    createdBy: string;
    createdAt: Date | string;
    updatedBy?: string;
    updatedAt?: Date | string;
    publishedAt?: Date | string;
    archivedAt?: Date | string;
  };
  status: 'draft' | 'published' | 'archived';
  targetRoles?: string[];
  targetGrades?: string[];
  targetSubjects?: string[];
  validation?: Record<string, any>;
}

export interface FormSubmission {
  id: string;
  formId: string;
  formVersion: number;
  userId: string;
  data: Record<string, any>;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  metadata?: Record<string, any>;
}

export interface FormBuilder {
  form: FormTemplate;
  selectedSection?: string;
  selectedField?: string;
  isDirty: boolean;
}

export interface FormStatistics {
  totalSubmissions: number;
  completedSubmissions: number;
  draftSubmissions: number;
  averageCompletionTime: number;
  completionRate: number;
  fieldCompletionRates: Record<string, number>;
}