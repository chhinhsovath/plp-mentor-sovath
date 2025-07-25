import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FollowUpActivity, ActivityStatus } from '../entities/follow-up-activity.entity';
import { CreateFollowUpActivityDto } from './dto/create-improvement-plan.dto';

export interface FollowUpWithStatus extends Omit<FollowUpActivity, 'status'> {
  status: ActivityStatus;
  daysUntilFollowUp: number;
}

@Injectable()
export class FollowUpActivitiesService {
  constructor(
    @InjectRepository(FollowUpActivity)
    private followUpRepository: Repository<FollowUpActivity>,
  ) {}

  async create(planId: string, followUpDto: CreateFollowUpActivityDto): Promise<FollowUpActivity> {
    const followUp = this.followUpRepository.create({
      planId,
      followUpDate: new Date(followUpDto.followUpDate),
      method: followUpDto.method,
      comments: followUpDto.comments,
    });

    return this.followUpRepository.save(followUp);
  }

  async createMultiple(
    planId: string,
    followUpDtos: CreateFollowUpActivityDto[],
  ): Promise<FollowUpActivity[]> {
    const followUps: FollowUpActivity[] = [];

    for (const followUpDto of followUpDtos) {
      const followUp = await this.create(planId, followUpDto);
      followUps.push(followUp);
    }

    return followUps;
  }

  async updateMultiple(
    planId: string,
    followUpDtos: CreateFollowUpActivityDto[],
  ): Promise<FollowUpActivity[]> {
    // Remove existing follow-ups for this plan
    await this.followUpRepository.delete({ planId });

    // Create new follow-ups
    return this.createMultiple(planId, followUpDtos);
  }

  async findByPlan(planId: string): Promise<FollowUpWithStatus[]> {
    const followUps = await this.followUpRepository.find({
      where: { planId },
      order: {
        followUpDate: 'ASC',
      },
    });

    return followUps.map((followUp) => this.addStatusToFollowUp(followUp));
  }

  async findOne(id: string): Promise<FollowUpActivity> {
    const followUp = await this.followUpRepository.findOne({
      where: { id },
      relations: ['plan', 'plan.session'],
    });

    if (!followUp) {
      throw new NotFoundException(`Follow-up activity with ID '${id}' not found`);
    }

    return followUp;
  }

  async update(
    id: string,
    updateData: Partial<CreateFollowUpActivityDto>,
  ): Promise<FollowUpActivity> {
    const followUp = await this.findOne(id);

    await this.followUpRepository.update(id, {
      followUpDate: updateData.followUpDate ? new Date(updateData.followUpDate) : undefined,
      method: updateData.method,
      comments: updateData.comments,
    });

    return this.findOne(id);
  }

  async addNote(id: string, note: string): Promise<FollowUpActivity> {
    const followUp = await this.findOne(id);

    const updatedComments = followUp.comments
      ? `${followUp.comments}\n\n[${new Date().toISOString().split('T')[0]}] ${note}`
      : `[${new Date().toISOString().split('T')[0]}] ${note}`;

    await this.followUpRepository.update(id, {
      comments: updatedComments,
    });

    return this.findOne(id);
  }

  async markCompleted(id: string, completionNote?: string): Promise<FollowUpActivity> {
    const followUp = await this.findOne(id);

    let updatedComments = followUp.comments || '';
    if (completionNote) {
      updatedComments += `\n\n[${new Date().toISOString().split('T')[0]}] COMPLETED: ${completionNote}`;
    } else {
      updatedComments += `\n\n[${new Date().toISOString().split('T')[0]}] COMPLETED`;
    }

    await this.followUpRepository.update(id, {
      comments: updatedComments,
    });

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const followUp = await this.findOne(id);
    await this.followUpRepository.remove(followUp);
  }

  async getUpcomingFollowUps(days: number = 7): Promise<FollowUpWithStatus[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const followUps = await this.followUpRepository.find({
      where: {
        followUpDate: { $gte: today, $lte: futureDate } as any,
      },
      relations: ['plan', 'plan.session'],
      order: {
        followUpDate: 'ASC',
      },
    });

    return followUps.map((followUp) => this.addStatusToFollowUp(followUp));
  }

