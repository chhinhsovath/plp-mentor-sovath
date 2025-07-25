export interface BackupItem {
  id: string
  name: string
  description: string
  type: BackupType
  size: number
  createdAt: Date
  createdBy: string
  status: BackupStatus
  filePath?: string
  metadata?: BackupMetadata
}

export interface BackupMetadata {
  version: string
  tables: string[]
  recordCount: number
  compression: boolean
  encrypted: boolean
}

export interface CreateBackupRequest {
  name: string
  description: string
  type: BackupType
  includeData: boolean
  includeSchema: boolean
  compression: boolean
  encryption: boolean
  tables?: string[]
  schedule?: BackupSchedule
}

export interface BackupSchedule {
  enabled: boolean
  frequency: 'daily' | 'weekly' | 'monthly'
  time: string
  daysOfWeek?: number[]
  dayOfMonth?: number
}

export interface RestoreBackupRequest {
  backupId: string
  restoreOptions: RestoreOptions
}

export interface RestoreOptions {
  overwriteExisting: boolean
  restoreData: boolean
  restoreSchema: boolean
  targetDatabase?: string
}

export enum BackupType {
  FULL = 'full',
  INCREMENTAL = 'incremental',
  DIFFERENTIAL = 'differential',
  CUSTOM = 'custom'
}

export enum BackupStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RESTORED = 'restored',
  EXPIRED = 'expired'
}

export interface BackupFilters {
  type?: BackupType
  status?: BackupStatus
  dateRange?: [Date, Date]
  createdBy?: string
  searchText?: string
}

export interface BackupStats {
  totalBackups: number
  totalSize: number
  successfulBackups: number
  failedBackups: number
  lastBackupDate: Date
  nextScheduledBackup?: Date
}