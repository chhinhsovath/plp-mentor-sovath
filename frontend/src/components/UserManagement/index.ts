// User Management Components Export
export { default as UserManagementDashboard } from './UserManagementDashboard';
export { default as RolePermissionManager } from './RolePermissionManager';
export { default as UserProfileManager } from './UserProfileManager';
export { default as AuditLogViewer } from './AuditLogViewer';
export { default as UserOnboardingWorkflow } from './UserOnboardingWorkflow';

// Re-export types for convenience
export type {
  User,
  UserRole,
  Permission,
  PermissionAction,
  PermissionScope,
  PermissionCondition,
  UserStatus,
  UserProfile,
  UserPreferences,
  NotificationPreferences,
  AccessibilityPreferences,
  PrivacyPreferences,
  UserSession,
  DeviceInfo,
  GeoLocation,
  AuthenticationResult,
  AuthError,
  PasswordPolicy,
  TwoFactorAuth,
  AuditLog,
  AuditAction,
  UserStats,
  UserActivity,
  ActivityType,
  Invitation,
  TeamMember,
  Department,
  SecuritySettings,
  UserImport,
  ImportError,
  ImportResult,
  UserExport,
  Address,
  EmergencyContact,
  Qualification,
} from '../../types/userManagement';