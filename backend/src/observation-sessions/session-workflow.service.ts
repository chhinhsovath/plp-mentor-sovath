import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObservationSession, SessionStatus } from '../entities/observation-session.entity';
import { User } from '../entities/user.entity';
import { IndicatorResponsesService } from './indicator-responses.service';

export interface WorkflowTransition {
  from: SessionStatus;
  to: SessionStatus;
  requiredRole?: string[];
  validationRequired?: boolean;
  description: string;
}

export interface SessionWorkflowState {
  currentStatus: SessionStatus;
  availableTransitions: WorkflowTransition[];
  canEdit: boolean;
  canDelete: boolean;
  validationErrors: string[];
}

@Injectable()
export class SessionWorkflowService {
  private readonly workflowTransitions: WorkflowTransition[] = [
    {
      from: SessionStatus.DRAFT,
      to: SessionStatus.IN_PROGRESS,
      description: 'Start observation session',
    },
    {
      from: SessionStatus.DRAFT,
      to: SessionStatus.COMPLETED,
      validationRequired: true,
      description: 'Complete observation session directly',
    },
    {
      from: SessionStatus.IN_PROGRESS,
      to: SessionStatus.DRAFT,
      description: 'Return to draft for editing',
    },
    {
      from: SessionStatus.IN_PROGRESS,
      to: SessionStatus.COMPLETED,
      validationRequired: true,
      description: 'Complete observation session',
    },
    {
      from: SessionStatus.COMPLETED,
      to: SessionStatus.APPROVED,
      requiredRole: ['Administrator', 'Zone', 'Provincial', 'Director'],
      description: 'Approve completed session',
    },
  ];

  constructor(
    @InjectRepository(ObservationSession)
    private sessionRepository: Repository<ObservationSession>,
    private indicatorResponsesService: IndicatorResponsesService,
  ) {}

