import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { ImprovementPlan } from '../entities/improvement-plan.entity';
import { ObservationSession, SessionStatus } from '../entities/observation-session.entity';
import { User } from '../entities/user.entity';
import { CreateImprovementPlanDto } from './dto/create-improvement-plan.dto';
import { UpdateImprovementPlanDto } from './dto/update-improvement-plan.dto';
import { ImprovementPlanFilterDto, PlanStatus } from './dto/improvement-plan-filter.dto';
import { ImprovementActionsService } from './improvement-actions.service';
import { FollowUpActivitiesService } from './follow-up-activities.service';
import { NotificationService } from './notification.service';

export interface PaginatedPlans {
  plans: ImprovementPlan[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PlanStatistics {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  upcomingDeadlines: number;
  upcomingFollowUps: number;
}

@Injectable()
export class ImprovementPlansService {
  constructor(
    @InjectRepository(ImprovementPlan)
    private planRepository: Repository<ImprovementPlan>,
    @InjectRepository(ObservationSession)
    private sessionRepository: Repository<ObservationSession>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private actionsService: ImprovementActionsService,
    private followUpService: FollowUpActivitiesService,
    private notificationService: NotificationService,
  ) {}

  async create(
    createPlanDto: CreateImprovementPlanDto,
    currentUser: User,
  ): Promise<ImprovementPlan> {
    // Validate that the session exists and is completed
    const session = await this.sessionRepository.findOne({
      where: { id: createPlanDto.sessionId },
      relations: ['observer'],
    });

    if (!session) {
      throw new NotFoundException(
        `Observation session with ID '${createPlanDto.sessionId}' not found`,
      );
    }

    // Check if user can create improvement plan for this session
    const canCreate = await this.canCreatePlan(session, currentUser);
    if (!canCreate) {
      throw new ForbiddenException('You cannot create an improvement plan for this session');
    }

    // Check if session is completed
    if (session.status !== SessionStatus.COMPLETED && session.status !== SessionStatus.APPROVED) {
      throw new BadRequestException('Improvement plans can only be created for completed sessions');
    }

    // Check if plan already exists for this session
    const existingPlan = await this.planRepository.findOne({
      where: { sessionId: createPlanDto.sessionId },
    });

    if (existingPlan) {
      throw new BadRequestException('An improvement plan already exists for this session');
    }

    // Create the improvement plan
    const plan = this.planRepository.create({
      sessionId: createPlanDto.sessionId,
      lessonTopic: createPlanDto.lessonTopic,
      challenges: createPlanDto.challenges,
      strengths: createPlanDto.strengths,
      notes: createPlanDto.notes,
    });

    const savedPlan = await this.planRepository.save(plan);

    // Create improvement actions if provided
    if (createPlanDto.actions?.length) {
      await this.actionsService.createMultiple(savedPlan.id, createPlanDto.actions);
    }

    // Create follow-up activities if provided
    if (createPlanDto.followUpActivities?.length) {
      await this.followUpService.createMultiple(savedPlan.id, createPlanDto.followUpActivities);
    }

    // Schedule notifications for deadlines and follow-ups
    await this.notificationService.scheduleNotifications(savedPlan.id);

    return this.findOne(savedPlan.id, currentUser);
  }

  async findAll(filterDto: ImprovementPlanFilterDto, currentUser: User): Promise<PaginatedPlans> {
    const queryBuilder = this.planRepository
      .createQueryBuilder('plan')
      .leftJoinAndSelect('plan.session', 'session')
      .leftJoinAndSelect('session.observer', 'observer')
      .leftJoinAndSelect('plan.actions', 'actions')
      .leftJoinAndSelect('plan.followUpActivities', 'followUps')
      .orderBy('plan.id', 'DESC')
      .addOrderBy('actions.deadline', 'ASC')
      .addOrderBy('followUps.followUpDate', 'ASC');

    // Apply role-based filtering
    await this.applyRoleBasedFiltering(queryBuilder, currentUser);

    // Apply filters
    if (filterDto.sessionId) {
      queryBuilder.andWhere('plan.sessionId = :sessionId', { sessionId: filterDto.sessionId });
    }

    if (filterDto.teacherName) {
      queryBuilder.andWhere('session.teacherName ILIKE :teacherName', {
        teacherName: `%${filterDto.teacherName}%`,
      });
    }

    if (filterDto.schoolName) {
      queryBuilder.andWhere('session.schoolName ILIKE :schoolName', {
        schoolName: `%${filterDto.schoolName}%`,
      });
    }

    if (filterDto.subject) {
      queryBuilder.andWhere('session.subject = :subject', { subject: filterDto.subject });
    }

    if (filterDto.responsiblePerson) {
      queryBuilder.andWhere('actions.responsiblePerson ILIKE :responsiblePerson', {
        responsiblePerson: `%${filterDto.responsiblePerson}%`,
      });
    }

    if (filterDto.deadlineFrom && filterDto.deadlineTo) {
      queryBuilder.andWhere('actions.deadline BETWEEN :deadlineFrom AND :deadlineTo', {
        deadlineFrom: filterDto.deadlineFrom,
        deadlineTo: filterDto.deadlineTo,
      });
    } else if (filterDto.deadlineFrom) {
      queryBuilder.andWhere('actions.deadline >= :deadlineFrom', {
        deadlineFrom: filterDto.deadlineFrom,
      });
    } else if (filterDto.deadlineTo) {
      queryBuilder.andWhere('actions.deadline <= :deadlineTo', {
        deadlineTo: filterDto.deadlineTo,
      });
    }

    if (filterDto.followUpFrom && filterDto.followUpTo) {
      queryBuilder.andWhere('followUps.followUpDate BETWEEN :followUpFrom AND :followUpTo', {
        followUpFrom: filterDto.followUpFrom,
        followUpTo: filterDto.followUpTo,
      });
    }

    if (filterDto.search) {
      queryBuilder.andWhere(
        '(plan.lessonTopic ILIKE :search OR plan.challenges ILIKE :search OR plan.strengths ILIKE :search)',
        { search: `%${filterDto.search}%` },
      );
    }

    if (filterDto.showOverdueOnly) {
      const today = new Date().toISOString().split('T')[0];
      queryBuilder.andWhere('actions.deadline < :today', { today });
    }

    // Pagination
    const page = filterDto.page || 1;
    const limit = filterDto.limit || 10;
    const skip = (page - 1) * limit;

    const [plans, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return {
      plans,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, currentUser: User): Promise<ImprovementPlan> {
    const plan = await this.planRepository.findOne({
      where: { id },
      relations: ['session', 'session.observer', 'session.form', 'actions', 'followUpActivities'],
      order: {
        actions: {
          deadline: 'ASC',
        },
        followUpActivities: {
          followUpDate: 'ASC',
        },
      },
    });

    if (!plan) {
      throw new NotFoundException(`Improvement plan with ID '${id}' not found`);
    }

    // Check if user can access this plan
    const canAccess = await this.canAccessPlan(plan, currentUser);
    if (!canAccess) {
      throw new ForbiddenException('Access denied to this improvement plan');
    }

    return plan;
  }

  async findBySession(sessionId: string, currentUser: User): Promise<ImprovementPlan | null> {
    const plan = await this.planRepository.findOne({
      where: { sessionId },
      relations: ['session', 'session.observer', 'actions', 'followUpActivities'],
    });

    if (!plan) {
      return null;
    }

    // Check if user can access this plan
    const canAccess = await this.canAccessPlan(plan, currentUser);
    if (!canAccess) {
      throw new ForbiddenException('Access denied to this improvement plan');
    }

    return plan;
  }

  async update(
    id: string,
    updatePlanDto: UpdateImprovementPlanDto,
    currentUser: User,
  ): Promise<ImprovementPlan> {
    const plan = await this.findOne(id, currentUser);

    // Check if user can edit this plan
    const canEdit = await this.canEditPlan(plan, currentUser);
    if (!canEdit) {
      throw new ForbiddenException('You cannot edit this improvement plan');
    }

    // Update basic plan properties
    await this.planRepository.update(id, {
      lessonTopic: updatePlanDto.lessonTopic,
      challenges: updatePlanDto.challenges,
      strengths: updatePlanDto.strengths,
      notes: updatePlanDto.notes,
    });

    // Update actions if provided
    if (updatePlanDto.actions) {
      await this.actionsService.updateMultiple(id, updatePlanDto.actions);
    }

    // Update follow-up activities if provided
    if (updatePlanDto.followUpActivities) {
      await this.followUpService.updateMultiple(id, updatePlanDto.followUpActivities);
    }

    // Reschedule notifications
    await this.notificationService.scheduleNotifications(id);

    return this.findOne(id, currentUser);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const plan = await this.findOne(id, currentUser);

    // Check if user can delete this plan
    const canDelete = await this.canDeletePlan(plan, currentUser);
    if (!canDelete) {
      throw new ForbiddenException('You cannot delete this improvement plan');
    }

    // Cancel scheduled notifications
    await this.notificationService.cancelNotifications(id);

    await this.planRepository.remove(plan);
  }

  async getStatistics(currentUser: User): Promise<PlanStatistics> {
    const queryBuilder = this.planRepository
      .createQueryBuilder('plan')
      .leftJoin('plan.session', 'session')
      .leftJoin('plan.actions', 'actions')
      .leftJoin('plan.followUpActivities', 'followUps');

    await this.applyRoleBasedFiltering(queryBuilder, currentUser);

    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const [
      totalPlans,
      pendingActions,
      completedActions,
      overdueActions,
      upcomingDeadlines,
      upcomingFollowUps,
    ] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder
        .clone()
        .andWhere('actions.deadline >= :today', { today: today.toISOString().split('T')[0] })
        .getCount(),
      queryBuilder
        .clone()
        .andWhere('actions.deadline < :today', { today: today.toISOString().split('T')[0] })
        .getCount(),
      queryBuilder
        .clone()
        .andWhere('actions.deadline < :today', { today: today.toISOString().split('T')[0] })
        .getCount(),
      queryBuilder
        .clone()
        .andWhere('actions.deadline BETWEEN :today AND :nextWeek', {
          today: today.toISOString().split('T')[0],
          nextWeek: nextWeek.toISOString().split('T')[0],
        })
        .getCount(),
      queryBuilder
        .clone()
        .andWhere('followUps.followUpDate BETWEEN :today AND :nextWeek', {
          today: today.toISOString().split('T')[0],
          nextWeek: nextWeek.toISOString().split('T')[0],
        })
        .getCount(),
    ]);

    return {
      total: totalPlans,
      pending: pendingActions,
      inProgress: Math.max(0, totalPlans - completedActions - overdueActions),
      completed: completedActions,
      overdue: overdueActions,
      upcomingDeadlines,
      upcomingFollowUps,
    };
  }

  async getUpcomingDeadlines(currentUser: User, days: number = 7): Promise<ImprovementPlan[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const queryBuilder = this.planRepository
      .createQueryBuilder('plan')
      .leftJoinAndSelect('plan.session', 'session')
      .leftJoinAndSelect('plan.actions', 'actions')
      .where('actions.deadline BETWEEN :today AND :futureDate', {
        today: today.toISOString().split('T')[0],
        futureDate: futureDate.toISOString().split('T')[0],
      })
      .orderBy('actions.deadline', 'ASC');

    await this.applyRoleBasedFiltering(queryBuilder, currentUser);

    return queryBuilder.getMany();
  }

  async getOverduePlans(currentUser: User): Promise<ImprovementPlan[]> {
    const today = new Date().toISOString().split('T')[0];

    const queryBuilder = this.planRepository
      .createQueryBuilder('plan')
      .leftJoinAndSelect('plan.session', 'session')
      .leftJoinAndSelect('plan.actions', 'actions')
      .where('actions.deadline < :today', { today })
      .orderBy('actions.deadline', 'ASC');

    await this.applyRoleBasedFiltering(queryBuilder, currentUser);

    return queryBuilder.getMany();
  }

  async markActionCompleted(planId: string, actionId: string, currentUser: User): Promise<void> {
    const plan = await this.findOne(planId, currentUser);

    const canEdit = await this.canEditPlan(plan, currentUser);
    if (!canEdit) {
      throw new ForbiddenException('You cannot update this improvement plan');
    }

    await this.actionsService.markCompleted(actionId);
  }

  async addFollowUpNote(
    planId: string,
    followUpId: string,
    note: string,
    currentUser: User,
  ): Promise<void> {
    const plan = await this.findOne(planId, currentUser);

    const canEdit = await this.canEditPlan(plan, currentUser);
    if (!canEdit) {
      throw new ForbiddenException('You cannot update this improvement plan');
    }

    await this.followUpService.addNote(followUpId, note);
  }

  private async applyRoleBasedFiltering(queryBuilder: any, currentUser: User): Promise<void> {
    // Administrators can see all plans
    if (currentUser.role === 'Administrator') {
      return;
    }

    // For other roles, apply location-based filtering
    // Users can see plans for sessions they observed or are in their scope
    queryBuilder.andWhere('(session.observerId = :userId OR session.observerName = :userName)', {
      userId: currentUser.id,
      userName: currentUser.fullName,
    });
  }

  private async canCreatePlan(session: ObservationSession, currentUser: User): Promise<boolean> {
    // Observer can create plans for their own sessions
    if (session.observerId === currentUser.id) {
      return true;
    }

    // Supervisors can create plans for sessions in their scope
    if (['Administrator', 'Zone', 'Provincial', 'Director'].includes(currentUser.role)) {
      return true;
    }

    return false;
  }

  private async canAccessPlan(plan: ImprovementPlan, currentUser: User): Promise<boolean> {
    // Observer can access plans for their own sessions
    if (plan.session.observerId === currentUser.id) {
      return true;
    }

    // Administrators can access all plans
    if (currentUser.role === 'Administrator') {
      return true;
    }

    // Add additional role-based access logic here
    return false;
  }

  private async canEditPlan(plan: ImprovementPlan, currentUser: User): Promise<boolean> {
    // Observer can edit plans for their own sessions
    if (plan.session.observerId === currentUser.id) {
      return true;
    }

    // Supervisors can edit plans in their scope
    if (['Administrator', 'Zone', 'Provincial', 'Director'].includes(currentUser.role)) {
      return true;
    }

    return false;
  }

  private async canDeletePlan(plan: ImprovementPlan, currentUser: User): Promise<boolean> {
    // Only administrators or the session observer can delete plans
    if (currentUser.role === 'Administrator' || plan.session.observerId === currentUser.id) {
      return true;
    }

    return false;
  }
}
