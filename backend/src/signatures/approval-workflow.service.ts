import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObservationSession, SessionStatus } from '../entities/observation-session.entity';
import { User } from '../entities/user.entity';
import { RoleHierarchyAccess } from '../entities/role-hierarchy-access.entity';
import { ApprovalRequestDto, ApprovalAction } from './dto/approval-request.dto';
import { SignaturesService } from './signatures.service';
import { AuditTrailService } from './audit-trail.service';

export interface ApprovalStep {
  stepNumber: number;
  requiredRole: string[];
  description: string;
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: Date;
  comments?: string;
}

export interface ApprovalWorkflow {
  sessionId: string;
  currentStep: number;
  totalSteps: number;
  steps: ApprovalStep[];
  isCompleted: boolean;
  canProceed: boolean;
  nextApprovers: string[];
}

@Injectable()
export class ApprovalWorkflowService {
  constructor(
    @InjectRepository(ObservationSession)
    private sessionRepository: Repository<ObservationSession>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RoleHierarchyAccess)
    private roleHierarchyRepository: Repository<RoleHierarchyAccess>,
    private signaturesService: SignaturesService,
    private auditTrailService: AuditTrailService,
  ) {}

  async getApprovalWorkflow(sessionId: string): Promise<ApprovalWorkflow> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['signatures', 'observer'],
    });

    if (!session) {
      throw new NotFoundException(`Session with ID '${sessionId}' not found`);
    }

    // Define approval steps based on session characteristics
    const steps = await this.defineApprovalSteps(session);

    // Check completion status of each step
    const completedSteps = await this.checkStepCompletion(session, steps);

    const currentStep = completedSteps.findIndex((step) => !step.isCompleted) + 1;
    const isCompleted = completedSteps.every((step) => step.isCompleted);
    const canProceed = currentStep <= completedSteps.length;

    // Get next approvers
    const nextApprovers = isCompleted ? [] : await this.getNextApprovers(session, currentStep);

    return {
      sessionId,
      currentStep: Math.max(1, currentStep),
      totalSteps: steps.length,
      steps: completedSteps,
      isCompleted,
      canProceed,
      nextApprovers,
    };
  }

  async processApproval(
    approvalDto: ApprovalRequestDto,
    currentUser: User,
  ): Promise<ObservationSession> {
    const session = await this.sessionRepository.findOne({
      where: { id: approvalDto.sessionId },
      relations: ['signatures', 'observer'],
    });

    if (!session) {
      throw new NotFoundException(`Session with ID '${approvalDto.sessionId}' not found`);
    }

    // Check if user can approve this session
    const canApprove = await this.canUserApprove(session, currentUser);
    if (!canApprove) {
      throw new ForbiddenException('You are not authorized to approve this session');
    }

    // Get current workflow state
    const workflow = await this.getApprovalWorkflow(approvalDto.sessionId);

    // Process the approval action
    switch (approvalDto.action) {
      case ApprovalAction.APPROVE:
        await this.processApprovalAction(session, currentUser, approvalDto);
        break;

      case ApprovalAction.REJECT:
        await this.processRejectionAction(session, currentUser, approvalDto);
        break;

      case ApprovalAction.REQUEST_CHANGES:
        await this.processRequestChangesAction(session, currentUser, approvalDto);
        break;

      case ApprovalAction.DELEGATE:
        await this.processDelegateAction(session, currentUser, approvalDto);
        break;

      default:
        throw new BadRequestException(`Invalid approval action: ${approvalDto.action}`);
    }

    // Create audit trail entry
    await this.auditTrailService.logApprovalEvent({
      sessionId: approvalDto.sessionId,
      action: approvalDto.action,
      userId: currentUser.id,
      userRole: currentUser.role,
      comments: approvalDto.comments,
      metadata: JSON.stringify({
        workflowStep: workflow.currentStep,
        delegateToUserId: approvalDto.delegateToUserId,
      }),
      timestamp: new Date(),
    });

    return this.sessionRepository.findOne({
      where: { id: approvalDto.sessionId },
      relations: ['signatures', 'observer'],
    });
  }

  async getApprovalHistory(sessionId: string): Promise<any[]> {
    return this.auditTrailService.getApprovalHistory(sessionId);
  }

  async getPendingApprovals(currentUser: User): Promise<ObservationSession[]> {
    // Get sessions that require approval from the current user's role
    const userRoleHierarchy = await this.roleHierarchyRepository.findOne({
      where: { role: currentUser.role },
    });

    if (!userRoleHierarchy || !userRoleHierarchy.canApproveMissions) {
      return [];
    }

    // Find sessions that are completed but not yet approved
    const sessions = await this.sessionRepository.find({
      where: { status: SessionStatus.COMPLETED },
      relations: ['signatures', 'observer'],
    });

    // Filter sessions that need approval from this user's role level
    const pendingSessions: ObservationSession[] = [];

    for (const session of sessions) {
      const workflow = await this.getApprovalWorkflow(session.id);
      if (!workflow.isCompleted && workflow.nextApprovers.includes(currentUser.role)) {
        pendingSessions.push(session);
      }
    }

    return pendingSessions;
  }

  async delegateApproval(
    sessionId: string,
    fromUserId: string,
    toUserId: string,
    reason: string,
  ): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID '${sessionId}' not found`);
    }

    const fromUser = await this.userRepository.findOne({ where: { id: fromUserId } });
    const toUser = await this.userRepository.findOne({ where: { id: toUserId } });

    if (!fromUser || !toUser) {
      throw new NotFoundException('User not found for delegation');
    }

    // Create audit trail entry for delegation
    await this.auditTrailService.logApprovalEvent({
      sessionId,
      action: 'delegate',
      userId: fromUserId,
      userRole: fromUser.role,
      comments: reason,
      metadata: JSON.stringify({
        delegatedTo: toUserId,
        delegatedToRole: toUser.role,
      }),
      timestamp: new Date(),
    });
  }

  private async defineApprovalSteps(session: ObservationSession): Promise<ApprovalStep[]> {
    const steps: ApprovalStep[] = [];

    // Step 1: Teacher and Observer signatures
    steps.push({
      stepNumber: 1,
      requiredRole: ['teacher', 'observer'],
      description: 'Teacher and Observer signatures required',
      isCompleted: false,
    });

    // Step 2: Supervisor approval (if required)
    if (this.requiresSupervisorApproval(session)) {
      steps.push({
        stepNumber: 2,
        requiredRole: ['Director', 'Cluster'],
        description: 'Supervisor approval required',
        isCompleted: false,
      });
    }

    // Step 3: Higher level approval (for special cases)
    if (this.requiresHigherApproval(session)) {
      steps.push({
        stepNumber: 3,
        requiredRole: ['Provincial', 'Zone', 'Administrator'],
        description: 'Higher level approval required',
        isCompleted: false,
      });
    }

    return steps;
  }

  private async checkStepCompletion(
    session: ObservationSession,
    steps: ApprovalStep[],
  ): Promise<ApprovalStep[]> {
    const signatures = session.signatures || [];

    return steps.map((step) => {
      let isCompleted = false;
      let completedBy: string | undefined;
      let completedAt: Date | undefined;

      if (step.stepNumber === 1) {
        // Check if both teacher and observer have signed
        const teacherSigned = signatures.some((sig) => sig.role === 'teacher');
        const observerSigned = signatures.some((sig) => sig.role === 'observer');
        isCompleted = teacherSigned && observerSigned;

        if (isCompleted) {
          const lastSignature = signatures
            .filter((sig) => ['teacher', 'observer'].includes(sig.role))
            .sort((a, b) => b.signedDate.getTime() - a.signedDate.getTime())[0];
          completedBy = lastSignature?.signerName;
          completedAt = lastSignature?.signedDate;
        }
      } else {
        // Check supervisor/higher level signatures
        const requiredSignature = signatures.find((sig) => step.requiredRole.includes(sig.role));
        isCompleted = !!requiredSignature;
        completedBy = requiredSignature?.signerName;
        completedAt = requiredSignature?.signedDate;
      }

      return {
        ...step,
        isCompleted,
        completedBy,
        completedAt,
      };
    });
  }

  private async getNextApprovers(
    session: ObservationSession,
    currentStep: number,
  ): Promise<string[]> {
    const workflow = await this.getApprovalWorkflow(session.id);

    if (currentStep > workflow.totalSteps) {
      return [];
    }

    const currentStepInfo = workflow.steps[currentStep - 1];
    return currentStepInfo ? currentStepInfo.requiredRole : [];
  }

  private async canUserApprove(session: ObservationSession, user: User): Promise<boolean> {
    const workflow = await this.getApprovalWorkflow(session.id);

    if (workflow.isCompleted) {
      return false;
    }

    return workflow.nextApprovers.includes(user.role);
  }

  private async processApprovalAction(
    session: ObservationSession,
    user: User,
    approvalDto: ApprovalRequestDto,
  ): Promise<void> {
    // Create signature for approval
    if (approvalDto.signatureData) {
      await this.signaturesService.create(
        {
          sessionId: session.id,
          role: user.role.toLowerCase(),
          signerName: user.fullName,
          signedDate: new Date().toISOString().split('T')[0],
          signatureData: approvalDto.signatureData,
          signatureMethod: 'digital_approval',
        },
        user,
      );
    }

    // Check if all approvals are complete
    const workflow = await this.getApprovalWorkflow(session.id);
    if (workflow.isCompleted) {
      await this.sessionRepository.update(session.id, {
        status: SessionStatus.APPROVED,
      });
    }
  }

  private async processRejectionAction(
    session: ObservationSession,
    user: User,
    approvalDto: ApprovalRequestDto,
  ): Promise<void> {
    // Return session to draft status for corrections
    await this.sessionRepository.update(session.id, {
      status: SessionStatus.DRAFT,
    });
  }

  private async processRequestChangesAction(
    session: ObservationSession,
    user: User,
    approvalDto: ApprovalRequestDto,
  ): Promise<void> {
    // Return session to in-progress status for modifications
    await this.sessionRepository.update(session.id, {
      status: SessionStatus.IN_PROGRESS,
    });
  }

  private async processDelegateAction(
    session: ObservationSession,
    user: User,
    approvalDto: ApprovalRequestDto,
  ): Promise<void> {
    if (!approvalDto.delegateToUserId) {
      throw new BadRequestException('Delegate user ID is required for delegation');
    }

    await this.delegateApproval(
      session.id,
      user.id,
      approvalDto.delegateToUserId,
      approvalDto.comments || 'Approval delegated',
    );
  }

  private requiresSupervisorApproval(session: ObservationSession): boolean {
    // Define conditions that require supervisor approval
    // For example: new teachers, poor performance, etc.
    return true; // For now, all sessions require supervisor approval
  }

  private requiresHigherApproval(session: ObservationSession): boolean {
    // Define conditions that require higher level approval
    // For example: serious issues, policy violations, etc.
    return false; // Most sessions don't require higher approval
  }
}
