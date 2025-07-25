import { Test, TestingModule } from '@nestjs/testing';
import { SignaturesController } from './signatures.controller';
import { SignaturesService } from './signatures.service';
import { ApprovalWorkflowService } from './approval-workflow.service';
import { AuditTrailService } from './audit-trail.service';
import { CreateSignatureDto } from './dto/create-signature.dto';
import { ApprovalRequestDto, ApprovalAction } from './dto/approval-request.dto';
import { SignatureVerificationDto } from './dto/signature-verification.dto';
import { User, UserRole } from '../entities/user.entity';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('SignaturesController', () => {
  let controller: SignaturesController;
  let signaturesService: SignaturesService;
  let approvalWorkflowService: ApprovalWorkflowService;
  let auditTrailService: AuditTrailService;

  const mockUser = {
    id: 'user-1',
    username: 'teacher1',
    fullName: 'Test Teacher',
    role: UserRole.TEACHER,
    email: 'teacher@example.com',
  };

  const mockSignature = {
    id: 'sig-1',
    sessionId: 'session-1',
    role: 'teacher',
    signerName: 'Test Teacher',
    signedDate: new Date('2025-07-19'),
    signatureData: 'data:image/png;base64,signature',
    metadata: {},
  };

  const mockSession = {
    id: 'session-1',
    teacherName: 'Test Teacher',
    observerName: 'Test Observer',
    status: 'COMPLETED',
    signatures: [mockSignature],
  };

  const mockWorkflow = {
    sessionId: 'session-1',
    currentStep: 1,
    totalSteps: 2,
    steps: [
      {
        stepNumber: 1,
        requiredRole: ['teacher', 'observer'],
        description: 'Teacher and Observer signatures',
        isCompleted: true,
      },
      {
        stepNumber: 2,
        requiredRole: ['Director'],
        description: 'Supervisor approval',
        isCompleted: false,
      },
    ],
    isCompleted: false,
    canProceed: true,
    nextApprovers: ['Director'],
  };

  const mockAuditTrail = [
    {
      action: 'signature_created',
      userId: 'user-1',
      timestamp: new Date('2025-07-19'),
      comments: 'Signed observation form',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SignaturesController],
      providers: [
        {
          provide: SignaturesService,
          useValue: {
            create: jest.fn(),
            findBySession: jest.fn(),
            findOne: jest.fn(),
            validateSignatureData: jest.fn(),
            getSignatureRequirements: jest.fn(),
            removeSignature: jest.fn(),
            getSignatureStatistics: jest.fn(),
            verifySignature: jest.fn(),
          },
        },
        {
          provide: ApprovalWorkflowService,
          useValue: {
            getApprovalWorkflow: jest.fn(),
            processApproval: jest.fn(),
            getApprovalHistory: jest.fn(),
            getPendingApprovals: jest.fn(),
            delegateApproval: jest.fn(),
          },
        },
        {
          provide: AuditTrailService,
          useValue: {
            getSignatureAuditTrail: jest.fn(),
            getSessionAuditTrail: jest.fn(),
            generateAuditReport: jest.fn(),
            searchAuditEvents: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SignaturesController>(SignaturesController);
    signaturesService = module.get<SignaturesService>(SignaturesService);
    approvalWorkflowService = module.get<ApprovalWorkflowService>(ApprovalWorkflowService);
    auditTrailService = module.get<AuditTrailService>(AuditTrailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /signatures', () => {
    it('should create a new signature', async () => {
      const createDto: CreateSignatureDto = {
        sessionId: 'session-1',
        role: 'teacher',
        signerName: 'Test Teacher',
        signedDate: '2025-07-19',
        signatureData: 'data:image/png;base64,signature',
        signatureMethod: 'digital_pad',
      };

      jest.spyOn(signaturesService, 'create').mockResolvedValue(mockSignature as any);

      const result = await controller.create(createDto, { user: mockUser } as any);

      expect(result).toEqual(mockSignature);
      expect(signaturesService.create).toHaveBeenCalledWith(createDto, mockUser);
    });

    it('should handle validation errors', async () => {
      const createDto: CreateSignatureDto = {
        sessionId: 'session-1',
        role: 'teacher',
        signerName: 'Test Teacher',
        signedDate: '2025-07-19',
        signatureData: 'invalid-data',
        signatureMethod: 'digital_pad',
      };

      jest.spyOn(signaturesService, 'create').mockRejectedValue(
        new BadRequestException('Invalid signature data format'),
      );

      await expect(controller.create(createDto, { user: mockUser } as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle unauthorized access', async () => {
      const createDto: CreateSignatureDto = {
        sessionId: 'session-1',
        role: 'supervisor',
        signerName: 'Test Supervisor',
        signedDate: '2025-07-19',
        signatureData: 'data:image/png;base64,signature',
        signatureMethod: 'digital_pad',
      };

      jest.spyOn(signaturesService, 'create').mockRejectedValue(
        new ForbiddenException('You are not authorized to sign as supervisor'),
      );

      await expect(controller.create(createDto, { user: mockUser } as any)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('GET /signatures/session/:sessionId', () => {
    it('should return signatures for a session', async () => {
      jest.spyOn(signaturesService, 'findBySession').mockResolvedValue([mockSignature] as any);

      const result = await controller.findBySession('session-1');

      expect(result).toEqual([mockSignature]);
      expect(signaturesService.findBySession).toHaveBeenCalledWith('session-1');
    });

    it('should return empty array for session without signatures', async () => {
      jest.spyOn(signaturesService, 'findBySession').mockResolvedValue([]);

      const result = await controller.findBySession('session-1');

      expect(result).toEqual([]);
    });
  });

  describe('GET /signatures/:id', () => {
    it('should return a signature by ID', async () => {
      jest.spyOn(signaturesService, 'findOne').mockResolvedValue(mockSignature as any);

      const result = await controller.findOne('sig-1');

      expect(result).toEqual(mockSignature);
      expect(signaturesService.findOne).toHaveBeenCalledWith('sig-1');
    });

    it('should handle not found signature', async () => {
      jest.spyOn(signaturesService, 'findOne').mockRejectedValue(
        new NotFoundException('Signature not found'),
      );

      await expect(controller.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('POST /signatures/validate', () => {
    it('should validate signature data', async () => {
      const validationResult = {
        isValid: true,
        errors: [],
        signatureHash: 'hash123',
        timestamp: new Date(),
      };

      jest.spyOn(signaturesService, 'validateSignatureData').mockResolvedValue(validationResult);

      const result = await controller.validateSignature({
        signatureData: 'data:image/png;base64,signature',
      });

      expect(result).toEqual(validationResult);
    });

    it('should return validation errors', async () => {
      const validationResult = {
        isValid: false,
        errors: ['Invalid signature format'],
        signatureHash: null,
        timestamp: new Date(),
      };

      jest.spyOn(signaturesService, 'validateSignatureData').mockResolvedValue(validationResult);

      const result = await controller.validateSignature({
        signatureData: 'invalid-data',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid signature format');
    });
  });

  describe('GET /signatures/requirements/:sessionId', () => {
    it('should return signature requirements', async () => {
      const requirements = {
        requiredSignatures: ['teacher', 'observer', 'supervisor'],
        completedSignatures: ['teacher'],
        pendingSignatures: ['observer', 'supervisor'],
        canProceed: false,
        nextRequiredSignature: 'observer',
      };

      jest.spyOn(signaturesService, 'getSignatureRequirements').mockResolvedValue(requirements);

      const result = await controller.getSignatureRequirements('session-1');

      expect(result).toEqual(requirements);
      expect(signaturesService.getSignatureRequirements).toHaveBeenCalledWith('session-1');
    });
  });

  describe('DELETE /signatures/:id', () => {
    it('should remove signature when authorized', async () => {
      const adminUser = { ...mockUser, role: UserRole.ADMINISTRATOR };
      jest.spyOn(signaturesService, 'removeSignature').mockResolvedValue();

      await controller.removeSignature('sig-1', { user: adminUser } as any);

      expect(signaturesService.removeSignature).toHaveBeenCalledWith('sig-1', adminUser);
    });

    it('should reject unauthorized removal', async () => {
      jest.spyOn(signaturesService, 'removeSignature').mockRejectedValue(
        new ForbiddenException('Only administrators can remove signatures'),
      );

      await expect(
        controller.removeSignature('sig-1', { user: mockUser } as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('GET /signatures/workflow/:sessionId', () => {
    it('should return approval workflow', async () => {
      jest.spyOn(approvalWorkflowService, 'getApprovalWorkflow').mockResolvedValue(mockWorkflow);

      const result = await controller.getApprovalWorkflow('session-1');

      expect(result).toEqual(mockWorkflow);
      expect(approvalWorkflowService.getApprovalWorkflow).toHaveBeenCalledWith('session-1');
    });

    it('should handle session not found', async () => {
      jest.spyOn(approvalWorkflowService, 'getApprovalWorkflow').mockRejectedValue(
        new NotFoundException('Session not found'),
      );

      await expect(controller.getApprovalWorkflow('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('POST /signatures/approval', () => {
    it('should process approval request', async () => {
      const approvalDto: ApprovalRequestDto = {
        sessionId: 'session-1',
        action: ApprovalAction.APPROVE,
        comments: 'Approved',
        signatureData: 'data:image/png;base64,signature',
      };

      jest.spyOn(approvalWorkflowService, 'processApproval').mockResolvedValue(mockSession as any);

      const result = await controller.processApproval(approvalDto, { user: mockUser } as any);

      expect(result).toEqual(mockSession);
      expect(approvalWorkflowService.processApproval).toHaveBeenCalledWith(approvalDto, mockUser);
    });

    it('should handle rejection action', async () => {
      const approvalDto: ApprovalRequestDto = {
        sessionId: 'session-1',
        action: ApprovalAction.REJECT,
        comments: 'Needs improvement',
      };

      jest.spyOn(approvalWorkflowService, 'processApproval').mockResolvedValue({
        ...mockSession,
        status: 'DRAFT',
      } as any);

      const result = await controller.processApproval(approvalDto, { user: mockUser } as any);

      expect(result.status).toBe('DRAFT');
    });

    it('should handle delegation action', async () => {
      const approvalDto: ApprovalRequestDto = {
        sessionId: 'session-1',
        action: ApprovalAction.DELEGATE,
        comments: 'Delegating to another supervisor',
        delegateToUserId: 'user-2',
      };

      jest.spyOn(approvalWorkflowService, 'processApproval').mockResolvedValue(mockSession as any);

      await controller.processApproval(approvalDto, { user: mockUser } as any);

      expect(approvalWorkflowService.processApproval).toHaveBeenCalledWith(approvalDto, mockUser);
    });
  });

  describe('GET /signatures/approval/history/:sessionId', () => {
    it('should return approval history', async () => {
      const approvalHistory = [
        {
          action: 'approve',
          userId: 'user-1',
          timestamp: new Date('2025-07-19'),
          comments: 'Approved',
        },
      ];

      jest.spyOn(approvalWorkflowService, 'getApprovalHistory').mockResolvedValue(approvalHistory);

      const result = await controller.getApprovalHistory('session-1');

      expect(result).toEqual(approvalHistory);
      expect(approvalWorkflowService.getApprovalHistory).toHaveBeenCalledWith('session-1');
    });
  });

  describe('GET /signatures/approval/pending', () => {
    it('should return pending approvals for user', async () => {
      const pendingSessions = [mockSession];

      jest.spyOn(approvalWorkflowService, 'getPendingApprovals').mockResolvedValue(
        pendingSessions as any,
      );

      const result = await controller.getPendingApprovals({ user: mockUser } as any);

      expect(result).toEqual(pendingSessions);
      expect(approvalWorkflowService.getPendingApprovals).toHaveBeenCalledWith(mockUser);
    });

    it('should return empty array for users without approval rights', async () => {
      jest.spyOn(approvalWorkflowService, 'getPendingApprovals').mockResolvedValue([]);

      const result = await controller.getPendingApprovals({ user: mockUser } as any);

      expect(result).toEqual([]);
    });
  });

  describe('POST /signatures/approval/delegate', () => {
    it('should delegate approval', async () => {
      const delegateDto = {
        sessionId: 'session-1',
        delegateToUserId: 'user-2',
        reason: 'On vacation',
      };

      jest.spyOn(approvalWorkflowService, 'delegateApproval').mockResolvedValue();

      await controller.delegateApproval(delegateDto, { user: mockUser } as any);

      expect(approvalWorkflowService.delegateApproval).toHaveBeenCalledWith(
        'session-1',
        mockUser.id,
        'user-2',
        'On vacation',
      );
    });
  });

  describe('GET /signatures/audit/:signatureId', () => {
    it('should return signature audit trail', async () => {
      jest.spyOn(auditTrailService, 'getSignatureAuditTrail').mockResolvedValue(mockAuditTrail);

      const result = await controller.getSignatureAuditTrail('sig-1');

      expect(result).toEqual(mockAuditTrail);
      expect(auditTrailService.getSignatureAuditTrail).toHaveBeenCalledWith('sig-1');
    });
  });

  describe('GET /signatures/audit/session/:sessionId', () => {
    it('should return session audit trail', async () => {
      jest.spyOn(auditTrailService, 'getSessionAuditTrail').mockResolvedValue(mockAuditTrail);

      const result = await controller.getSessionAuditTrail('session-1');

      expect(result).toEqual(mockAuditTrail);
      expect(auditTrailService.getSessionAuditTrail).toHaveBeenCalledWith('session-1');
    });
  });

  describe('GET /signatures/audit/report/:sessionId', () => {
    it('should generate audit report', async () => {
      const auditReport = {
        sessionId: 'session-1',
        totalEvents: 5,
        signatureEvents: 3,
        approvalEvents: 2,
        uniqueUsers: 3,
        timeline: mockAuditTrail,
        summary: 'Session completed with all required signatures',
      };

      jest.spyOn(auditTrailService, 'generateAuditReport').mockResolvedValue(auditReport);

      const result = await controller.generateAuditReport('session-1');

      expect(result).toEqual(auditReport);
      expect(auditTrailService.generateAuditReport).toHaveBeenCalledWith('session-1');
    });
  });

  describe('POST /signatures/audit/search/:sessionId', () => {
    it('should search audit events', async () => {
      const searchCriteria = {
        userId: 'user-1',
        action: 'signature_created',
        startDate: new Date('2025-07-19'),
        endDate: new Date('2025-07-20'),
      };

      jest.spyOn(auditTrailService, 'searchAuditEvents').mockResolvedValue(mockAuditTrail);

      const result = await controller.searchAuditEvents('session-1', searchCriteria);

      expect(result).toEqual(mockAuditTrail);
      expect(auditTrailService.searchAuditEvents).toHaveBeenCalledWith('session-1', searchCriteria);
    });
  });

  describe('GET /signatures/statistics', () => {
    it('should return signature statistics', async () => {
      const statistics = {
        totalSignatures: 100,
        signaturesByRole: {
          teacher: 40,
          observer: 35,
          supervisor: 25,
        },
        signaturesByMonth: {
          '2025-01': 20,
          '2025-02': 25,
        },
        verificationRate: 0.95,
        averageCompletionTime: 2.5,
      };

      jest.spyOn(signaturesService, 'getSignatureStatistics').mockResolvedValue(statistics);

      const result = await controller.getSignatureStatistics();

      expect(result).toEqual(statistics);
      expect(signaturesService.getSignatureStatistics).toHaveBeenCalled();
    });
  });

  describe('POST /signatures/verify', () => {
    it('should verify signature', async () => {
      const verificationDto: SignatureVerificationDto = {
        signatureId: 'sig-1',
        verificationMethod: 'visual_comparison',
        verificationResult: 'verified',
        verifierComments: 'Signature matches records',
      };

      const verificationResult = {
        signatureId: 'sig-1',
        verified: true,
        verifiedBy: mockUser.id,
        verifiedAt: new Date(),
        method: 'visual_comparison',
      };

      jest.spyOn(signaturesService, 'verifySignature').mockResolvedValue(verificationResult);

      const result = await controller.verifySignature(verificationDto, { user: mockUser } as any);

      expect(result).toEqual(verificationResult);
      expect(signaturesService.verifySignature).toHaveBeenCalledWith(verificationDto, mockUser);
    });

    it('should handle verification rejection', async () => {
      const verificationDto: SignatureVerificationDto = {
        signatureId: 'sig-1',
        verificationMethod: 'visual_comparison',
        verificationResult: 'rejected',
        verifierComments: 'Signature does not match',
      };

      const verificationResult = {
        signatureId: 'sig-1',
        verified: false,
        verifiedBy: mockUser.id,
        verifiedAt: new Date(),
        method: 'visual_comparison',
        reason: 'Signature does not match',
      };

      jest.spyOn(signaturesService, 'verifySignature').mockResolvedValue(verificationResult);

      const result = await controller.verifySignature(verificationDto, { user: mockUser } as any);

      expect(result.verified).toBe(false);
      expect(result.reason).toBe('Signature does not match');
    });
  });
});