  async getOverdueFollowUps(): Promise<FollowUpWithStatus[]> {
    const today = new Date();

    const followUps = await this.followUpRepository.find({
      where: {
        followUpDate: { $lt: today } as any,
      },
      relations: ['plan', 'plan.session'],
      order: {
        followUpDate: 'ASC',
      },
    });

    return followUps
      .filter((followUp) => !this.isCompleted(followUp))
      .map((followUp) => this.addStatusToFollowUp(followUp));
  }

  async getFollowUpsByMethod(method: string): Promise<FollowUpWithStatus[]> {
    const followUps = await this.followUpRepository.find({
      where: { method },
      relations: ['plan', 'plan.session'],
      order: {
        followUpDate: 'ASC',
      },
    });

    return followUps.map((followUp) => this.addStatusToFollowUp(followUp));
  }

  async getFollowUpStatistics(): Promise<{
    total: number;
    scheduled: number;
    completed: number;
    overdue: number;
    byMethod: Record<string, number>;
  }> {
    const today = new Date();

    const [total, overdue, allFollowUps] = await Promise.all([
      this.followUpRepository.count(),
      this.followUpRepository.count({
        where: {
          followUpDate: { $lt: today } as any,
        },
      }),
      this.followUpRepository.find(),
    ]);

    const completed = allFollowUps.filter((f) => this.isCompleted(f)).length;
    const scheduled = total - completed;

    // Count by method
    const byMethod: Record<string, number> = {};
    allFollowUps.forEach((followUp) => {
      byMethod[followUp.method] = (byMethod[followUp.method] || 0) + 1;
    });

    return {
      total,
      scheduled,
      completed,
      overdue: Math.max(0, overdue - completed),
      byMethod,
    };
  }

  async scheduleRecurringFollowUp(
    planId: string,
    followUpDto: CreateFollowUpActivityDto,
    intervalDays: number,
    occurrences: number,
  ): Promise<FollowUpActivity[]> {
    const followUps: FollowUpActivity[] = [];
    const startDate = new Date(followUpDto.followUpDate);

    for (let i = 0; i < occurrences; i++) {
      const followUpDate = new Date(startDate);
      followUpDate.setDate(startDate.getDate() + i * intervalDays);

      const followUp = await this.create(planId, {
        ...followUpDto,
        followUpDate: followUpDate.toISOString().split('T')[0],
        comments: `${followUpDto.comments || ''} (Occurrence ${i + 1}/${occurrences})`.trim(),
      });

      followUps.push(followUp);
    }

    return followUps;
  }

  private addStatusToFollowUp(followUp: FollowUpActivity): FollowUpWithStatus {
    const today = new Date();
    const followUpDate = new Date(followUp.followUpDate);
    const daysUntilFollowUp = Math.ceil(
      (followUpDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    let status: ActivityStatus;
    if (this.isCompleted(followUp)) {
      status = ActivityStatus.COMPLETED;
    } else if (daysUntilFollowUp < 0) {
      status = ActivityStatus.OVERDUE;
    } else {
      status = ActivityStatus.PENDING;
    }

    return {
      ...followUp,
      status,
      daysUntilFollowUp,
    };
  }

  private isCompleted(followUp: FollowUpActivity): boolean {
    // Check if the comments contain a completion marker
    return followUp.comments?.includes('COMPLETED') || false;
  }

  async validateFollowUpSchedule(
    planId: string,
  ): Promise<{ isValid: boolean; warnings: string[] }> {
    const followUps = await this.findByPlan(planId);
    const warnings: string[] = [];

    const today = new Date();

    for (const followUp of followUps) {
      if (followUp.followUpDate < today && followUp.status !== ActivityStatus.COMPLETED) {
        warnings.push(`Follow-up "${followUp.method}" is overdue`);
      }
    }

    // Check for scheduling conflicts (same day, same method)
    const scheduleMap = new Map<string, FollowUpActivity[]>();
    followUps.forEach((followUp) => {
      const key = `${followUp.followUpDate.toDateString()}-${followUp.method}`;
      if (!scheduleMap.has(key)) {
        scheduleMap.set(key, []);
      }
      scheduleMap.get(key)!.push(followUp);
    });

    scheduleMap.forEach((activities, key) => {
      if (activities.length > 1) {
        warnings.push(`Multiple follow-ups scheduled for the same date and method: ${key}`);
      }
    });

    return {
      isValid: warnings.length === 0,
      warnings,
    };
  }
}
