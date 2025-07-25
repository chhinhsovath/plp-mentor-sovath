export interface ImprovementPlan {
  id: string;
  sessionId: string;
  teacherId: string;
  teacherName: string;
  observerId: string;
  observerName: string;
  schoolId: string;
  schoolName: string;
  title: string;
  titleKh?: string;
  description: string;
  descriptionKh?: string;
  status: 'draft' | 'active' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  targetDate: string;
  createdDate: string;
  updatedDate: string;
  completedDate?: string;
  goals: ImprovementGoal[];
  activities: FollowUpActivity[];
  resources: Resource[];
  progress: ProgressUpdate[];
  approvals: PlanApproval[];
}

export interface ImprovementGoal {
  id: string;
  planId: string;
  title: string;
  titleKh?: string;
  description: string;
  descriptionKh?: string;
  targetIndicators: string[]; // References to observation indicators
  measurementCriteria: string;
  targetValue: number;
  currentValue?: number;
  status: 'pending' | 'in_progress' | 'achieved' | 'not_achieved';
  dueDate: string;
}

export interface FollowUpActivity {
  id: string;
  planId: string;
  goalId?: string;
  title: string;
  titleKh?: string;
  description: string;
  descriptionKh?: string;
  type: 'coaching' | 'training' | 'peer_observation' | 'self_study' | 'workshop' | 'other';
  scheduledDate: string;
  duration: number; // in minutes
  location?: string;
  facilitator?: string;
  participants: string[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
  completionNotes?: string;
  materials?: ActivityMaterial[];
  reminders: Reminder[];
}

export interface ActivityMaterial {
  id: string;
  activityId: string;
  name: string;
  type: 'document' | 'video' | 'link' | 'other';
  url?: string;
  description?: string;
}

export interface Resource {
  id: string;
  planId: string;
  title: string;
  titleKh?: string;
  type: 'document' | 'video' | 'link' | 'template' | 'guide';
  url: string;
  description?: string;
  descriptionKh?: string;
  tags: string[];
  uploadedBy: string;
  uploadedDate: string;
}

export interface ProgressUpdate {
  id: string;
  planId: string;
  goalId?: string;
  activityId?: string;
  date: string;
  status: 'on_track' | 'at_risk' | 'delayed' | 'completed';
  progressPercentage: number;
  notes: string;
  notesKh?: string;
  evidence?: string[];
  updatedBy: string;
  updatedByRole: string;
}

export interface Reminder {
  id: string;
  activityId: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  scheduledDate: string;
  message: string;
  messageKh?: string;
  recipients: string[];
  status: 'pending' | 'sent' | 'failed';
  sentDate?: string;
}

export interface PlanApproval {
  id: string;
  planId: string;
  approverId: string;
  approverName: string;
  approverRole: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  approvalDate?: string;
  signatureData?: string;
}

export interface PlanTemplate {
  id: string;
  name: string;
  nameKh?: string;
  description: string;
  descriptionKh?: string;
  category: string;
  goals: Partial<ImprovementGoal>[];
  activities: Partial<FollowUpActivity>[];
  isActive: boolean;
  createdBy: string;
  createdDate: string;
}

export interface PlanComparison {
  planId1: string;
  planId2: string;
  planName1: string;
  planName2: string;
  differences: {
    field: string;
    value1: any;
    value2: any;
    type: 'added' | 'removed' | 'modified';
  }[];
  progressComparison: {
    plan1Progress: number;
    plan2Progress: number;
    plan1Status: string;
    plan2Status: string;
  };
}

export interface NotificationSettings {
  userId: string;
  planReminders: boolean;
  activityReminders: boolean;
  progressUpdateReminders: boolean;
  reminderDaysBefore: number;
  preferredTime: string;
  channels: ('email' | 'sms' | 'push' | 'in_app')[];
}