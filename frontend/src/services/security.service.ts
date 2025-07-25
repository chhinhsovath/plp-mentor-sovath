import { 
  SecuritySettings, 
  SecurityEvent, 
  SecurityEventType, 
  SecuritySeverity, 
  UserSession, 
  SecurityScan,
  SecurityStats,
  SecurityAlert
} from '../types/security'

class SecurityService {
  private baseUrl = '/api/security'

  // Mock data for development
  private mockSettings: SecuritySettings = {
    authentication: {
      twoFactorEnabled: true,
      biometricEnabled: false,
      ssoEnabled: false,
      sessionTimeout: 120,
      maxLoginAttempts: 5,
      lockoutDuration: 15,
      requirePasswordChange: true,
      passwordChangeInterval: 90
    },
    sessionManagement: {
      maxConcurrentSessions: 3,
      sessionTimeout: 120,
      rememberMeEnabled: true,
      rememberMeDuration: 30,
      sessionEncryption: true,
      secureOnly: true
    },
    passwordPolicy: {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventPasswordReuse: true,
      passwordHistoryCount: 5,
      complexity: 'high'
    },
    accessControl: {
      roleBasedAccess: true,
      ipWhitelisting: false,
      whitelistedIPs: ['192.168.1.0/24', '10.0.0.0/8'],
      blockSuspiciousActivity: true,
      logFailedAttempts: true,
      emailSecurityAlerts: true,
      adminApprovalRequired: false
    },
    monitoring: {
      auditLogging: true,
      realTimeMonitoring: true,
      suspiciousActivityDetection: true,
      loginLocationTracking: true,
      deviceFingerprinting: true,
      securityEventNotifications: true,
      retentionPeriod: 365
    },
    dataProtection: {
      encryption: {
        dataAtRest: true,
        dataInTransit: true,
        databaseEncryption: true,
        fileEncryption: true,
        encryptionAlgorithm: 'AES256'
      },
      backupSecurity: {
        encryptBackups: true,
        signBackups: true,
        offSiteStorage: true,
        accessControlBackups: true
      },
      dataAnonymization: false,
      gdprCompliance: true,
      dataRetentionPeriod: 2555 // 7 years
    }
  }

  private mockEvents: SecurityEvent[] = [
    {
      id: 'event-1',
      type: SecurityEventType.SUSPICIOUS_ACTIVITY,
      severity: SecuritySeverity.HIGH,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      userId: 'user-123',
      userEmail: 'suspicious@example.com',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0...',
      description: 'ការប្រភាក់ការចូលពីទីតាំងថ្មី',
      details: { 
        location: 'Unknown Location', 
        attempts: 10,
        timeframe: '5 minutes'
      },
      status: 'active'
    },
    {
      id: 'event-2',
      type: SecurityEventType.LOGIN_FAILED,
      severity: SecuritySeverity.MEDIUM,
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      userEmail: 'admin@example.com',
      ipAddress: '203.189.123.45',
      userAgent: 'curl/7.68.0',
      description: 'ការចូលបរាជ័យជាបន្តបន្ទាប់',
      details: { attempts: 5, accountLocked: true },
      status: 'resolved',
      resolvedBy: 'security-system',
      resolvedAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
    },
    {
      id: 'event-3',
      type: SecurityEventType.UNAUTHORIZED_ACCESS,
      severity: SecuritySeverity.CRITICAL,
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
      userId: 'user-456',
      userEmail: 'teacher@example.com',
      ipAddress: '10.0.0.50',
      description: 'ការព្យាយាមចូលទៅកាន់ទំព័រគ្រប់គ្រងប្រព័ន្ធ',
      details: { 
        attemptedUrl: '/admin/users',
        userRole: 'teacher',
        requiredRole: 'administrator'
      },
      status: 'resolved',
      resolvedBy: 'admin',
      resolvedAt: new Date(Date.now() - 7 * 60 * 60 * 1000)
    },
    {
      id: 'event-4',
      type: SecurityEventType.PASSWORD_CHANGED,
      severity: SecuritySeverity.LOW,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      userId: 'user-789',
      userEmail: 'user@example.com',
      ipAddress: '192.168.1.101',
      description: 'ការប្តូរពាក្យសម្ងាត់ដោយជោគជ័យ',
      details: { initiatedBy: 'user', method: '2fa' },
      status: 'resolved'
    }
  ]

