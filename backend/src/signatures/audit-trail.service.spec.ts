import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditTrailService } from './audit-trail.service';
import { Signature } from '../entities/signature.entity';
import { ObservationSession } from '../entities/observation-session.entity';
import { User, UserRole } from '../entities/user.entity';

describe('AuditTrailService', () => {
  let service: AuditTrailService;
  let signatureRepository: Repository<Signature>;
  let sessionRepository: Repository<ObservationSession>;

  const mockAuditEntry = {
    sessionId: 'session-1',
    action: 'signature_created',
    userId: 'user-1',
    userRole: UserRole.TEACHER,
    comments: 'Signed the observation form',
    metadata: JSON.stringify({ signatureRole: 'teacher' }),
    timestamp: new Date('2025-07-19'),
  };

  const mockSession = {
    id: 'session-1',
    teacherName: 'Test Teacher',
    observerName: 'Test Observer',
    metadata: {},
  };

  const mockSignature = {
    id: 'sig-1',
    sessionId: 'session-1',
    role: 'teacher',
    signerName: 'Test Teacher',
    signedDate: new Date('2025-07-19'),
    metadata: {},
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditTrailService,
        {
          provide: getRepositoryToken(Signature),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ObservationSession),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuditTrailService>(AuditTrailService);
    signatureRepository = module.get<Repository<Signature>>(getRepositoryToken(Signature));
    sessionRepository = module.get<Repository<ObservationSession>>(
      getRepositoryToken(ObservationSession),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logSignatureEvent', () => {
    it('should log signature creation event', async () => {
      jest.spyOn(signatureRepository, 'findOne').mockResolvedValue(mockSignature as Signature);
      jest.spyOn(signatureRepository, 'save').mockResolvedValue({
        ...mockSignature,
        metadata: {
          ...mockSignature.metadata,
          auditTrail: [mockAuditEntry],
        },
      } as Signature);

      await service.logSignatureEvent(mockAuditEntry);

      expect(signatureRepository.findOne).toHaveBeenCalledWith({
        where: { sessionId: mockAuditEntry.sessionId, role: 'teacher' },
      });
      expect(signatureRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            auditTrail: expect.arrayContaining([
              expect.objectContaining({
                action: mockAuditEntry.action,
                userId: mockAuditEntry.userId,
              }),
            ]),
          }),
        }),
      );
    });

    it('should create initial audit trail if none exists', async () => {
      const signatureWithoutAudit = { ...mockSignature, metadata: {} };
      jest.spyOn(signatureRepository, 'findOne').mockResolvedValue(signatureWithoutAudit as Signature);
      jest.spyOn(signatureRepository, 'save').mockResolvedValue({
        ...signatureWithoutAudit,
        metadata: {
          auditTrail: [mockAuditEntry],
        },
      } as Signature);

      await service.logSignatureEvent(mockAuditEntry);

      expect(signatureRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            auditTrail: expect.arrayContaining([mockAuditEntry]),
          }),
        }),
      );
    });

    it('should append to existing audit trail', async () => {
      const existingAuditEntry = {
        ...mockAuditEntry,
        timestamp: new Date('2025-07-18'),
        action: 'signature_verified',
      };
      const signatureWithAudit = {
        ...mockSignature,
        metadata: {
          auditTrail: [existingAuditEntry],
        },
      };
      jest.spyOn(signatureRepository, 'findOne').mockResolvedValue(signatureWithAudit as Signature);
      jest.spyOn(signatureRepository, 'save').mockResolvedValue({
        ...signatureWithAudit,
        metadata: {
          auditTrail: [existingAuditEntry, mockAuditEntry],
        },
      } as Signature);

      await service.logSignatureEvent(mockAuditEntry);

      expect(signatureRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            auditTrail: expect.arrayContaining([existingAuditEntry, mockAuditEntry]),
          }),
        }),
      );
    });

    it('should extract signature role from metadata', async () => {
      const eventWithRoleMetadata = {
        ...mockAuditEntry,
        metadata: JSON.stringify({ signatureRole: 'observer' }),
      };
      jest.spyOn(signatureRepository, 'findOne').mockResolvedValue(null);

      await service.logSignatureEvent(eventWithRoleMetadata);

      expect(signatureRepository.findOne).toHaveBeenCalledWith({
        where: { sessionId: eventWithRoleMetadata.sessionId, role: 'observer' },
      });
    });

    it('should handle events without signature role', async () => {
      const eventWithoutRole = {
        ...mockAuditEntry,
        metadata: JSON.stringify({ otherData: 'value' }),
      };
      jest.spyOn(signatureRepository, 'findOne').mockResolvedValue(null);

      await service.logSignatureEvent(eventWithoutRole);

      expect(signatureRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe('logApprovalEvent', () => {
    it('should log approval event to session metadata', async () => {
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(mockSession as ObservationSession);
      jest.spyOn(sessionRepository, 'save').mockResolvedValue({
        ...mockSession,
        metadata: {
          approvalHistory: [mockAuditEntry],
        },
      } as ObservationSession);

      await service.logApprovalEvent(mockAuditEntry);

      expect(sessionRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockAuditEntry.sessionId },
      });
      expect(sessionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            approvalHistory: expect.arrayContaining([
              expect.objectContaining({
                action: mockAuditEntry.action,
                userId: mockAuditEntry.userId,
              }),
            ]),
          }),
        }),
      );
    });

    it('should create approval history if none exists', async () => {
      const sessionWithoutHistory = { ...mockSession, metadata: {} };
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(sessionWithoutHistory as ObservationSession);
      jest.spyOn(sessionRepository, 'save').mockResolvedValue({
        ...sessionWithoutHistory,
        metadata: {
          approvalHistory: [mockAuditEntry],
        },
      } as ObservationSession);

      await service.logApprovalEvent(mockAuditEntry);

      expect(sessionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            approvalHistory: [mockAuditEntry],
          }),
        }),
      );
    });

    it('should append to existing approval history', async () => {
      const existingApproval = {
        ...mockAuditEntry,
        timestamp: new Date('2025-07-18'),
        action: 'approve',
      };
      const sessionWithHistory = {
        ...mockSession,
        metadata: {
          approvalHistory: [existingApproval],
        },
      };
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(sessionWithHistory as ObservationSession);
      jest.spyOn(sessionRepository, 'save').mockResolvedValue({
        ...sessionWithHistory,
        metadata: {
          approvalHistory: [existingApproval, mockAuditEntry],
        },
      } as ObservationSession);

      await service.logApprovalEvent(mockAuditEntry);

      expect(sessionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            approvalHistory: expect.arrayContaining([existingApproval, mockAuditEntry]),
          }),
        }),
      );
    });

    it('should not save if session not found', async () => {
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(sessionRepository, 'save');

      await service.logApprovalEvent(mockAuditEntry);

      expect(sessionRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getSignatureAuditTrail', () => {
    it('should return audit trail for specific signature', async () => {
      const auditTrail = [
        { action: 'signature_created', timestamp: new Date('2025-07-19') },
        { action: 'signature_verified', timestamp: new Date('2025-07-20') },
      ];
      const signatureWithAudit = {
        ...mockSignature,
        metadata: { auditTrail },
      };
      jest.spyOn(signatureRepository, 'findOne').mockResolvedValue(signatureWithAudit as Signature);

      const result = await service.getSignatureAuditTrail('sig-1');

      expect(result).toEqual(auditTrail);
      expect(signatureRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'sig-1' },
      });
    });

    it('should return empty array if no audit trail exists', async () => {
      jest.spyOn(signatureRepository, 'findOne').mockResolvedValue(mockSignature as Signature);

      const result = await service.getSignatureAuditTrail('sig-1');

      expect(result).toEqual([]);
    });

    it('should return empty array if signature not found', async () => {
      jest.spyOn(signatureRepository, 'findOne').mockResolvedValue(null);

      const result = await service.getSignatureAuditTrail('non-existent');

      expect(result).toEqual([]);
    });
  });

  describe('getApprovalHistory', () => {
    it('should return approval history for session', async () => {
      const approvalHistory = [
        { action: 'approve', userId: 'user-1', timestamp: new Date('2025-07-19') },
        { action: 'delegate', userId: 'user-2', timestamp: new Date('2025-07-20') },
      ];
      const sessionWithHistory = {
        ...mockSession,
        metadata: { approvalHistory },
      };
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(sessionWithHistory as ObservationSession);

      const result = await service.getApprovalHistory('session-1');

      expect(result).toEqual(approvalHistory);
      expect(sessionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'session-1' },
      });
    });

    it('should return empty array if no approval history exists', async () => {
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(mockSession as ObservationSession);

      const result = await service.getApprovalHistory('session-1');

      expect(result).toEqual([]);
    });

    it('should return empty array if session not found', async () => {
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(null);

      const result = await service.getApprovalHistory('non-existent');

      expect(result).toEqual([]);
    });
  });

  describe('getSessionAuditTrail', () => {
    it('should return combined audit trail from signatures and approvals', async () => {
      const signatureAuditEntry = {
        action: 'signature_created',
        userId: 'user-1',
        timestamp: new Date('2025-07-19T10:00:00'),
      };
      const approvalAuditEntry = {
        action: 'approve',
        userId: 'user-2',
        timestamp: new Date('2025-07-19T11:00:00'),
      };

      const signatures = [
        {
          ...mockSignature,
          metadata: { auditTrail: [signatureAuditEntry] },
        },
      ];
      const sessionWithApproval = {
        ...mockSession,
        metadata: { approvalHistory: [approvalAuditEntry] },
      };

      jest.spyOn(signatureRepository, 'find').mockResolvedValue(signatures as Signature[]);
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(sessionWithApproval as ObservationSession);

      const result = await service.getSessionAuditTrail('session-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(signatureAuditEntry);
      expect(result[1]).toEqual(approvalAuditEntry);
    });

    it('should sort audit trail by timestamp ascending', async () => {
      const entries = [
        { action: 'action3', timestamp: new Date('2025-07-19T12:00:00') },
        { action: 'action1', timestamp: new Date('2025-07-19T10:00:00') },
        { action: 'action2', timestamp: new Date('2025-07-19T11:00:00') },
      ];

      const signatures = [
        {
          ...mockSignature,
          metadata: { auditTrail: [entries[0], entries[1]] },
        },
      ];
      const sessionWithApproval = {
        ...mockSession,
        metadata: { approvalHistory: [entries[2]] },
      };

      jest.spyOn(signatureRepository, 'find').mockResolvedValue(signatures as Signature[]);
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(sessionWithApproval as ObservationSession);

      const result = await service.getSessionAuditTrail('session-1');

      expect(result[0].action).toBe('action1');
      expect(result[1].action).toBe('action2');
      expect(result[2].action).toBe('action3');
    });

    it('should handle sessions with no audit data', async () => {
      jest.spyOn(signatureRepository, 'find').mockResolvedValue([]);
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(mockSession as ObservationSession);

      const result = await service.getSessionAuditTrail('session-1');

      expect(result).toEqual([]);
    });

    it('should handle missing session', async () => {
      jest.spyOn(signatureRepository, 'find').mockResolvedValue([]);
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(null);

      const result = await service.getSessionAuditTrail('session-1');

      expect(result).toEqual([]);
    });
  });

  describe('generateAuditReport', () => {
    it('should generate comprehensive audit report', async () => {
      const signatureEvents = [
        { action: 'signature_created', userId: 'user-1', timestamp: new Date('2025-07-19') },
        { action: 'signature_verified', userId: 'user-2', timestamp: new Date('2025-07-20') },
      ];
      const approvalEvents = [
        { action: 'approve', userId: 'user-3', timestamp: new Date('2025-07-21') },
      ];

      jest.spyOn(service, 'getSessionAuditTrail').mockResolvedValue([
        ...signatureEvents,
        ...approvalEvents,
      ]);

      const report = await service.generateAuditReport('session-1');

      expect(report.sessionId).toBe('session-1');
      expect(report.totalEvents).toBe(3);
      expect(report.signatureEvents).toBe(2);
      expect(report.approvalEvents).toBe(1);
      expect(report.uniqueUsers).toBe(3);
      expect(report.timeline).toHaveLength(3);
      expect(report.summary).toBeDefined();
    });

    it('should calculate event durations correctly', async () => {
      const events = [
        { action: 'signature_created', userId: 'user-1', timestamp: new Date('2025-07-19T10:00:00') },
        { action: 'approve', userId: 'user-2', timestamp: new Date('2025-07-19T12:00:00') },
      ];

      jest.spyOn(service, 'getSessionAuditTrail').mockResolvedValue(events);

      const report = await service.generateAuditReport('session-1');

      expect(report.timeline[0].duration).toBe(120); // 2 hours in minutes
    });

    it('should handle report with no events', async () => {
      jest.spyOn(service, 'getSessionAuditTrail').mockResolvedValue([]);

      const report = await service.generateAuditReport('session-1');

      expect(report.totalEvents).toBe(0);
      expect(report.signatureEvents).toBe(0);
      expect(report.approvalEvents).toBe(0);
      expect(report.uniqueUsers).toBe(0);
      expect(report.timeline).toEqual([]);
    });
  });

  describe('searchAuditEvents', () => {
    it('should search events by user ID', async () => {
      const allEvents = [
        { action: 'signature_created', userId: 'user-1', timestamp: new Date() },
        { action: 'approve', userId: 'user-2', timestamp: new Date() },
        { action: 'signature_verified', userId: 'user-1', timestamp: new Date() },
      ];
      jest.spyOn(service, 'getSessionAuditTrail').mockResolvedValue(allEvents);

      const result = await service.searchAuditEvents('session-1', { userId: 'user-1' });

      expect(result).toHaveLength(2);
      expect(result.every(e => e.userId === 'user-1')).toBe(true);
    });

    it('should search events by action', async () => {
      const allEvents = [
        { action: 'signature_created', userId: 'user-1', timestamp: new Date() },
        { action: 'approve', userId: 'user-2', timestamp: new Date() },
        { action: 'signature_created', userId: 'user-3', timestamp: new Date() },
      ];
      jest.spyOn(service, 'getSessionAuditTrail').mockResolvedValue(allEvents);

      const result = await service.searchAuditEvents('session-1', { action: 'signature_created' });

      expect(result).toHaveLength(2);
      expect(result.every(e => e.action === 'signature_created')).toBe(true);
    });

    it('should search events by date range', async () => {
      const allEvents = [
        { action: 'action1', userId: 'user-1', timestamp: new Date('2025-07-19') },
        { action: 'action2', userId: 'user-2', timestamp: new Date('2025-07-20') },
        { action: 'action3', userId: 'user-3', timestamp: new Date('2025-07-21') },
      ];
      jest.spyOn(service, 'getSessionAuditTrail').mockResolvedValue(allEvents);

      const result = await service.searchAuditEvents('session-1', {
        startDate: new Date('2025-07-19'),
        endDate: new Date('2025-07-20'),
      });

      expect(result).toHaveLength(2);
      expect(result[0].action).toBe('action1');
      expect(result[1].action).toBe('action2');
    });

    it('should combine multiple search criteria', async () => {
      const allEvents = [
        { action: 'signature_created', userId: 'user-1', timestamp: new Date('2025-07-19') },
        { action: 'approve', userId: 'user-1', timestamp: new Date('2025-07-20') },
        { action: 'signature_created', userId: 'user-2', timestamp: new Date('2025-07-20') },
      ];
      jest.spyOn(service, 'getSessionAuditTrail').mockResolvedValue(allEvents);

      const result = await service.searchAuditEvents('session-1', {
        userId: 'user-1',
        action: 'signature_created',
      });

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user-1');
      expect(result[0].action).toBe('signature_created');
    });

    it('should return all events when no criteria provided', async () => {
      const allEvents = [
        { action: 'action1', userId: 'user-1', timestamp: new Date() },
        { action: 'action2', userId: 'user-2', timestamp: new Date() },
      ];
      jest.spyOn(service, 'getSessionAuditTrail').mockResolvedValue(allEvents);

      const result = await service.searchAuditEvents('session-1', {});

      expect(result).toEqual(allEvents);
    });
  });
});