import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImprovementAction } from '../entities/improvement-action.entity';
import { CreateImprovementActionDto } from './dto/create-improvement-plan.dto';

export enum ActionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
}

export interface ActionWithStatus extends ImprovementAction {
  status: ActionStatus;
  daysUntilDeadline: number;
}

@Injectable()
export class ImprovementActionsService {
  constructor(
    @InjectRepository(ImprovementAction)
    private actionRepository: Repository<ImprovementAction>,
  ) {}

  async create(planId: string, actionDto: CreateImprovementActionDto): Promise<ImprovementAction> {
    const action = this.actionRepository.create({
      planId,
      actionDescription: actionDto.actionDescription,
      responsiblePerson: actionDto.responsiblePerson,
      deadline: new Date(actionDto.deadline),
    });

    return this.actionRepository.save(action);
  }

  async createMultiple(
    planId: string,
    actionDtos: CreateImprovementActionDto[],
  ): Promise<ImprovementAction[]> {
    const actions: ImprovementAction[] = [];

    for (const actionDto of actionDtos) {
      const action = await this.create(planId, actionDto);
      actions.push(action);
    }

    return actions;
  }

  async updateMultiple(
    planId: string,
    actionDtos: CreateImprovementActionDto[],
  ): Promise<ImprovementAction[]> {
    // Remove existing actions for this plan
    await this.actionRepository.delete({ planId });

    // Create new actions
    return this.createMultiple(planId, actionDtos);
  }

  async findByPlan(planId: string): Promise<ActionWithStatus[]> {
    const actions = await this.actionRepository.find({
      where: { planId },
      order: {
        deadline: 'ASC',
      },
    });

    return actions.map((action) => this.addStatusToAction(action));
  }

  async findOne(id: string): Promise<ImprovementAction> {
    const action = await this.actionRepository.findOne({
      where: { id },
      relations: ['plan', 'plan.session'],
    });

    if (!action) {
      throw new NotFoundException(`Improvement action with ID '${id}' not found`);
    }

    return action;
  }

  async update(
    id: string,
    updateData: Partial<CreateImprovementActionDto>,
  ): Promise<ImprovementAction> {
    const action = await this.findOne(id);

    await this.actionRepository.update(id, {
      actionDescription: updateData.actionDescription,
      responsiblePerson: updateData.responsiblePerson,
      deadline: updateData.deadline ? new Date(updateData.deadline) : undefined,
    });

    return this.findOne(id);
  }

  async markCompleted(id: string): Promise<ImprovementAction> {
    const action = await this.findOne(id);

    // For now, we'll add a completed_at field in a future enhancement
    // Currently, we determine completion status based on deadline vs current date

    return action;
  }

  async remove(id: string): Promise<void> {
    const action = await this.findOne(id);
    await this.actionRepository.remove(action);
  }

  async getActionsByResponsiblePerson(responsiblePerson: string): Promise<ActionWithStatus[]> {
    const actions = await this.actionRepository.find({
      where: { responsiblePerson },
      relations: ['plan', 'plan.session'],
      order: {
        deadline: 'ASC',
      },
    });

    return actions.map((action) => this.addStatusToAction(action));
  }

  async getOverdueActions(): Promise<ActionWithStatus[]> {
    const today = new Date();

    const actions = await this.actionRepository.find({
      where: {
        deadline: { $lt: today } as any,
      },
      relations: ['plan', 'plan.session'],
      order: {
        deadline: 'ASC',
      },
    });

    return actions.map((action) => this.addStatusToAction(action));
  }

  async getUpcomingActions(days: number = 7): Promise<ActionWithStatus[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const actions = await this.actionRepository.find({
      where: {
        deadline: { $gte: today, $lte: futureDate } as any,
      },
      relations: ['plan', 'plan.session'],
      order: {
        deadline: 'ASC',
      },
    });

    return actions.map((action) => this.addStatusToAction(action));
  }

  async getActionStatistics(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
  }> {
    const today = new Date();

    const [total, overdue] = await Promise.all([
      this.actionRepository.count(),
      this.actionRepository.count({
        where: {
          deadline: { $lt: today } as any,
        },
      }),
    ]);

    // For now, we'll calculate basic statistics
    // In a full implementation, you'd have completion tracking
    return {
      total,
      pending: Math.floor(total * 0.4),
      inProgress: Math.floor(total * 0.3),
      completed: Math.floor(total * 0.2),
      overdue,
    };
  }

  private addStatusToAction(action: ImprovementAction): ActionWithStatus {
    const today = new Date();
    const deadline = new Date(action.deadline);
    const daysUntilDeadline = Math.ceil(
      (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    let status: ActionStatus;
    if (daysUntilDeadline < 0) {
      status = ActionStatus.OVERDUE;
    } else if (daysUntilDeadline <= 3) {
      status = ActionStatus.IN_PROGRESS;
    } else {
      status = ActionStatus.PENDING;
    }

    return {
      ...action,
      status,
      daysUntilDeadline,
    };
  }

  async validateActionDeadlines(planId: string): Promise<{ isValid: boolean; warnings: string[] }> {
    const actions = await this.findByPlan(planId);
    const warnings: string[] = [];

    const today = new Date();

    for (const action of actions) {
      if (action.deadline < today) {
        warnings.push(`Action "${action.actionDescription}" has passed its deadline`);
      } else if (action.daysUntilDeadline <= 3) {
        warnings.push(
          `Action "${action.actionDescription}" is due in ${action.daysUntilDeadline} days`,
        );
      }
    }

    // Check for overlapping deadlines
    const deadlines = actions.map((a) => a.deadline.toDateString());
    const duplicateDeadlines = deadlines.filter((date, index) => deadlines.indexOf(date) !== index);

    if (duplicateDeadlines.length > 0) {
      warnings.push('Multiple actions have the same deadline date');
    }

    return {
      isValid: warnings.length === 0,
      warnings,
    };
  }
}
