import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { AuditLog, AuditAction, AuditEntityType } from '../../entities/audit-log.entity';

export interface AuditLogData {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  entityName?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  description?: string;
  metadata?: Record<string, any>;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  success?: boolean;
  errorMessage?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Log an audit event
   */
  async log(data: AuditLogData, request?: Request): Promise<void> {
    try {
      const auditLog = new AuditLog();
      
      // User information
      auditLog.userId = data.userId;
      auditLog.userEmail = data.userEmail;
      auditLog.userRole = data.userRole;
      
      // Action and entity information
      auditLog.action = data.action;
      auditLog.entityType = data.entityType;
      auditLog.entityId = data.entityId;
      auditLog.entityName = data.entityName;
      
      // Data changes
      auditLog.oldValues = this.sanitizeData(data.oldValues);
      auditLog.newValues = this.sanitizeData(data.newValues);
      
      // Request information
      if (request) {
        auditLog.ipAddress = this.getClientIp(request);
        auditLog.userAgent = request.get('User-Agent');
        auditLog.requestId = request.headers['x-request-id'] as string;
        auditLog.sessionId = (request as any).session?.id;
      }
      
      // Additional information
      auditLog.description = data.description;
      auditLog.metadata = data.metadata;
      auditLog.riskLevel = data.riskLevel || this.calculateRiskLevel(data);
      auditLog.success = data.success !== false;
      auditLog.errorMessage = data.errorMessage;
      
      await this.auditLogRepository.save(auditLog);
    } catch (error) {
      // Don't let audit logging failures break the main application
      console.error('Failed to save audit log:', error);
    }
  }

  /**
   * Log user authentication events
   */
  async logAuth(
    action: AuditAction.LOGIN | AuditAction.LOGOUT | AuditAction.FAILED_LOGIN,
    userId?: string,
    userEmail?: string,
    request?: Request,
    errorMessage?: string,
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      action,
      entityType: AuditEntityType.USER,
      entityId: userId,
      success: action !== AuditAction.FAILED_LOGIN,
      errorMessage,
      riskLevel: action === AuditAction.FAILED_LOGIN ? 'MEDIUM' : 'LOW',
    }, request);
  }

  /**
   * Log data access events
   */
  async logDataAccess(
    entityType: AuditEntityType,
    entityId: string,
    userId: string,
    userEmail: string,
    userRole: string,
    request?: Request,
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      userRole,
      action: AuditAction.READ,
      entityType,
      entityId,
      riskLevel: 'LOW',
    }, request);
  }

  /**
   * Log data modification events
   */
  async logDataModification(
    action: AuditAction.CREATE | AuditAction.UPDATE | AuditAction.DELETE,
    entityType: AuditEntityType,
    entityId: string,
    userId: string,
    userEmail: string,
    userRole: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    request?: Request,
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      userRole,
      action,
      entityType,
      entityId,
      oldValues,
      newValues,
      riskLevel: action === AuditAction.DELETE ? 'HIGH' : 'MEDIUM',
    }, request);
  }

  /**
   * Log export events
   */
  async logExport(
    entityType: AuditEntityType,
    userId: string,
    userEmail: string,
    userRole: string,
    exportType: string,
    filters?: Record<string, any>,
    request?: Request,
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      userRole,
      action: AuditAction.EXPORT,
      entityType,
      description: `Exported ${entityType} data as ${exportType}`,
      metadata: { exportType, filters },
      riskLevel: 'MEDIUM',
    }, request);
  }

  /**
   * Get audit logs with filtering
   */
  async getAuditLogs(filters: {
    userId?: string;
    entityType?: AuditEntityType;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
    riskLevel?: string;
    limit?: number;
    offset?: number;
  }) {
    const query = this.auditLogRepository.createQueryBuilder('audit');

    if (filters.userId) {
      query.andWhere('audit.userId = :userId', { userId: filters.userId });
    }

    if (filters.entityType) {
      query.andWhere('audit.entityType = :entityType', { entityType: filters.entityType });
    }

    if (filters.action) {
      query.andWhere('audit.action = :action', { action: filters.action });
    }

    if (filters.startDate) {
      query.andWhere('audit.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      query.andWhere('audit.createdAt <= :endDate', { endDate: filters.endDate });
    }

    if (filters.riskLevel) {
      query.andWhere('audit.riskLevel = :riskLevel', { riskLevel: filters.riskLevel });
    }

    query.orderBy('audit.createdAt', 'DESC');

    if (filters.limit) {
      query.limit(filters.limit);
    }

    if (filters.offset) {
      query.offset(filters.offset);
    }

    return query.getManyAndCount();
  }

  /**
   * Get security alerts (high-risk audit events)
   */
  async getSecurityAlerts(hours: number = 24) {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);

    return this.auditLogRepository.find({
      where: [
        { riskLevel: 'HIGH', createdAt: startDate },
        { riskLevel: 'CRITICAL', createdAt: startDate },
        { success: false, action: AuditAction.FAILED_LOGIN },
      ],
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  private sanitizeData(data: Record<string, any>): Record<string, any> {
    if (!data) return data;

    const sanitized = { ...data };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'signature'];

    Object.keys(sanitized).forEach(key => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private getClientIp(request: Request): string {
    return (
      request.headers['x-forwarded-for'] as string ||
      request.headers['x-real-ip'] as string ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }

  private calculateRiskLevel(data: AuditLogData): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    // High-risk actions
    if (data.action === AuditAction.DELETE) return 'HIGH';
    if (data.action === AuditAction.FAILED_LOGIN) return 'MEDIUM';
    
    // Critical entity types
    if (data.entityType === AuditEntityType.USER && data.action === AuditAction.UPDATE) {
      return 'HIGH';
    }
    
    // Export actions are medium risk
    if (data.action === AuditAction.EXPORT) return 'MEDIUM';
    
    return 'LOW';
  }
}