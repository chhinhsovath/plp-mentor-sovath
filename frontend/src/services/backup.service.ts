import { BackupItem, CreateBackupRequest, RestoreBackupRequest, BackupFilters, BackupStats, BackupType, BackupStatus } from '../types/backup'

class BackupService {
  private baseUrl = '/api/backups'

  // Mock data for development
  private mockBackups: BackupItem[] = [
    {
      id: 'backup-1',
      name: 'ការបេកអាប់ប្រចាំថ្ងៃ',
      description: 'ការបេកអាប់ទិន្នន័យប្រចាំថ្ងៃដោយស្វ័យប្រវត្តិ',
      type: BackupType.FULL,
      size: 15728640, // 15MB
      createdAt: new Date('2025-01-20T02:00:00'),
      createdBy: 'admin@example.com',
      status: BackupStatus.COMPLETED,
      filePath: '/backups/daily-backup-20250120.sql',
      metadata: {
        version: '1.0',
        tables: ['users', 'observations', 'schools', 'teachers'],
        recordCount: 1250,
        compression: true,
        encrypted: true
      }
    },
    {
      id: 'backup-2',
      name: 'ការបេកអាប់ទិន្នន័យអ្នកប្រើ',
      description: 'ការបេកអាប់ទិន្នន័យអ្នកប្រើប្រាស់និងការអនុញ្ញាត',
      type: BackupType.CUSTOM,
      size: 5242880, // 5MB
      createdAt: new Date('2025-01-19T14:30:00'),
      createdBy: 'manager@example.com',
      status: BackupStatus.COMPLETED,
      filePath: '/backups/users-backup-20250119.sql',
      metadata: {
        version: '1.0',
        tables: ['users', 'user_roles', 'permissions'],
        recordCount: 156,
        compression: false,
        encrypted: true
      }
    },
    {
      id: 'backup-3',
      name: 'ការបេកអាប់ការសង្កេត',
      description: 'ការបេកអាប់ទិន្នន័យការសង្កេតនិងរបាយការណ៍',
      type: BackupType.INCREMENTAL,
      size: 8388608, // 8MB
      createdAt: new Date('2025-01-19T10:15:00'),
      createdBy: 'admin@example.com',
      status: BackupStatus.IN_PROGRESS,
      metadata: {
        version: '1.0',
        tables: ['observations', 'forms', 'submissions'],
        recordCount: 892,
        compression: true,
        encrypted: false
      }
    },
    {
      id: 'backup-4',
      name: 'ការបេកអាប់ប្រព័ន្ធ',
      description: 'ការបេកអាប់ការកំណត់ប្រព័ន្ធនិងការកំណត់រចនាសម្ព័ន្ធ',
      type: BackupType.FULL,
      size: 2097152, // 2MB
      createdAt: new Date('2025-01-18T16:45:00'),
      createdBy: 'admin@example.com',
      status: BackupStatus.FAILED,
      metadata: {
        version: '1.0',
        tables: ['settings', 'configurations', 'system_logs'],
        recordCount: 45,
        compression: true,
        encrypted: true
      }
    }
  ]

  async getAllBackups(filters?: BackupFilters): Promise<BackupItem[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    let filteredBackups = [...this.mockBackups]
    
    if (filters) {
      if (filters.type) {
        filteredBackups = filteredBackups.filter(backup => backup.type === filters.type)
      }
      if (filters.status) {
        filteredBackups = filteredBackups.filter(backup => backup.status === filters.status)
      }
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase()
        filteredBackups = filteredBackups.filter(backup => 
          backup.name.toLowerCase().includes(searchLower) ||
          backup.description.toLowerCase().includes(searchLower) ||
          backup.createdBy.toLowerCase().includes(searchLower)
        )
      }
      if (filters.dateRange) {
        const [start, end] = filters.dateRange
        filteredBackups = filteredBackups.filter(backup => 
          backup.createdAt >= start && backup.createdAt <= end
        )
      }
    }
    
    return filteredBackups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async getBackupById(id: string): Promise<BackupItem | null> {
    await new Promise(resolve => setTimeout(resolve, 300))
    return this.mockBackups.find(backup => backup.id === id) || null
  }

  async createBackup(request: CreateBackupRequest): Promise<BackupItem> {
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const newBackup: BackupItem = {
      id: `backup-${Date.now()}`,
      name: request.name,
      description: request.description,
      type: request.type,
      size: Math.floor(Math.random() * 50000000), // Random size up to 50MB
      createdAt: new Date(),
      createdBy: 'current-user@example.com',
      status: BackupStatus.IN_PROGRESS,
      metadata: {
        version: '1.0',
        tables: request.tables || [],
        recordCount: Math.floor(Math.random() * 1000),
        compression: request.compression,
        encrypted: request.encryption
      }
    }
    
    this.mockBackups.unshift(newBackup)
    
    // Simulate backup completion
    setTimeout(() => {
      newBackup.status = BackupStatus.COMPLETED
      newBackup.filePath = `/backups/${newBackup.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.sql`
    }, 3000)
    
    return newBackup
  }

  async updateBackup(id: string, updates: Partial<BackupItem>): Promise<BackupItem> {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const backupIndex = this.mockBackups.findIndex(backup => backup.id === id)
    if (backupIndex === -1) {
      throw new Error('Backup not found')
    }
    
    this.mockBackups[backupIndex] = {
      ...this.mockBackups[backupIndex],
      ...updates
    }
    
    return this.mockBackups[backupIndex]
  }

  async deleteBackup(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const backupIndex = this.mockBackups.findIndex(backup => backup.id === id)
    if (backupIndex === -1) {
      throw new Error('Backup not found')
    }
    
    this.mockBackups.splice(backupIndex, 1)
  }

  async restoreBackup(request: RestoreBackupRequest): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const backup = this.mockBackups.find(b => b.id === request.backupId)
    if (!backup) {
      throw new Error('Backup not found')
    }
    
    backup.status = BackupStatus.RESTORED
  }

  async downloadBackup(id: string): Promise<Blob> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const backup = this.mockBackups.find(b => b.id === id)
    if (!backup) {
      throw new Error('Backup not found')
    }
    
    // Create a mock file blob
    const content = `-- Backup: ${backup.name}
-- Created: ${backup.createdAt.toISOString()}
-- Type: ${backup.type}
-- Size: ${backup.size} bytes

-- Mock SQL content for backup
CREATE DATABASE IF NOT EXISTS plp_mentor_backup;
USE plp_mentor_backup;

-- Sample data from backup
SELECT 'Backup restored successfully' as status;`
    
    return new Blob([content], { type: 'application/sql' })
  }

  async getBackupStats(): Promise<BackupStats> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const completed = this.mockBackups.filter(b => b.status === BackupStatus.COMPLETED)
    const failed = this.mockBackups.filter(b => b.status === BackupStatus.FAILED)
    const totalSize = this.mockBackups.reduce((sum, backup) => sum + backup.size, 0)
    const lastBackup = this.mockBackups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
    
    return {
      totalBackups: this.mockBackups.length,
      totalSize,
      successfulBackups: completed.length,
      failedBackups: failed.length,
      lastBackupDate: lastBackup?.createdAt || new Date(),
      nextScheduledBackup: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

export default new BackupService()