  private mockSessions: UserSession[] = [
    {
      id: 'session-1',
      userId: 'user-123',
      userEmail: 'admin@example.com',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      location: 'Phnom Penh, Cambodia',
      device: 'Windows PC - Chrome',
      startTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
      lastActivity: new Date(Date.now() - 10 * 60 * 1000),
      status: 'active',
      duration: 170
    },
    {
      id: 'session-2',
      userId: 'user-456',
      userEmail: 'teacher@example.com',
      ipAddress: '10.0.0.25',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
      location: 'Battambang, Cambodia',
      device: 'iPhone - Safari',
      startTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
      lastActivity: new Date(Date.now() - 5 * 60 * 1000),
      status: 'active',
      duration: 55
    },
    {
      id: 'session-3',
      userId: 'user-789',
      userEmail: 'observer@example.com',
      ipAddress: '203.144.123.89',
      userAgent: 'Mozilla/5.0 (Android 12; Mobile; rv:98.0)',
      location: 'Siem Reap, Cambodia',
      device: 'Android - Firefox',
      startTime: new Date(Date.now() - 6 * 60 * 60 * 1000),
      lastActivity: new Date(Date.now() - 4 * 60 * 60 * 1000),
      status: 'expired',
      duration: 120
    }
  ]

  async getSecuritySettings(): Promise<SecuritySettings> {
    await new Promise(resolve => setTimeout(resolve, 500))
    return { ...this.mockSettings }
  }

  async updateSecuritySettings(settings: Partial<SecuritySettings>): Promise<SecuritySettings> {
    await new Promise(resolve => setTimeout(resolve, 800))
    this.mockSettings = { ...this.mockSettings, ...settings }
    return { ...this.mockSettings }
  }