  async getWorkflowState(sessionId: string, currentUser: User): Promise<SessionWorkflowState> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['form', 'observer'],
    });

    if (!session) {
      throw new BadRequestException('Session not found');
    }

    const currentStatus = session.status;
    const availableTransitions = this.getAvailableTransitions(currentStatus, currentUser);
    const canEdit = this.canEditSession(session, currentUser);
    const canDelete = this.canDeleteSession(session, currentUser);
    const validationErrors = await this.getValidationErrors(session);

    return {
      currentStatus,
      availableTransitions,
      canEdit,
      canDelete,
      validationErrors,
    };
  }

  async transitionStatus(
    sessionId: string,
    newStatus: SessionStatus,
    currentUser: User,
  ): Promise<ObservationSession> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['form', 'observer'],
    });

    if (!session) {
      throw new BadRequestException('Session not found');
    }

    // Check if transition is valid
    const transition = this.workflowTransitions.find(
      (t) => t.from === session.status && t.to === newStatus,
    );

    if (!transition) {
      throw new BadRequestException(
        `Invalid transition from '${session.status}' to '${newStatus}'`,
      );
    }

    // Check role requirements
    if (transition.requiredRole && !transition.requiredRole.includes(currentUser.role)) {
      throw new BadRequestException(
        `Role '${currentUser.role}' is not authorized for this transition`,
      );
    }

    // Check if user can perform this transition
    if (!this.canPerformTransition(session, currentUser, transition)) {
      throw new BadRequestException('You are not authorized to perform this transition');
    }

    // Validate session if required
    if (transition.validationRequired) {
      const validationErrors = await this.getValidationErrors(session);
      if (validationErrors.length > 0) {
        throw new BadRequestException(
          `Cannot transition to '${newStatus}': ${validationErrors.join(', ')}`,
        );
      }
    }

    // Perform the transition
    await this.sessionRepository.update(sessionId, { status: newStatus });

    // Perform any post-transition actions
    await this.performPostTransitionActions(session, newStatus, currentUser);

    return this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['form', 'observer', 'indicatorResponses', 'reflectionComments'],
    });
  }

  async validateSessionForCompletion(
    sessionId: string,
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: [
        'form',
        'form.lessonPhases',
        'form.lessonPhases.indicators',
        'form.competencyDomains',
        'form.competencyDomains.indicators',
      ],
    });

    if (!session) {
      return { isValid: false, errors: ['Session not found'] };
    }

    const errors: string[] = [];

    // Check if all required fields are filled
    if (!session.schoolName?.trim()) {
      errors.push('School name is required');
    }

    if (!session.teacherName?.trim()) {
      errors.push('Teacher name is required');
    }

    if (!session.observerName?.trim()) {
      errors.push('Observer name is required');
    }

    if (!session.dateObserved) {
      errors.push('Observation date is required');
    }

    if (!session.startTime?.trim()) {
      errors.push('Start time is required');
    }

    if (!session.endTime?.trim()) {
      errors.push('End time is required');
    }

    // Validate time range
    if (session.startTime && session.endTime) {
      const startTime = new Date(`2000-01-01 ${session.startTime}`);
      const endTime = new Date(`2000-01-01 ${session.endTime}`);

      if (endTime <= startTime) {
        errors.push('End time must be after start time');
      }
    }

    // Check indicator responses
    const progressInfo = await this.indicatorResponsesService.getSessionProgress(sessionId);
    if (progressInfo.completionPercentage < 100) {
      errors.push(
        `Incomplete indicator responses: ${progressInfo.missingIndicators.length} indicators missing (${progressInfo.completionPercentage}% complete)`,
      );
    }

    // Validate individual responses
    const responseValidation = await this.indicatorResponsesService.validateAllResponses(sessionId);
    if (!responseValidation.isValid) {
      errors.push(...responseValidation.errors);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  async getSessionProgress(sessionId: string): Promise<{
    status: SessionStatus;
    progressPercentage: number;
    completedSteps: string[];
    remainingSteps: string[];
    canProceedToNext: boolean;
  }> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new BadRequestException('Session not found');
    }

    const progressInfo = await this.indicatorResponsesService.getSessionProgress(sessionId);
    const validationResult = await this.validateSessionForCompletion(sessionId);

    const completedSteps: string[] = [];
    const remainingSteps: string[] = [];

    // Basic information
    if (session.schoolName && session.teacherName && session.observerName) {
      completedSteps.push('Basic information completed');
    } else {
      remainingSteps.push('Complete basic information');
    }

    // Observation details
    if (session.dateObserved && session.startTime && session.endTime) {
      completedSteps.push('Observation details completed');
    } else {
      remainingSteps.push('Complete observation details');
    }

    // Indicator responses
    if (progressInfo.completionPercentage === 100) {
      completedSteps.push('All indicators completed');
    } else {
      remainingSteps.push(`Complete remaining ${progressInfo.missingIndicators.length} indicators`);
    }

    // Reflection
    if (session.reflectionSummary?.trim()) {
      completedSteps.push('Reflection summary completed');
    } else {
      remainingSteps.push('Add reflection summary');
    }

    const progressPercentage = Math.round(
      (completedSteps.length / (completedSteps.length + remainingSteps.length)) * 100,
    );
    const canProceedToNext = validationResult.isValid && session.status !== SessionStatus.APPROVED;

    return {
      status: session.status,
      progressPercentage,
      completedSteps,
      remainingSteps,
      canProceedToNext,
    };
  }

  private getAvailableTransitions(
    currentStatus: SessionStatus,
    currentUser: User,
  ): WorkflowTransition[] {
    return this.workflowTransitions.filter((transition) => {
      if (transition.from !== currentStatus) {
        return false;
      }

      if (transition.requiredRole && !transition.requiredRole.includes(currentUser.role)) {
        return false;
      }

      return true;
    });
  }

  private canEditSession(session: ObservationSession, currentUser: User): boolean {
    // Only the observer can edit their own sessions
    if (session.observerId !== currentUser.id) {
      return false;
    }

    // Cannot edit completed or approved sessions
    if (session.status === SessionStatus.COMPLETED || session.status === SessionStatus.APPROVED) {
      return false;
    }

    return true;
  }

  private canDeleteSession(session: ObservationSession, currentUser: User): boolean {
    // Only the observer or administrators can delete sessions
    if (session.observerId !== currentUser.id && currentUser.role !== 'Administrator') {
      return false;
    }

    // Only draft sessions can be deleted
    return session.status === SessionStatus.DRAFT;
  }

  private canPerformTransition(
    session: ObservationSession,
    currentUser: User,
    transition: WorkflowTransition,
  ): boolean {
    // For approval transitions, check if user has approval authority
    if (transition.to === SessionStatus.APPROVED) {
      return transition.requiredRole?.includes(currentUser.role) || false;
    }

    // For other transitions, only the observer can perform them
    return session.observerId === currentUser.id;
  }

  private async getValidationErrors(session: ObservationSession): Promise<string[]> {
    const validationResult = await this.validateSessionForCompletion(session.id);
    return validationResult.errors;
  }

  private async performPostTransitionActions(
    session: ObservationSession,
    newStatus: SessionStatus,
    currentUser: User,
  ): Promise<void> {
    // Perform any actions needed after status transition
    switch (newStatus) {
      case SessionStatus.COMPLETED:
        // Could send notifications, create improvement plans, etc.
        break;
      case SessionStatus.APPROVED:
        // Could trigger reporting, archiving, etc.
        break;
      default:
        break;
    }
  }
}
