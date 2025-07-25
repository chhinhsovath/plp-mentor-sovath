import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Indicator, RubricType } from '../entities/indicator.entity';
import { IndicatorScale } from '../entities/indicator-scale.entity';

export interface CreateIndicatorDto {
  indicatorNumber: string;
  indicatorText: string;
  maxScore: number;
  rubricType: RubricType;
  phaseId?: string;
  domainId?: string;
  scales?: CreateIndicatorScaleDto[];
}

export interface CreateIndicatorScaleDto {
  scaleLabel: string;
  scaleDescription: string;
}

export interface UpdateIndicatorDto extends Partial<CreateIndicatorDto> {}

@Injectable()
export class IndicatorsService {
  constructor(
    @InjectRepository(Indicator)
    private indicatorRepository: Repository<Indicator>,
    @InjectRepository(IndicatorScale)
    private indicatorScaleRepository: Repository<IndicatorScale>,
  ) {}

  async create(createIndicatorDto: CreateIndicatorDto): Promise<Indicator> {
    // Validate that either phaseId or domainId is provided
    if (!createIndicatorDto.phaseId && !createIndicatorDto.domainId) {
      throw new BadRequestException(
        'Indicator must belong to either a lesson phase or competency domain',
      );
    }

    if (createIndicatorDto.phaseId && createIndicatorDto.domainId) {
      throw new BadRequestException(
        'Indicator cannot belong to both lesson phase and competency domain',
      );
    }

    // Validate rubric type and max score
    this.validateRubricConfiguration(createIndicatorDto.rubricType, createIndicatorDto.maxScore);

    const indicator = this.indicatorRepository.create({
      indicatorNumber: createIndicatorDto.indicatorNumber,
      indicatorText: createIndicatorDto.indicatorText,
      maxScore: createIndicatorDto.maxScore,
      rubricType: createIndicatorDto.rubricType,
      phaseId: createIndicatorDto.phaseId,
      domainId: createIndicatorDto.domainId,
    });

    const savedIndicator = await this.indicatorRepository.save(indicator);

    // Create scales if provided
    if (createIndicatorDto.scales?.length) {
      await this.createScales(savedIndicator.id, createIndicatorDto.scales);
    }

    return this.findOne(savedIndicator.id);
  }

  async findAll(): Promise<Indicator[]> {
    return this.indicatorRepository.find({
      relations: ['scales', 'phase', 'domain'],
      where: { isActive: true },
      order: {
        indicatorNumber: 'ASC',
      },
    });
  }

  async findOne(id: string): Promise<Indicator> {
    const indicator = await this.indicatorRepository.findOne({
      where: { id },
      relations: ['scales', 'phase', 'domain'],
    });

    if (!indicator) {
      throw new NotFoundException(`Indicator with ID '${id}' not found`);
    }

    return indicator;
  }

  async findByPhase(phaseId: string): Promise<Indicator[]> {
    return this.indicatorRepository.find({
      where: { phaseId, isActive: true },
      relations: ['scales'],
      order: {
        indicatorNumber: 'ASC',
      },
    });
  }

  async findByDomain(domainId: string): Promise<Indicator[]> {
    return this.indicatorRepository.find({
      where: { domainId, isActive: true },
      relations: ['scales'],
      order: {
        indicatorNumber: 'ASC',
      },
    });
  }

  async update(id: string, updateIndicatorDto: UpdateIndicatorDto): Promise<Indicator> {
    const indicator = await this.findOne(id);

    // Validate rubric configuration if being updated
    if (updateIndicatorDto.rubricType || updateIndicatorDto.maxScore) {
      const rubricType = updateIndicatorDto.rubricType || indicator.rubricType;
      const maxScore = updateIndicatorDto.maxScore || indicator.maxScore;
      this.validateRubricConfiguration(rubricType, maxScore);
    }

    await this.indicatorRepository.update(id, {
      indicatorNumber: updateIndicatorDto.indicatorNumber,
      indicatorText: updateIndicatorDto.indicatorText,
      maxScore: updateIndicatorDto.maxScore,
      rubricType: updateIndicatorDto.rubricType,
    });

    // Update scales if provided
    if (updateIndicatorDto.scales) {
      await this.updateScales(id, updateIndicatorDto.scales);
    }

    return this.findOne(id);
  }

  async deactivate(id: string): Promise<void> {
    const indicator = await this.findOne(id);
    await this.indicatorRepository.update(id, { isActive: false });
  }

  async activate(id: string): Promise<void> {
    const indicator = await this.findOne(id);
    await this.indicatorRepository.update(id, { isActive: true });
  }

  async remove(id: string): Promise<void> {
    const indicator = await this.findOne(id);

    // Check if indicator is being used in any responses
    // This would require checking the indicator_responses table
    // For now, we'll soft delete by deactivating

    await this.deactivate(id);
  }

  async getIndicatorScales(indicatorId: string): Promise<IndicatorScale[]> {
    return this.indicatorScaleRepository.find({
      where: { indicatorId },
      order: {
        scaleLabel: 'ASC',
      },
    });
  }

  async validateIndicatorStructure(
    indicatorId: string,
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const indicator = await this.findOne(indicatorId);
    const errors: string[] = [];

    // Check if scale indicators have scales defined
    if (indicator.rubricType === RubricType.SCALE) {
      if (!indicator.scales || indicator.scales.length === 0) {
        errors.push('Scale-type indicators must have at least one scale defined');
      } else if (indicator.scales.length !== indicator.maxScore) {
        errors.push(
          `Scale-type indicator should have ${indicator.maxScore} scales, but has ${indicator.scales.length}`,
        );
      }
    }

    // Check if checkbox indicators have appropriate max score
    if (indicator.rubricType === RubricType.CHECKBOX && indicator.maxScore !== 1) {
      errors.push('Checkbox-type indicators should have maxScore of 1');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validateRubricConfiguration(rubricType: RubricType, maxScore: number): void {
    if (rubricType === RubricType.CHECKBOX && maxScore !== 1) {
      throw new BadRequestException('Checkbox rubric type must have maxScore of 1');
    }

    if (rubricType === RubricType.SCALE && (maxScore < 2 || maxScore > 5)) {
      throw new BadRequestException('Scale rubric type must have maxScore between 2 and 5');
    }
  }

  private async createScales(
    indicatorId: string,
    scalesDto: CreateIndicatorScaleDto[],
  ): Promise<void> {
    for (const scaleDto of scalesDto) {
      const scale = this.indicatorScaleRepository.create({
        indicatorId,
        scaleLabel: scaleDto.scaleLabel,
        scaleDescription: scaleDto.scaleDescription,
      });

      await this.indicatorScaleRepository.save(scale);
    }
  }

  private async updateScales(
    indicatorId: string,
    scalesDto: CreateIndicatorScaleDto[],
  ): Promise<void> {
    // Remove existing scales
    await this.indicatorScaleRepository.delete({ indicatorId });

    // Create new scales
    await this.createScales(indicatorId, scalesDto);
  }
}
