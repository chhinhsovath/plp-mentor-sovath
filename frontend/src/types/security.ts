export interface SecuritySettings {
  authentication: AuthenticationSettings
  sessionManagement: SessionSettings
  passwordPolicy: PasswordPolicy
  accessControl: AccessControlSettings
  monitoring: MonitoringSettings
  dataProtection: DataProtectionSettings
}

export interface AuthenticationSettings {
  twoFactorEnabled: boolean
  biometricEnabled: boolean
  ssoEnabled: boolean
  sessionTimeout: number // in minutes
  maxLoginAttempts: number
  lockoutDuration: number // in minutes
  requirePasswordChange: boolean
  passwordChangeInterval: number // in days
}

export interface SessionSettings {
  maxConcurrentSessions: number
  sessionTimeout: number
  rememberMeEnabled: boolean
  rememberMeDuration: number // in days
  sessionEncryption: boolean
  secureOnly: boolean
}

export interface PasswordPolicy {
  minLength: number
  maxLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  preventPasswordReuse: boolean
  passwordHistoryCount: number
  complexity: 'low' | 'medium' | 'high' | 'custom'
}

export interface AccessControlSettings {
  roleBasedAccess: boolean
  ipWhitelisting: boolean
  whitelistedIPs: string[]
  blockSuspiciousActivity: boolean
  logFailedAttempts: boolean
  emailSecurityAlerts: boolean
  adminApprovalRequired: boolean
}

export interface MonitoringSettings {
  auditLogging: boolean
  realTimeMonitoring: boolean
  suspiciousActivityDetection: boolean
  loginLocationTracking: boolean
  deviceFingerprinting: boolean
  securityEventNotifications: boolean
  retentionPeriod: number // in days
}

export interface DataProtectionSettings {
  encryption: EncryptionSettings
  backupSecurity: BackupSecuritySettings
  dataAnonymization: boolean
  gdprCompliance: boolean
  dataRetentionPeriod: number // in days
}

export interface EncryptionSettings {
  dataAtRest: boolean
  dataInTransit: boolean
  databaseEncryption: boolean
  fileEncryption: boolean
  encryptionAlgorithm: 'AES256' | 'AES128' | 'RSA2048'
}

export interface BackupSecuritySettings {
  encryptBackups: boolean
  signBackups: boolean
  offSiteStorage: boolean
  accessControlBackups: boolean
}

export interface SecurityEvent {
  id: string
  type: SecurityEventType
  severity: SecuritySeverity
  timestamp: Date
  userId?: string
  userEmail?: string
  ipAddress?: string
  userAgent?: string
  description: string
  details: Record<string, any>
  status: 'active' | 'resolved' | 'ignored'
  resolvedBy?: string
  resolvedAt?: Date
}

export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  PASSWORD_CHANGED = 'password_changed',
  ACCOUNT_LOCKED = 'account_locked',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt',
  SYSTEM_VULNERABILITY = 'system_vulnerability',
  PERMISSION_ESCALATION = 'permission_escalation',
  SESSION_HIJACK_ATTEMPT = 'session_hijack_attempt'
}

export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface UserSession {
  id: string
  userId: string
  userEmail: string
  ipAddress: string
  userAgent: string
  location?: string
  device?: string
  startTime: Date
  lastActivity: Date
  status: 'active' | 'expired' | 'terminated'
  duration: number // in minutes
}

export interface SecurityScan {
  id: string
  type: 'vulnerability' | 'penetration' | 'compliance'
  status: 'running' | 'completed' | 'failed'
  startTime: Date
  endTime?: Date
  results?: SecurityScanResults
  recommendations?: string[]
}

export interface SecurityScanResults {
  totalChecks: number
  passed: number
  failed: number
  warnings: number
  criticalIssues: number
  vulnerabilities: Vulnerability[]
}

export interface Vulnerability {
  id: string
  severity: SecuritySeverity
  type: string
  description: string
  location: string
  recommendation: string
  status: 'open' | 'fixing' | 'fixed' | 'ignored'
}

export interface SecurityStats {
  totalEvents: number
  criticalEvents: number
  activeThreats: number
  resolvedThreats: number
  activeSessions: number
  blockedAttempts: number
  lastSecurityScan?: Date
  complianceScore: number
}

export interface SecurityAlert {
  id: string
  type: SecurityEventType
  severity: SecuritySeverity
  title: string
  message: string
  timestamp: Date
  acknowledged: boolean
  userId?: string
  actions?: SecurityAction[]
}

export interface SecurityAction {
  id: string
  name: string
  description: string
  handler: () => void
}