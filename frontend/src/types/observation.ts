export interface ObservationForm {
  id: string;
  name: string;
  code: string;
  description: string;
  gradeLevel: string;
  subject: string;
  lessonPhases: LessonPhase[];
  isActive: boolean;
}

export interface LessonPhase {
  id: string;
  name: string;
  orderIndex: number;
  indicators: Indicator[];
}

export interface Indicator {
  id: string;
  code: string;
  description: string;
  descriptionKh: string;
  orderIndex: number;
  phaseId: string;
  rubrics: Rubric[];
}

export interface Rubric {
  id: string;
  level: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement';
  levelValue: number;
  description: string;
  descriptionKh: string;
  indicatorId: string;
}

export interface ObservationSession {
  id: string;
  formId: string;
  teacherId?: string;
  teacherName: string;
  observerId?: string;
  observerName: string;
  schoolId?: string;
  schoolName: string;
  gradeLevel?: string;
  grade?: string;
  subject: string;
  numberOfStudents?: number;
  numberOfFemaleStudents?: number;
  observationDate: string;
  dateObserved?: string;
  startTime: string;
  endTime: string;
  status: 'draft' | 'in_progress' | 'completed' | 'approved' | 'rejected';
  responses?: IndicatorResponse[];
  reflections?: Reflection[];
  signatures?: Signature[];
  reflectionSummary?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  duration?: number;
}

export interface IndicatorResponse {
  id?: string;
  sessionId?: string;
  indicatorId: string;
  rubricId?: string;
  score?: number;
  comments?: string;
  evidence?: string;
}

export interface Reflection {
  id?: string;
  sessionId?: string;
  type: 'strengths' | 'areas_for_improvement' | 'next_steps';
  content: string;
  contentKh?: string;
}

export interface Signature {
  id?: string;
  sessionId?: string;
  role: 'teacher' | 'observer' | 'supervisor';
  signerName: string;
  signedDate: string;
  signatureData?: string;
  ipAddress?: string;
}

export interface ObservationFormData {
  formId: string;
  teacherId: string;
  schoolId: string;
  gradeLevel: string;
  subject: string;
  numberOfStudents: number;
  numberOfFemaleStudents: number;
  observationDate: string;
  startTime: string;
  endTime: string;
  responses: IndicatorResponse[];
  reflections: Reflection[];
}

export interface FormValidationError {
  field: string;
  message: string;
  indicatorId?: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: FormValidationError[];
}