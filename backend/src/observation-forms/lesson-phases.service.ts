import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LessonPhase } from '../entities/lesson-phase.entity';
import { Indicator } from '../entities/indicator.entity';

@Injectable()
export class LessonPhasesService {
  constructor(
    @InjectRepository(LessonPhase)
    private lessonPhaseRepository: Repository<LessonPhase>,
    @InjectRepository(Indicator)
    private indicatorRepository: Repository<Indicator>,
  ) {}

  async findByFormId(formId: string): Promise<LessonPhase[]> {
    return this.lessonPhaseRepository.find({
      where: { formId },
      relations: ['indicators', 'indicators.scales'],
      order: {
        sectionOrder: 'ASC',
        indicators: {
          indicatorNumber: 'ASC',
        },
      },
    });
  }

  async findOne(id: string): Promise<LessonPhase> {
    const phase = await this.lessonPhaseRepository.findOne({
      where: { id },
      relations: ['indicators', 'indicators.scales', 'form'],
    });

    if (!phase) {
      throw new NotFoundException(`Lesson phase with ID '${id}' not found`);
    }

    return phase;
  }

  async updatePhaseOrder(
    formId: string,
    phaseOrders: { id: string; sectionOrder: number }[],
  ): Promise<void> {
    for (const { id, sectionOrder } of phaseOrders) {
      await this.lessonPhaseRepository.update({ id, formId }, { sectionOrder });
    }
  }

  async getPhaseIndicators(phaseId: string): Promise<Indicator[]> {
    return this.indicatorRepository.find({
      where: { phaseId },
      relations: ['scales'],
      order: {
        indicatorNumber: 'ASC',
      },
    });
  }

  async validatePhaseStructure(formId: string): Promise<{ isValid: boolean; errors: string[] }> {
    const phases = await this.findByFormId(formId);
    const errors: string[] = [];

    // Check if phases exist
    if (phases.length === 0) {
      errors.push('Form must have at least one lesson phase');
    }

    // Check for duplicate section orders
    const sectionOrders = phases.map((p) => p.sectionOrder);
    const duplicateOrders = sectionOrders.filter(
      (order, index) => sectionOrders.indexOf(order) !== index,
    );
    if (duplicateOrders.length > 0) {
      errors.push(`Duplicate section orders found: ${duplicateOrders.join(', ')}`);
    }

    // Check if each phase has indicators
    for (const phase of phases) {
      if (!phase.indicators || phase.indicators.length === 0) {
        errors.push(`Phase '${phase.title}' has no indicators`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
