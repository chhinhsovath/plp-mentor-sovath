import { Injectable } from '@nestjs/common';

export interface SignatureAuditEvent {
  signatureId: string;
  sessionId: string;
  action: 'signature_created' | 'signature_verified' | 'signature_removed';
  userId: string;
  userRole: string;
  metadata: string;
  timestamp: Date;
}

export interface ApprovalAuditEvent {
  sessionId: string;
  action: 'approve' | 'reject' | 'request_changes' | 'delegate';
  userId: string;
  userRole: string;
  comments?: string;
  metadata: string;
  timestamp: Date;
}

@Injectable()
export class AuditTrailService {
  private signatureAuditLog: SignatureAuditEvent[] = [];
  private approvalAuditLog: ApprovalAuditEvent[] = [];

  async logSignatureEvent(event: SignatureAuditEvent): Promise<void> {
    // In a production environment, this would be stored in a database
    this.signatureAuditLog.push({
      ...event,
      timestamp: new Date(),
    });

    console.log(
      `[AUDIT] Signature Event: ${event.action} for signature ${event.signatureId} by user ${event.userId}`,
    );
  }

  async logApprovalEvent(event: ApprovalAuditEvent): Promise<void> {
    // In a production environment, this would be stored in a database
    this.approvalAuditLog.push({
      ...event,
      timestamp: new Date(),
    });

    console.log(
      `[AUDIT] Approval Event: ${event.action} for session ${event.sessionId} by user ${event.userId}`,
    );
  }

  async getSignatureAuditTrail(signatureId: string): Promise<SignatureAuditEvent[]> {
    return this.signatureAuditLog.filter((event) => event.signatureId === signatureId);
  }

  async getSessionAuditTrail(
    sessionId: string,
  ): Promise<(SignatureAuditEvent | ApprovalAuditEvent)[]> {
    const signatureEvents = this.signatureAuditLog.filter((event) => event.sessionId === sessionId);
    const approvalEvents = this.approvalAuditLog.filter((event) => event.sessionId === sessionId);

    return [...signatureEvents, ...approvalEvents].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }

  async getApprovalHistory(sessionId: string): Promise<ApprovalAuditEvent[]> {
    return this.approvalAuditLog
      .filter((event) => event.sessionId === sessionId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getUserAuditTrail(userId: string): Promise<(SignatureAuditEvent | ApprovalAuditEvent)[]> {
    const signatureEvents = this.signatureAuditLog.filter((event) => event.userId === userId);
    const approvalEvents = this.approvalAuditLog.filter((event) => event.userId === userId);

    return [...signatureEvents, ...approvalEvents].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }

  async getAuditStatistics(): Promise<{
    totalSignatureEvents: number;
    totalApprovalEvents: number;
    eventsByAction: Record<string, number>;
    eventsByUser: Record<string, number>;
    recentActivity: (SignatureAuditEvent | ApprovalAuditEvent)[];
  }> {
    const allEvents = [...this.signatureAuditLog, ...this.approvalAuditLog];

    const eventsByAction: Record<string, number> = {};
    const eventsByUser: Record<string, number> = {};

    allEvents.forEach((event) => {
      eventsByAction[event.action] = (eventsByAction[event.action] || 0) + 1;
      eventsByUser[event.userId] = (eventsByUser[event.userId] || 0) + 1;
    });

    const recentActivity = allEvents
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    return {
      totalSignatureEvents: this.signatureAuditLog.length,
      totalApprovalEvents: this.approvalAuditLog.length,
      eventsByAction,
      eventsByUser,
      recentActivity,
    };
  }

  async searchAuditTrail(criteria: {
    sessionId?: string;
    userId?: string;
    action?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<(SignatureAuditEvent | ApprovalAuditEvent)[]> {
    const allEvents = [...this.signatureAuditLog, ...this.approvalAuditLog];

    return allEvents
      .filter((event) => {
        if (criteria.sessionId && event.sessionId !== criteria.sessionId) {
          return false;
        }

        if (criteria.userId && event.userId !== criteria.userId) {
          return false;
        }

        if (criteria.action && event.action !== criteria.action) {
          return false;
        }

        if (criteria.dateFrom && event.timestamp < criteria.dateFrom) {
          return false;
        }

        if (criteria.dateTo && event.timestamp > criteria.dateTo) {
          return false;
        }

        return true;
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async exportAuditTrail(sessionId?: string): Promise<string> {
    const events = sessionId
      ? await this.getSessionAuditTrail(sessionId)
      : [...this.signatureAuditLog, ...this.approvalAuditLog];

    // Convert to CSV format
    const headers = [
      'Timestamp',
      'Session ID',
      'Action',
      'User ID',
      'User Role',
      'Comments',
      'Metadata',
    ];
    const csvRows = [headers.join(',')];

    events.forEach((event) => {
      const row = [
        event.timestamp.toISOString(),
        event.sessionId,
        event.action,
        event.userId,
        event.userRole,
        ('comments' in event ? event.comments || '' : '').replace(/,/g, ';'),
        event.metadata.replace(/,/g, ';'),
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  async validateAuditIntegrity(): Promise<{
    isValid: boolean;
    issues: string[];
    totalEvents: number;
  }> {
    const issues: string[] = [];
    const allEvents = [...this.signatureAuditLog, ...this.approvalAuditLog];

    // Check for duplicate events
    const eventIds = new Set();
    allEvents.forEach((event) => {
      const eventId = `${event.sessionId}-${event.action}-${event.timestamp.getTime()}`;
      if (eventIds.has(eventId)) {
        issues.push(`Duplicate event detected: ${eventId}`);
      }
      eventIds.add(eventId);
    });

    // Check for chronological consistency
    const sessionEvents = new Map<string, (SignatureAuditEvent | ApprovalAuditEvent)[]>();
    allEvents.forEach((event) => {
      if (!sessionEvents.has(event.sessionId)) {
        sessionEvents.set(event.sessionId, []);
      }
      sessionEvents.get(event.sessionId)!.push(event);
    });

    sessionEvents.forEach((events, sessionId) => {
      const sortedEvents = events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      // Check if signature events come before approval events
      let hasApproval = false;
      sortedEvents.forEach((event) => {
        if (event.action.includes('approve') || event.action === 'reject') {
          hasApproval = true;
        } else if (hasApproval && event.action === 'signature_created') {
          issues.push(`Signature created after approval for session ${sessionId}`);
        }
      });
    });

    return {
      isValid: issues.length === 0,
      issues,
      totalEvents: allEvents.length,
    };
  }
}
