import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { ObservationSession, SessionStatus } from '../entities/observation-session.entity';
import { ObservationForm } from '../entities/observation-form.entity';
import { User } from '../entities/user.entity';
import { CreateObservationSessionDto } from './dto/create-observation-session.dto';
import { UpdateObservationSessionDto } from './dto/update-observation-session.dto';
import { SessionFilterDto } from './dto/session-filter.dto';
import { IndicatorResponsesService } from './indicator-responses.service';

export interface PaginatedSessions {
  sessions: ObservationSession[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class ObservationSessionsService {
  constructor(
    @InjectRepository(ObservationSession)
    private sessionRepository: Repository<ObservationSession>,
    @InjectRepository(ObservationForm)
    private formRepository: Repository<ObservationForm>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private indicatorResponsesService: IndicatorResponsesService,
  ) {}

  async create(
    createSessionDto: CreateObservationSessionDto,
    currentUser: User,
  ): Promise<ObservationSession> {
    // Validate that the form exists
    const form = await this.formRepository.findOne({
      where: { id: createSessionDto.formId },
    });

    if (!form) {
      throw new NotFoundException(
        `Observation form with ID '${createSessionDto.formId}' not found`,
      );
    }

    // Validate that the form matches the subject and grade
    if (form.subject !== createSessionDto.subject) {
      throw new BadRequestException(
        `Form subject '${form.subject}' does not match session subject '${createSessionDto.subject}'`,
      );
    }

    if (!form.gradeRange.includes(createSessionDto.grade)) {
      throw new BadRequestException(
        `Form grade range '${form.gradeRange}' does not include session grade '${createSessionDto.grade}'`,
      );
    }

    // Create the session
    const session = this.sessionRepository.create({
      formId: createSessionDto.formId,
      observerId: currentUser.id,
      schoolName: createSessionDto.schoolName,
      teacherName: createSessionDto.teacherName,
      observerName: createSessionDto.observerName,
      subject: createSessionDto.subject,
      grade: createSessionDto.grade,
      dateObserved: new Date(createSessionDto.dateObserved),
      startTime: createSessionDto.startTime,
      endTime: createSessionDto.endTime,
      classificationLevel: createSessionDto.classificationLevel,
      reflectionSummary: createSessionDto.reflectionSummary,
      status: SessionStatus.DRAFT,
    });

    const savedSession = await this.sessionRepository.save(session);

    // Create indicator responses if provided
    if (createSessionDto.indicatorResponses?.length) {
      await this.indicatorResponsesService.createMultiple(
        savedSession.id,
        createSessionDto.indicatorResponses,
      );
    }

    // Create reflection comments if provided
    if (createSessionDto.reflectionComments?.length) {
      await this.createReflectionComments(savedSession.id, createSessionDto.reflectionComments);
    }

    return this.findOne(savedSession.id, currentUser);
  }

  async findAll(filterDto: SessionFilterDto, currentUser: User): Promise<PaginatedSessions> {
    const queryBuilder = this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.form', 'form')
      .leftJoinAndSelect('session.observer', 'observer')
      .leftJoinAndSelect('session.indicatorResponses', 'responses')
      .leftJoinAndSelect('session.reflectionComments', 'comments')
      .orderBy('session.dateObserved', 'DESC')
      .addOrderBy('session.createdAt', 'DESC');

    // Apply role-based filtering
    await this.applyRoleBasedFiltering(queryBuilder, currentUser);

    // Apply filters
    if (filterDto.observerId) {
      queryBuilder.andWhere('session.observerId = :observerId', {
        observerId: filterDto.observerId,
      });
    }

    if (filterDto.schoolName) {
      queryBuilder.andWhere('session.schoolName ILIKE :schoolName', {
        schoolName: `%${filterDto.schoolName}%`,
      });
    }

    if (filterDto.teacherName) {
      queryBuilder.andWhere('session.teacherName ILIKE :teacherName', {
        teacherName: `%${filterDto.teacherName}%`,
      });
    }

    if (filterDto.subject) {
      queryBuilder.andWhere('session.subject = :subject', { subject: filterDto.subject });
    }

    if (filterDto.grade) {
      queryBuilder.andWhere('session.grade = :grade', { grade: filterDto.grade });
    }

    if (filterDto.status) {
      queryBuilder.andWhere('session.status = :status', { status: filterDto.status });
    }

    if (filterDto.dateFrom && filterDto.dateTo) {
      queryBuilder.andWhere('session.dateObserved BETWEEN :dateFrom AND :dateTo', {
        dateFrom: filterDto.dateFrom,
        dateTo: filterDto.dateTo,
      });
    } else if (filterDto.dateFrom) {
      queryBuilder.andWhere('session.dateObserved >= :dateFrom', { dateFrom: filterDto.dateFrom });
    } else if (filterDto.dateTo) {
      queryBuilder.andWhere('session.dateObserved <= :dateTo', { dateTo: filterDto.dateTo });
    }

    if (filterDto.search) {
      queryBuilder.andWhere(
        '(session.teacherName ILIKE :search OR session.schoolName ILIKE :search)',
        { search: `%${filterDto.search}%` },
      );
    }

    // Pagination
    const page = filterDto.page || 1;
    const limit = filterDto.limit || 10;
    const skip = (page - 1) * limit;

    const [sessions, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return {
      sessions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, currentUser: User): Promise<ObservationSession> {
    const session = await this.sessionRepository.findOne({
      where: { id },
      relations: [
        'form',
        'form.lessonPhases',
        'form.lessonPhases.indicators',
        'form.lessonPhases.indicators.scales',
        'form.competencyDomains',
        'form.competencyDomains.indicators',
        'form.competencyDomains.indicators.scales',
        'observer',
        'indicatorResponses',
        'indicatorResponses.indicator',
        'reflectionComments',
      ],
    });

    if (!session) {
      throw new NotFoundException(`Observation session with ID '${id}' not found`);
    }

    // Check if user can access this session
    const canAccess = await this.canAccessSession(session, currentUser);
    if (!canAccess) {
      throw new ForbiddenException('Access denied to this observation session');
    }

    return session;
  }

  async update(
    id: string,
    updateSessionDto: UpdateObservationSessionDto,
    currentUser: User,
  ): Promise<ObservationSession> {
    const session = await this.findOne(id, currentUser);

    // Check if user can edit this session
    const canEdit = await this.canEditSession(session, currentUser);
    if (!canEdit) {
      throw new ForbiddenException('You cannot edit this observation session');
    }

    // Validate status transitions
    if (updateSessionDto.status) {
      this.validateStatusTransition(session.status, updateSessionDto.status);
    }

    // Update basic session properties
    await this.sessionRepository.update(id, {
      schoolName: updateSessionDto.schoolName,
      teacherName: updateSessionDto.teacherName,
      observerName: updateSessionDto.observerName,
      subject: updateSessionDto.subject,
      grade: updateSessionDto.grade,
      dateObserved: updateSessionDto.dateObserved
        ? new Date(updateSessionDto.dateObserved)
        : undefined,
      startTime: updateSessionDto.startTime,
      endTime: updateSessionDto.endTime,
      classificationLevel: updateSessionDto.classificationLevel,
      reflectionSummary: updateSessionDto.reflectionSummary,
      status: updateSessionDto.status,
    });

    // Update indicator responses if provided
    if (updateSessionDto.indicatorResponses) {
      await this.indicatorResponsesService.updateMultiple(id, updateSessionDto.indicatorResponses);
    }

    // Update reflection comments if provided
    if (updateSessionDto.reflectionComments) {
      await this.updateReflectionComments(id, updateSessionDto.reflectionComments);
    }

    return this.findOne(id, currentUser);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const session = await this.findOne(id, currentUser);

    // Check if user can delete this session
    const canDelete = await this.canDeleteSession(session, currentUser);
    if (!canDelete) {
      throw new ForbiddenException('You cannot delete this observation session');
    }

    // Only allow deletion of draft sessions
    if (session.status !== SessionStatus.DRAFT) {
      throw new BadRequestException('Only draft sessions can be deleted');
    }

    await this.sessionRepository.remove(session);
  }

  async updateStatus(
    id: string,
    status: SessionStatus,
    currentUser: User,
  ): Promise<ObservationSession> {
    const session = await this.findOne(id, currentUser);

    // Validate status transition
    this.validateStatusTransition(session.status, status);

    // Additional validation for completing sessions
    if (status === SessionStatus.COMPLETED) {
      await this.validateSessionCompletion(session);
    }

    await this.sessionRepository.update(id, { status });
    return this.findOne(id, currentUser);
  }

  async autoSave(
    id: string,
    updateData: Partial<UpdateObservationSessionDto>,
    currentUser: User,
  ): Promise<void> {
    const session = await this.findOne(id, currentUser);

    // Check if user can edit this session
    const canEdit = await this.canEditSession(session, currentUser);
    if (!canEdit) {
      throw new ForbiddenException('You cannot edit this observation session');
    }

    // Only auto-save for draft and in-progress sessions
    if (session.status !== SessionStatus.DRAFT && session.status !== SessionStatus.IN_PROGRESS) {
      throw new BadRequestException('Cannot auto-save completed or approved sessions');
    }

    // Update only provided fields
    const updateFields: any = {};
    if (updateData.reflectionSummary !== undefined)
      updateFields.reflectionSummary = updateData.reflectionSummary;
    if (updateData.schoolName !== undefined) updateFields.schoolName = updateData.schoolName;
    if (updateData.teacherName !== undefined) updateFields.teacherName = updateData.teacherName;
    if (updateData.observerName !== undefined) updateFields.observerName = updateData.observerName;

    if (Object.keys(updateFields).length > 0) {
      await this.sessionRepository.update(id, updateFields);
    }

    // Auto-save indicator responses if provided
    if (updateData.indicatorResponses) {
      await this.indicatorResponsesService.updateMultiple(id, updateData.indicatorResponses);
    }

    // Auto-save reflection comments if provided
    if (updateData.reflectionComments) {
      await this.updateReflectionComments(id, updateData.reflectionComments);
    }
  }

  async getSessionStatistics(currentUser: User): Promise<any> {
    const queryBuilder = this.sessionRepository.createQueryBuilder('session');
    await this.applyRoleBasedFiltering(queryBuilder, currentUser);

    const [totalSessions, draftSessions, inProgressSessions, completedSessions] = await Promise.all(
      [
        queryBuilder.getCount(),
        queryBuilder
          .clone()
          .andWhere('session.status = :status', { status: SessionStatus.DRAFT })
          .getCount(),
        queryBuilder
          .clone()
          .andWhere('session.status = :status', { status: SessionStatus.IN_PROGRESS })
          .getCount(),
        queryBuilder
          .clone()
          .andWhere('session.status = :status', { status: SessionStatus.COMPLETED })
          .getCount(),
      ],
    );

    return {
      total: totalSessions,
      draft: draftSessions,
      inProgress: inProgressSessions,
      completed: completedSessions,
    };
  }

  private async applyRoleBasedFiltering(queryBuilder: any, currentUser: User): Promise<void> {
    // Administrators can see all sessions
    if (currentUser.role === 'Administrator') {
      return;
    }

    // For other roles, apply location-based filtering
    // This would be implemented based on your specific hierarchy rules
    // For now, users can see sessions they created or are in their scope
    queryBuilder.andWhere('(session.observerId = :userId OR session.observerName = :userName)', {
      userId: currentUser.id,
      userName: currentUser.fullName,
    });
  }

  private async canAccessSession(session: ObservationSession, currentUser: User): Promise<boolean> {
    // Users can access their own sessions
    if (session.observerId === currentUser.id) {
      return true;
    }

    // Administrators can access all sessions
    if (currentUser.role === 'Administrator') {
      return true;
    }

    // Add additional role-based access logic here
    return false;
  }

  private async canEditSession(session: ObservationSession, currentUser: User): Promise<boolean> {
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

  private async canDeleteSession(session: ObservationSession, currentUser: User): Promise<boolean> {
    // Only the observer or administrators can delete sessions
    if (session.observerId !== currentUser.id && currentUser.role !== 'Administrator') {
      return false;
    }

    return true;
  }

  private validateStatusTransition(currentStatus: SessionStatus, newStatus: SessionStatus): void {
    const validTransitions: Record<SessionStatus, SessionStatus[]> = {
      [SessionStatus.DRAFT]: [SessionStatus.IN_PROGRESS, SessionStatus.COMPLETED],
      [SessionStatus.IN_PROGRESS]: [SessionStatus.DRAFT, SessionStatus.COMPLETED],
      [SessionStatus.COMPLETED]: [SessionStatus.APPROVED],
      [SessionStatus.APPROVED]: [], // No transitions from approved
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'`,
      );
    }
  }

  private async validateSessionCompletion(session: ObservationSession): Promise<void> {
    // Check if all required indicators have responses
    const form = session.form;
    const allIndicators = [
      ...(form.lessonPhases?.flatMap((phase) => phase.indicators) || []),
      ...(form.competencyDomains?.flatMap((domain) => domain.indicators) || []),
    ];

    const responseIndicatorIds = session.indicatorResponses?.map((r) => r.indicatorId) || [];
    const missingIndicators = allIndicators.filter(
      (indicator) => indicator.isActive && !responseIndicatorIds.includes(indicator.id),
    );

    if (missingIndicators.length > 0) {
      throw new BadRequestException(
        `Cannot complete session: Missing responses for ${missingIndicators.length} indicators`,
      );
    }
  }

  private async createReflectionComments(sessionId: string, comments: any[]): Promise<void> {
    // This would be implemented to create reflection comments
    // For now, we'll skip the implementation as it's handled by the entity relationships
  }

  private async updateReflectionComments(sessionId: string, comments: any[]): Promise<void> {
    // This would be implemented to update reflection comments
    // For now, we'll skip the implementation as it's handled by the entity relationships
  }
}
