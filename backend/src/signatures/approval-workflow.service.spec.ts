import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ApprovalWorkflowService } from './approval-workflow.service';
import { ObservationSession, SessionStatus } from '../entities/observation-session.entity';
import { User, UserRole } from '../entities/user.entity';
import { RoleHierarchyAccess } from '../entities/role-hierarchy-access.entity';
import { SignaturesService } from './signatures.service';
import { AuditTrailService } from './audit-trail.service';
import { ApprovalRequestDto, ApprovalAction } from './dto/approval-request.dto';

describe('ApprovalWorkflowService', () => {
  let service: ApprovalWorkflowService;
  let sessionRepository: Repository<ObservationSession>;
  let userRepository: Repository<User>;
  let roleHierarchyRepository: Repository<RoleHierarchyAccess>;
  let signaturesService: SignaturesService;
  let auditTrailService: AuditTrailService;

  const mockUser = {
    id: 'user-1',
    username: 'teacher1',
    fullName: 'Test Teacher',
    role: UserRole.TEACHER,
  };

  const mockSupervisor = {
    id: 'supervisor-1',
    username: 'supervisor1',
    fullName: 'Test Supervisor',
    role: UserRole.DIRECTOR,
  };

  const mockAdmin = {
    id: 'admin-1',
    username: 'admin1',
    fullName: 'Test Admin',
    role: UserRole.ADMINISTRATOR,
  };

  const mockSession = {
    id: 'session-1',
    observerId: 'user-1',
    teacherName: 'Test Teacher',
    observerName: 'Test Observer',
    status: SessionStatus.COMPLETED,
    observer: mockUser,
    signatures: [],
  };

  const mockSessionWithSignatures = {
    ...mockSession,
    signatures: [
      {
        role: 'teacher',
        signerName: 'Test Teacher',
        signedDate: new Date('2025-07-19'),
      },
      {
        role: 'observer',
        signerName: 'Test Observer',
        signedDate: new Date('2025-07-19'),
      },
    ],
  };

  const mockRoleHierarchy = {
    role: UserRole.DIRECTOR,
    canApproveMissions: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalWorkflowService,
        {
          provide: getRepositoryToken(ObservationSession),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RoleHierarchyAccess),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: SignaturesService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: AuditTrailService,
          useValue: {
            logApprovalEvent: jest.fn(),
            getApprovalHistory: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ApprovalWorkflowService>(ApprovalWorkflowService);
    sessionRepository = module.get<Repository<ObservationSession>>(
      getRepositoryToken(ObservationSession),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    roleHierarchyRepository = module.get<Repository<RoleHierarchyAccess>>(
      getRepositoryToken(RoleHierarchyAccess),
    );
    signaturesService = module.get<SignaturesService>(SignaturesService);
    auditTrailService = module.get<AuditTrailService>(AuditTrailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getApprovalWorkflow', () => {
    it('should return approval workflow for a session', async () => {
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(mockSession as ObservationSession);

      const result = await service.getApprovalWorkflow('session-1');

      expect(result).toBeDefined();
      expect(result.sessionId).toBe('session-1');
      expect(result.steps).toHaveLength(2); // Basic steps + supervisor approval
      expect(result.isCompleted).toBe(false);
      expect(result.currentStep).toBe(1);
    });

    it('should show completed workflow when all signatures are present', async () => {
      const completedSession = {
        ...mockSessionWithSignatures,
        signatures: [
          ...mockSessionWithSignatures.signatures,
          {
            role: 'director',
            signerName: 'Test Director',
            signedDate: new Date('2025-07-20'),
          },
        ],
      };

      jest
        .spyOn(sessionRepository, 'findOne')
        .mockResolvedValue(completedSession as ObservationSession);

      const result = await service.getApprovalWorkflow('session-1');

      expect(result.isCompleted).toBe(true);
      expect(result.steps[0].isCompleted).toBe(true);
      expect(result.steps[1].isCompleted).toBe(true);
    });

    it('should throw NotFoundException for non-existent session', async () => {
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getApprovalWorkflow('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should show partial completion correctly', async () => {
      jest
        .spyOn(sessionRepository, 'findOne')
        .mockResolvedValue(mockSessionWithSignatures as ObservationSession);

      const result = await service.getApprovalWorkflow('session-1');

      expect(result.steps[0].isCompleted).toBe(true); // Teacher and observer signed
      expect(result.steps[1].isCompleted).toBe(false); // Supervisor not signed
      expect(result.currentStep).toBe(2);
      expect(result.nextApprovers).toContain('Director');
    });
  });

  describe('processApproval', () => {
    it('should process approval action successfully', async () => {
      const approvalDto: ApprovalRequestDto = {
        sessionId: 'session-1',
        action: ApprovalAction.APPROVE,
        comments: 'Approved',
        signatureData: 'data:image/png;base64,signature',
      };

      jest
        .spyOn(sessionRepository, 'findOne')
        .mockResolvedValueOnce(mockSessionWithSignatures as ObservationSession)
        .mockResolvedValueOnce(mockSessionWithSignatures as ObservationSession);
      jest.spyOn(service, 'getApprovalWorkflow').mockResolvedValue({
        sessionId: 'session-1',
        currentStep: 2,
        totalSteps: 2,
        steps: [],
        isCompleted: false,
        canProceed: true,
        nextApprovers: ['Director'],
      } as any);
      jest.spyOn(signaturesService, 'create').mockResolvedValue({} as any);
      jest.spyOn(auditTrailService, 'logApprovalEvent').mockResolvedValue();
      jest.spyOn(sessionRepository, 'update').mockResolvedValue(undefined as any);

      const result = await service.processApproval(approvalDto, mockSupervisor as User);

      expect(signaturesService.create).toHaveBeenCalled();
      expect(auditTrailService.logApprovalEvent).toHaveBeenCalled();
    });

    it('should process rejection action', async () => {
      const approvalDto: ApprovalRequestDto = {
        sessionId: 'session-1',
        action: ApprovalAction.REJECT,
        comments: 'Needs improvements',
      };

      jest
        .spyOn(sessionRepository, 'findOne')
        .mockResolvedValueOnce(mockSessionWithSignatures as ObservationSession)
        .mockResolvedValueOnce(mockSessionWithSignatures as ObservationSession);
      jest.spyOn(service, 'getApprovalWorkflow').mockResolvedValue({
        sessionId: 'session-1',
        currentStep: 2,
        totalSteps: 2,
        steps: [],
        isCompleted: false,
        canProceed: true,
        nextApprovers: ['Director'],
      } as any);
      jest.spyOn(sessionRepository, 'update').mockResolvedValue(undefined as any);
      jest.spyOn(auditTrailService, 'logApprovalEvent').mockResolvedValue();

      await service.processApproval(approvalDto, mockSupervisor as User);

      expect(sessionRepository.update).toHaveBeenCalledWith('session-1', {
        status: SessionStatus.DRAFT,
      });
    });

    it('should process request changes action', async () => {
      const approvalDto: ApprovalRequestDto = {
        sessionId: 'session-1',
        action: ApprovalAction.REQUEST_CHANGES,
        comments: 'Please update reflection section',
      };

      jest
        .spyOn(sessionRepository, 'findOne')
        .mockResolvedValueOnce(mockSessionWithSignatures as ObservationSession)
        .mockResolvedValueOnce(mockSessionWithSignatures as ObservationSession);
      jest.spyOn(service, 'getApprovalWorkflow').mockResolvedValue({
        sessionId: 'session-1',
        currentStep: 2,
        totalSteps: 2,
        steps: [],
        isCompleted: false,
        canProceed: true,
        nextApprovers: ['Director'],
      } as any);
      jest.spyOn(sessionRepository, 'update').mockResolvedValue(undefined as any);
      jest.spyOn(auditTrailService, 'logApprovalEvent').mockResolvedValue();

      await service.processApproval(approvalDto, mockSupervisor as User);

      expect(sessionRepository.update).toHaveBeenCalledWith('session-1', {
        status: SessionStatus.IN_PROGRESS,
      });
    });

    it('should process delegate action', async () => {
      const approvalDto: ApprovalRequestDto = {
        sessionId: 'session-1',
        action: ApprovalAction.DELEGATE,
        comments: 'Delegating to another supervisor',
        delegateToUserId: 'supervisor-2',
      };

      jest
        .spyOn(sessionRepository, 'findOne')
        .mockResolvedValueOnce(mockSessionWithSignatures as ObservationSession)
        .mockResolvedValueOnce(mockSessionWithSignatures as ObservationSession);
      jest.spyOn(service, 'getApprovalWorkflow').mockResolvedValue({
        sessionId: 'session-1',
        currentStep: 2,
        totalSteps: 2,
        steps: [],
        isCompleted: false,
        canProceed: true,
        nextApprovers: ['Director'],
      } as any);
      jest.spyOn(service, 'delegateApproval').mockResolvedValue();
      jest.spyOn(auditTrailService, 'logApprovalEvent').mockResolvedValue();

      await service.processApproval(approvalDto, mockSupervisor as User);

      expect(service.delegateApproval).toHaveBeenCalledWith(
        'session-1',
        mockSupervisor.id,
        'supervisor-2',
        'Delegating to another supervisor',
      );
    });

    it('should throw ForbiddenException when user cannot approve', async () => {
      const approvalDto: ApprovalRequestDto = {
        sessionId: 'session-1',
        action: ApprovalAction.APPROVE,
        comments: 'Approved',
      };

      jest
        .spyOn(sessionRepository, 'findOne')
        .mockResolvedValue(mockSessionWithSignatures as ObservationSession);
      jest.spyOn(service, 'getApprovalWorkflow').mockResolvedValue({
        sessionId: 'session-1',
        currentStep: 2,
        totalSteps: 2,
        steps: [],
        isCompleted: false,
        canProceed: true,
        nextApprovers: ['Director'],
      } as any);

      await expect(service.processApproval(approvalDto, mockUser as User)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException for invalid action', async () => {
      const approvalDto: ApprovalRequestDto = {
        sessionId: 'session-1',
        action: 'INVALID_ACTION' as any,
        comments: 'Invalid',
      };

      jest
        .spyOn(sessionRepository, 'findOne')
        .mockResolvedValue(mockSessionWithSignatures as ObservationSession);
      jest.spyOn(service, 'getApprovalWorkflow').mockResolvedValue({
        sessionId: 'session-1',
        currentStep: 2,
        totalSteps: 2,
        steps: [],
        isCompleted: false,
        canProceed: true,
        nextApprovers: ['Director'],
      } as any);

      await expect(service.processApproval(approvalDto, mockSupervisor as User)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update session to APPROVED when workflow is completed', async () => {
      const approvalDto: ApprovalRequestDto = {
        sessionId: 'session-1',
        action: ApprovalAction.APPROVE,
        comments: 'Final approval',
        signatureData: 'data:image/png;base64,signature',
      };

      jest
        .spyOn(sessionRepository, 'findOne')
        .mockResolvedValueOnce(mockSessionWithSignatures as ObservationSession)
        .mockResolvedValueOnce(mockSessionWithSignatures as ObservationSession);
      jest
        .spyOn(service, 'getApprovalWorkflow')
        .mockResolvedValueOnce({
          sessionId: 'session-1',
          currentStep: 2,
          totalSteps: 2,
          steps: [],
          isCompleted: false,
          canProceed: true,
          nextApprovers: ['Director'],
        } as any)
        .mockResolvedValueOnce({
          sessionId: 'session-1',
          currentStep: 3,
          totalSteps: 2,
          steps: [],
          isCompleted: true,
          canProceed: false,
          nextApprovers: [],
        } as any);
      jest.spyOn(signaturesService, 'create').mockResolvedValue({} as any);
      jest.spyOn(sessionRepository, 'update').mockResolvedValue(undefined as any);
      jest.spyOn(auditTrailService, 'logApprovalEvent').mockResolvedValue();

      await service.processApproval(approvalDto, mockSupervisor as User);

      expect(sessionRepository.update).toHaveBeenCalledWith('session-1', {
        status: SessionStatus.APPROVED,
      });
    });
  });

  describe('getApprovalHistory', () => {
    it('should return approval history', async () => {
      const mockHistory = [
        {
          action: 'approve',
          userId: 'user-1',
          timestamp: new Date(),
          comments: 'Approved',
        },
      ];

      jest.spyOn(auditTrailService, 'getApprovalHistory').mockResolvedValue(mockHistory);

      const result = await service.getApprovalHistory('session-1');

      expect(result).toEqual(mockHistory);
      expect(auditTrailService.getApprovalHistory).toHaveBeenCalledWith('session-1');
    });
  });

  describe('getPendingApprovals', () => {
    it('should return pending approvals for authorized user', async () => {
      jest
        .spyOn(roleHierarchyRepository, 'findOne')
        .mockResolvedValue(mockRoleHierarchy as RoleHierarchyAccess);
      jest
        .spyOn(sessionRepository, 'find')
        .mockResolvedValue([mockSessionWithSignatures as ObservationSession]);
      jest.spyOn(service, 'getApprovalWorkflow').mockResolvedValue({
        sessionId: 'session-1',
        currentStep: 2,
        totalSteps: 2,
        steps: [],
        isCompleted: false,
        canProceed: true,
        nextApprovers: ['Director'],
      } as any);

      const result = await service.getPendingApprovals(mockSupervisor as User);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('session-1');
    });

    it('should return empty array for unauthorized user', async () => {
      jest.spyOn(roleHierarchyRepository, 'findOne').mockResolvedValue(null);

      const result = await service.getPendingApprovals(mockUser as User);

      expect(result).toEqual([]);
    });

    it('should filter out completed workflows', async () => {
      jest
        .spyOn(roleHierarchyRepository, 'findOne')
        .mockResolvedValue(mockRoleHierarchy as RoleHierarchyAccess);
      jest
        .spyOn(sessionRepository, 'find')
        .mockResolvedValue([mockSessionWithSignatures as ObservationSession]);
      jest.spyOn(service, 'getApprovalWorkflow').mockResolvedValue({
        sessionId: 'session-1',
        currentStep: 3,
        totalSteps: 2,
        steps: [],
        isCompleted: true,
        canProceed: false,
        nextApprovers: [],
      } as any);

      const result = await service.getPendingApprovals(mockSupervisor as User);

      expect(result).toEqual([]);
    });
  });

  describe('delegateApproval', () => {
    it('should delegate approval successfully', async () => {
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(mockSession as ObservationSession);
      jest.spyOn(userRepository, 'findOne')
        .mockResolvedValueOnce(mockSupervisor as User)
        .mockResolvedValueOnce({ ...mockSupervisor, id: 'supervisor-2' } as User);
      jest.spyOn(auditTrailService, 'logApprovalEvent').mockResolvedValue();

      await service.delegateApproval(
        'session-1',
        'supervisor-1',
        'supervisor-2',
        'On vacation',
      );

      expect(auditTrailService.logApprovalEvent).toHaveBeenCalledWith({
        sessionId: 'session-1',
        action: 'delegate',
        userId: 'supervisor-1',
        userRole: UserRole.DIRECTOR,
        comments: 'On vacation',
        metadata: expect.stringContaining('supervisor-2'),
        timestamp: expect.any(Date),
      });
    });

    it('should throw NotFoundException when session not found', async () => {
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.delegateApproval('non-existent', 'user-1', 'user-2', 'Reason'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when users not found', async () => {
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(mockSession as ObservationSession);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.delegateApproval('session-1', 'user-1', 'user-2', 'Reason'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('workflow step validation', () => {
    it('should require supervisor approval for all sessions', async () => {
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(mockSession as ObservationSession);

      const result = await service.getApprovalWorkflow('session-1');

      const supervisorStep = result.steps.find((step) =>
        step.requiredRole.includes('Director'),
      );
      expect(supervisorStep).toBeDefined();
    });

    it('should not require higher approval by default', async () => {
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(mockSession as ObservationSession);

      const result = await service.getApprovalWorkflow('session-1');

      const higherApprovalStep = result.steps.find((step) =>
        step.requiredRole.includes('Administrator'),
      );
      expect(higherApprovalStep).toBeUndefined();
    });

    it('should handle delegation without signature data', async () => {
      const approvalDto: ApprovalRequestDto = {
        sessionId: 'session-1',
        action: ApprovalAction.DELEGATE,
        comments: 'Delegating',
        delegateToUserId: 'supervisor-2',
      };

      jest
        .spyOn(sessionRepository, 'findOne')
        .mockResolvedValueOnce(mockSessionWithSignatures as ObservationSession)
        .mockResolvedValueOnce(mockSessionWithSignatures as ObservationSession);
      jest.spyOn(service, 'getApprovalWorkflow').mockResolvedValue({
        sessionId: 'session-1',
        currentStep: 2,
        totalSteps: 2,
        steps: [],
        isCompleted: false,
        canProceed: true,
        nextApprovers: ['Director'],
      } as any);
      jest.spyOn(service, 'delegateApproval').mockResolvedValue();
      jest.spyOn(auditTrailService, 'logApprovalEvent').mockResolvedValue();

      await service.processApproval(approvalDto, mockSupervisor as User);

      expect(service.delegateApproval).toHaveBeenCalled();
    });

    it('should throw BadRequestException for delegation without delegateToUserId', async () => {
      const approvalDto: ApprovalRequestDto = {
        sessionId: 'session-1',
        action: ApprovalAction.DELEGATE,
        comments: 'Delegating',
        // Missing delegateToUserId
      };

      jest
        .spyOn(sessionRepository, 'findOne')
        .mockResolvedValueOnce(mockSessionWithSignatures as ObservationSession)
        .mockResolvedValueOnce(mockSessionWithSignatures as ObservationSession);
      jest.spyOn(service, 'getApprovalWorkflow').mockResolvedValue({
        sessionId: 'session-1',
        currentStep: 2,
        totalSteps: 2,
        steps: [],
        isCompleted: false,
        canProceed: true,
        nextApprovers: ['Director'],
      } as any);

      await expect(service.processApproval(approvalDto, mockSupervisor as User)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});