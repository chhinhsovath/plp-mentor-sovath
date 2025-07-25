export enum MissionType {
  FIELD_TRIP = 'field_trip',
  TRAINING = 'training',
  MEETING = 'meeting',
  MONITORING = 'monitoring',
  OTHER = 'other',
}

export enum MissionStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role?: {
    id: string;
    name: string;
  };
}

export interface MissionParticipant {
  id: string;
  user: User;
  role: string;
  isLeader: boolean;
  hasConfirmed: boolean;
  confirmedAt?: string;
  hasCheckedIn: boolean;
  checkedInAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MissionTracking {
  id: string;
  user: User;
  latitude: number;
  longitude: number;
  accuracy?: number;
  recordedAt: string;
  activity: string;
  notes?: string;
  createdAt: string;
}

export interface Mission {
  id: string;
  title: string;
  description?: string;
  type: MissionType;
  status: MissionStatus;
  startDate: string;
  endDate: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  purpose?: string;
  objectives?: string;
  expectedOutcomes?: string;
  budget?: number;
  transportationDetails?: string;
  accommodationDetails?: string;
  participants?: string[];
  attachments?: string[];
  createdBy: User;
  approvedBy?: User;
  approvedAt?: string;
  approvalComments?: string;
  rejectionReason?: string;
  completionReport?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  createdAt: string;
  updatedAt: string;
  missionParticipants?: MissionParticipant[];
  trackingData?: MissionTracking[];
}

export interface CreateMissionInput {
  title: string;
  description?: string;
  type: MissionType;
  startDate: string;
  endDate: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  purpose?: string;
  objectives?: string;
  expectedOutcomes?: string;
  budget?: number;
  transportationDetails?: string;
  accommodationDetails?: string;
  participants?: string[];
  attachments?: string[];
}

export interface UpdateMissionInput extends Partial<CreateMissionInput> {
  completionReport?: string;
}

export interface MissionReport {
  id: string;
  missionId: string;
  mission?: Mission;
  submittedBy: User;
  submittedAt: string;
  reportType: MissionType;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  
  // Common fields for all mission types
  summary: string;
  achievements: string[];
  challenges: string[];
  recommendations: string[];
  
  // Field trip specific
  placesVisited?: string[];
  peopleMetCount?: number;
  keyFindings?: string[];
  
  // Training specific
  participantsCount?: number;
  topicsCovered?: string[];
  skillsAcquired?: string[];
  trainingMaterials?: string[];
  participantFeedback?: string;
  
  // Meeting specific
  attendeesCount?: number;
  agendaItems?: string[];
  decisions?: string[];
  actionItems?: Array<{
    task: string;
    responsible: string;
    deadline: string;
  }>;
  
  // Monitoring specific
  sitesMonitored?: string[];
  complianceStatus?: 'compliant' | 'partially_compliant' | 'non_compliant';
  issuesIdentified?: string[];
  correctiveActions?: string[];
  
  // Impact assessment
  impactMetrics?: {
    peopleImpacted: number;
    areasImproved: string[];
    quantifiableResults: Array<{
      metric: string;
      value: number;
      unit: string;
    }>;
  };
  
  // Attachments
  photos?: Array<{
    url: string;
    caption: string;
  }>;
  documents?: Array<{
    url: string;
    name: string;
    type: string;
  }>;
  
  createdAt: string;
  updatedAt: string;
}

export interface CreateMissionReportInput {
  missionId: string;
  summary: string;
  achievements: string[];
  challenges: string[];
  recommendations: string[];
  
  // Type-specific fields
  placesVisited?: string[];
  peopleMetCount?: number;
  keyFindings?: string[];
  participantsCount?: number;
  topicsCovered?: string[];
  skillsAcquired?: string[];
  trainingMaterials?: string[];
  participantFeedback?: string;
  attendeesCount?: number;
  agendaItems?: string[];
  decisions?: string[];
  actionItems?: Array<{
    task: string;
    responsible: string;
    deadline: string;
  }>;
  sitesMonitored?: string[];
  complianceStatus?: 'compliant' | 'partially_compliant' | 'non_compliant';
  issuesIdentified?: string[];
  correctiveActions?: string[];
  
  impactMetrics?: {
    peopleImpacted: number;
    areasImproved: string[];
    quantifiableResults: Array<{
      metric: string;
      value: number;
      unit: string;
    }>;
  };
}

export interface UpdateMissionStatusInput {
  status: MissionStatus;
  approvalComments?: string;
  rejectionReason?: string;
}

export interface AddParticipantInput {
  userId: string;
  role?: string;
  isLeader?: boolean;
}

export interface MissionTrackingInput {
  latitude: number;
  longitude: number;
  accuracy?: number;
  activity: string;
  notes?: string;
}

export interface MissionFilter {
  type?: MissionType;
  status?: MissionStatus;
  startDate?: string;
  endDate?: string;
  startDateFrom?: string;
  startDateTo?: string;
  createdBy?: string;
  participantId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface MissionsResponse {
  missions: Mission[];
  total: number;
}