  async getSecurityEvents(filters?: {
    type?: SecurityEventType
    severity?: SecuritySeverity
    status?: string
    dateRange?: [Date, Date]
    limit?: number
  }): Promise<SecurityEvent[]> {
    await new Promise(resolve => setTimeout(resolve, 600))
    
    let events = [...this.mockEvents]
    
    if (filters) {
      if (filters.type) {
        events = events.filter(event => event.type === filters.type)
      }
      if (filters.severity) {
        events = events.filter(event => event.severity === filters.severity)
      }
      if (filters.status) {
        events = events.filter(event => event.status === filters.status)
      }
      if (filters.dateRange) {
        const [start, end] = filters.dateRange
        events = events.filter(event => 
          event.timestamp >= start && event.timestamp <= end
        )
      }
      if (filters.limit) {
        events = events.slice(0, filters.limit)
      }
    }
    
    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  async getActiveSessions(): Promise<UserSession[]> {
    await new Promise(resolve => setTimeout(resolve, 400))
    return this.mockSessions.filter(session => session.status === 'active')
  }

  async getAllSessions(): Promise<UserSession[]> {
    await new Promise(resolve => setTimeout(resolve, 400))
    return [...this.mockSessions]
  }

  async terminateSession(sessionId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300))
    const session = this.mockSessions.find(s => s.id === sessionId)
    if (session) {
      session.status = 'terminated'
      session.lastActivity = new Date()
    }
  }

  async terminateAllSessions(excludeCurrent: boolean = true): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500))
    this.mockSessions.forEach(session => {
      if (!excludeCurrent || session.id !== 'session-1') { // Assume session-1 is current
        session.status = 'terminated'
        session.lastActivity = new Date()
      }
    })
  }

  async runSecurityScan(type: 'vulnerability' | 'penetration' | 'compliance'): Promise<SecurityScan> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const scan: SecurityScan = {
      id: `scan-${Date.now()}`,
      type,
      status: 'running',
      startTime: new Date()
    }

    // Simulate scan completion
    setTimeout(() => {
      scan.status = 'completed'
      scan.endTime = new Date()
      scan.results = {
        totalChecks: 45,
        passed: 38,
        failed: 4,
        warnings: 3,
        criticalIssues: 1,
        vulnerabilities: [
          {
            id: 'vuln-1',
            severity: SecuritySeverity.HIGH,
            type: 'SQL Injection',
            description: 'Potential SQL injection vulnerability',
            location: '/api/users',
            recommendation: 'Use parameterized queries',
            status: 'open'
          }
        ]
      }
      scan.recommendations = [
        'Update security policies',
        'Enable additional logging',
        'Review user permissions'
      ]
    }, 3000)

    return scan
  }

  async getSecurityStats(): Promise<SecurityStats> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const activeEvents = this.mockEvents.filter(e => e.status === 'active')
    const criticalEvents = this.mockEvents.filter(e => 
      e.severity === SecuritySeverity.CRITICAL || e.severity === SecuritySeverity.HIGH
    )
    
    return {
      totalEvents: this.mockEvents.length,
      criticalEvents: criticalEvents.length,
      activeThreats: activeEvents.length,
      resolvedThreats: this.mockEvents.filter(e => e.status === 'resolved').length,
      activeSessions: this.mockSessions.filter(s => s.status === 'active').length,
      blockedAttempts: 27,
      lastSecurityScan: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      complianceScore: 87
    }
  }

  async acknowledgeSecurityEvent(eventId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200))
    const event = this.mockEvents.find(e => e.id === eventId)
    if (event && event.status === 'active') {
      event.status = 'resolved'
      event.resolvedBy = 'current-user'
      event.resolvedAt = new Date()
    }
  }

  async getSecurityAlerts(): Promise<SecurityAlert[]> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    return this.mockEvents
      .filter(event => event.status === 'active')
      .map(event => ({
        id: event.id,
        type: event.type,
        severity: event.severity,
        title: this.getEventTitle(event.type),
        message: event.description,
        timestamp: event.timestamp,
        acknowledged: false,
        userId: event.userId,
        actions: [
          {
            id: 'acknowledge',
            name: 'បញ្ជាក់',
            description: 'បញ្ជាក់ព្រឹត្តិការណ៍សុវត្ថិភាពនេះ',
            handler: () => this.acknowledgeSecurityEvent(event.id)
          },
          {
            id: 'investigate',
            name: 'ស៊ើបអង្កេត',
            description: 'ស៊ើបអង្កេតព្រឹត្តិការណ៍នេះបន្ថែម',
            handler: () => console.log('Investigating event:', event.id)
          }
        ]
      }))
  }

  private getEventTitle(type: SecurityEventType): string {
    const titles = {
      [SecurityEventType.SUSPICIOUS_ACTIVITY]: 'សកម្មភាពគួរឱ្យសង្ស័យ',
      [SecurityEventType.LOGIN_FAILED]: 'ការចូលបរាជ័យ',
      [SecurityEventType.UNAUTHORIZED_ACCESS]: 'ការចូលដោយគ្មានការអនុញ្ញាត',
      [SecurityEventType.PASSWORD_CHANGED]: 'ការប្តូរពាក្យសម្ងាត់',
      [SecurityEventType.ACCOUNT_LOCKED]: 'គណនីត្រូវបានចាក់សោ',
      [SecurityEventType.DATA_BREACH_ATTEMPT]: 'ការព្យាយាមលួចទិន្នន័យ',
      [SecurityEventType.SYSTEM_VULNERABILITY]: 'ភាពងាយរងគ្រោះប្រព័ន្ធ',
      [SecurityEventType.PERMISSION_ESCALATION]: 'ការលើកកម្ពស់សិទ្ធិ',
      [SecurityEventType.SESSION_HIJACK_ATTEMPT]: 'ការព្យាយាមចាប់យកសម័យ',
      [SecurityEventType.LOGIN_SUCCESS]: 'ការចូលជោគជ័យ'
    }
    return titles[type] || 'ព្រឹត្តិការណ៍សុវត្ថិភាព'
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} នាទី`
    } else if (minutes < 24 * 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours} ម៉ោង ${mins} នាទី`
    } else {
      const days = Math.floor(minutes / (24 * 60))
      const hours = Math.floor((minutes % (24 * 60)) / 60)
      return `${days} ថ្ងៃ ${hours} ម៉ោង`
    }
  }

  getSeverityColor(severity: SecuritySeverity): string {
    const colors = {
      [SecuritySeverity.LOW]: '#52c41a',
      [SecuritySeverity.MEDIUM]: '#faad14',
      [SecuritySeverity.HIGH]: '#ff7875',
      [SecuritySeverity.CRITICAL]: '#ff4d4f'
    }
    return colors[severity]
  }

  getSeverityIcon(severity: SecuritySeverity): string {
    const icons = {
      [SecuritySeverity.LOW]: '🟢',
      [SecuritySeverity.MEDIUM]: '🟡',
      [SecuritySeverity.HIGH]: '🟠',
      [SecuritySeverity.CRITICAL]: '🔴'
    }
    return icons[severity]
  }
}

export default new SecurityService()