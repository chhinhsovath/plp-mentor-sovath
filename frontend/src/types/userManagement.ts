// User Management and Authentication Types

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  permissions: Permission[];
  status: UserStatus;
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  profile: UserProfile;
  preferences: UserPreferences;
  sessions: UserSession[];
}

export interface UserRole {
  id: string;
  name: string;
  displayName: string;
  displayNameKh?: string;
  description: string;
  descriptionKh?: string;
  level: number; // Higher numbers = more authority
  permissions: Permission[];
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  resource: string;
  action: PermissionAction;
  scope: PermissionScope;
  conditions?: PermissionCondition[];
  description: string;
  descriptionKh?: string;
}

export type PermissionAction = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'approve'
  | 'assign'
  | 'export'
  | 'import'
  | 'manage'
  | '*'; // All actions

export type PermissionScope = 
  | 'own'        // Own records only
  | 'school'     // Records in same school
  | 'district'   // Records in same district
  | 'province'   // Records in same province
  | 'national'   // All records
  | 'assigned';  // Assigned records only

export interface PermissionCondition {
  field: string;
  operator: 'equals' | 'in' | 'not_in' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export type UserStatus = 
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'pending_verification'
  | 'locked'
  | 'archived';

export interface UserProfile {
  schoolId?: string;
  schoolName?: string;
  districtId?: string;
  districtName?: string;
  provinceId?: string;
  provinceName?: string;
  department?: string;
  position?: string;
  employeeId?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: Address;
  emergencyContact?: EmergencyContact;
  qualifications: Qualification[];
  specializations: string[];
  languages: string[];
  mentorshipAreas?: string[];
  biography?: string;
  biographyKh?: string;
}

export interface Address {
  street?: string;
  village?: string;
  commune?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  country?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface Qualification {
  type: 'degree' | 'certificate' | 'training' | 'other';
  title: string;
  institution: string;
  year: number;
  verified: boolean;
  documents?: string[];
}

export interface UserPreferences {
  language: 'en' | 'km';
  timezone: string;
  dateFormat: string;
  notifications: NotificationPreferences;
  theme: 'light' | 'dark' | 'auto';
  accessibility: AccessibilityPreferences;
  privacy: PrivacyPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  categories: {
    observations: boolean;
    plans: boolean;
    feedback: boolean;
    reports: boolean;
    system: boolean;
    reminders: boolean;
  };
  frequency: 'immediate' | 'daily' | 'weekly';
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export interface AccessibilityPreferences {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  highContrast: boolean;
  reduceMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
}

export interface PrivacyPreferences {
  profileVisibility: 'public' | 'colleagues' | 'private';
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
  allowDirectMessages: boolean;
  dataSharing: boolean;
  analytics: boolean;
}

export interface UserSession {
  id: string;
  userId: string;
  deviceInfo: DeviceInfo;
  ipAddress: string;
  location?: GeoLocation;
  startTime: string;
  lastActivity: string;
  isActive: boolean;
  logoutTime?: string;
  logoutReason?: 'manual' | 'timeout' | 'security' | 'admin';
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  userAgent: string;
}

export interface GeoLocation {
  country: string;
  region: string;
  city: string;
  latitude?: number;
  longitude?: number;
}

export interface AuthenticationResult {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  expiresAt?: string;
  error?: AuthError;
  requiresTwoFactor?: boolean;
  requiresPasswordChange?: boolean;
}

export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  forbidCommonPasswords: boolean;
  forbidPersonalInfo: boolean;
  maxAge: number; // days
  historyCount: number;
  lockoutThreshold: number;
  lockoutDuration: number; // minutes
}

export interface TwoFactorAuth {
  enabled: boolean;
  method: 'sms' | 'email' | 'authenticator';
  backupCodes: string[];
  verifiedAt?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  sessionId?: string;
}

export type AuditAction = 
  | 'login'
  | 'logout'
  | 'create'
  | 'update'
  | 'delete'
  | 'view'
  | 'export'
  | 'import'
  | 'approve'
  | 'reject'
  | 'assign'
  | 'unassign'
  | 'permission_change'
  | 'password_change'
  | 'email_change'
  | 'role_change'
  | 'status_change'
  | 'data_export'
  | 'data_import'
  | 'backup_create'
  | 'backup_restore'
  | 'security_event';

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  usersByRole: Record<string, number>;
  usersByStatus: Record<UserStatus, number>;
  averageSessionDuration: number;
  loginFrequency: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  securityEvents: number;
}

export interface UserActivity {
  userId: string;
  activity: ActivityType;
  timestamp: string;
  details: any;
  location?: string;
  duration?: number;
}

export type ActivityType = 
  | 'login'
  | 'logout'
  | 'observation_create'
  | 'observation_update'
  | 'plan_create'
  | 'plan_update'
  | 'feedback_create'
  | 'report_generate'
  | 'data_export'
  | 'profile_update'
  | 'password_change'
  | 'settings_update';

export interface Invitation {
  id: string;
  email: string;
  role: string;
  invitedBy: string;
  invitedByName: string;
  invitedAt: string;
  expiresAt: string;
  acceptedAt?: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  message?: string;
  token: string;
}

export interface TeamMember {
  userId: string;
  user: User;
  teamId: string;
  role: 'leader' | 'member' | 'observer';
  joinedAt: string;
  addedBy: string;
  isActive: boolean;
}

export interface Department {
  id: string;
  name: string;
  nameKh?: string;
  description?: string;
  descriptionKh?: string;
  headUserId?: string;
  parentDepartmentId?: string;
  children: Department[];
  members: User[];
  permissions: Permission[];
  isActive: boolean;
}

export interface SecuritySettings {
  passwordPolicy: PasswordPolicy;
  sessionTimeout: number;
  maxConcurrentSessions: number;
  twoFactorRequired: boolean;
  ipWhitelist: string[];
  allowedDomains: string[];
  auditRetentionDays: number;
  dataRetentionDays: number;
}

export interface UserImport {
  id: string;
  fileName: string;
  uploadedBy: string;
  uploadedAt: string;
  totalRecords: number;
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errors: ImportError[];
  results: ImportResult[];
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  value?: any;
}

export interface ImportResult {
  row: number;
  action: 'created' | 'updated' | 'skipped';
  userId?: string;
  email: string;
  errors: string[];
}

export interface UserExport {
  id: string;
  requestedBy: string;
  requestedAt: string;
  format: 'csv' | 'excel' | 'json';
  filters: any;
  totalRecords: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: string;
}