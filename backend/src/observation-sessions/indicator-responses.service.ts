import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IndicatorResponse } from '../entities/indicator-response.entity';
import { Indicator, RubricType } from '../entities/indicator.entity';
import { CreateIndicatorResponseDto } from './dto/create-observation-session.dto';

@Injectable()
export class IndicatorResponsesService {
  constructor(
    @InjectRepository(IndicatorResponse)
    private responseRepository: Repository<IndicatorResponse>,
    @InjectRepository(Indicator)
    private indicatorRepository: Repository<Indicator>,
  ) {}

  async create(
    sessionId: string,
    responseDto: CreateIndicatorResponseDto,
  ): Promise<IndicatorResponse> {
    // Validate indicator exists and is active
    const indicator = await this.indicatorRepository.findOne({
      where: { id: responseDto.indicatorId, isActive: true },
    });

    if (!indicator) {
      throw new NotFoundException(
        `Active indicator with ID '${responseDto.indicatorId}' not found`,
      );
    }

    // Validate response based on rubric type
    this.validateResponse(indicator, responseDto);

    // Check if response already exists for this session and indicator
    const existingResponse = await this.responseRepository.findOne({
      where: { sessionId, indicatorId: responseDto.indicatorId },
    });

    if (existingResponse) {
      // Update existing response
      await this.responseRepository.update(existingResponse.id, {
        selectedScore: responseDto.selectedScore,
        selectedLevel: responseDto.selectedLevel,
        notes: responseDto.notes,
      });
      return this.responseRepository.findOne({ where: { id: existingResponse.id } });
    }

    // Create new response
    const response = this.responseRepository.create({
      sessionId,
      indicatorId: responseDto.indicatorId,
      selectedScore: responseDto.selectedScore,
      selectedLevel: responseDto.selectedLevel,
      notes: responseDto.notes,
    });

    return this.responseRepository.save(response);
  }

  async createMultiple(
    sessionId: string,
    responseDtos: CreateIndicatorResponseDto[],
  ): Promise<IndicatorResponse[]> {
    const responses: IndicatorResponse[] = [];

    for (const responseDto of responseDtos) {
      const response = await this.create(sessionId, responseDto);
      responses.push(response);
    }

    return responses;
  }

  async updateMultiple(
    sessionId: string,
    responseDtos: CreateIndicatorResponseDto[],
  ): Promise<IndicatorResponse[]> {
    // Remove existing responses for this session
    await this.responseRepository.delete({ sessionId });

    // Create new responses
    return this.createMultiple(sessionId, responseDtos);
  }

  async findBySession(sessionId: string): Promise<IndicatorResponse[]> {
    return this.responseRepository.find({
      where: { sessionId },
      relations: ['indicator', 'indicator.scales'],
      order: {
        indicator: {
          indicatorNumber: 'ASC',
        },
      },
    });
  }

  async findOne(id: string): Promise<IndicatorResponse> {
    const response = await this.responseRepository.findOne({
      where: { id },
      relations: ['indicator', 'indicator.scales'],
    });

    if (!response) {
      throw new NotFoundException(`Indicator response with ID '${id}' not found`);
    }

    return response;
  }

  async update(
    id: string,
    updateData: Partial<CreateIndicatorResponseDto>,
  ): Promise<IndicatorResponse> {
    const response = await this.findOne(id);

    // Validate response if score or level is being updated
    if (updateData.selectedScore !== undefined || updateData.selectedLevel !== undefined) {
      const indicator = response.indicator;
      this.validateResponse(indicator, {
        indicatorId: indicator.id,
        selectedScore: updateData.selectedScore ?? response.selectedScore,
        selectedLevel: updateData.selectedLevel ?? response.selectedLevel,
        notes: updateData.notes ?? response.notes,
      });
    }

    await this.responseRepository.update(id, {
      selectedScore: updateData.selectedScore,
      selectedLevel: updateData.selectedLevel,
      notes: updateData.notes,
    });

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const response = await this.findOne(id);
    await this.responseRepository.remove(response);
  }

  async getSessionProgress(sessionId: string): Promise<{
    totalIndicators: number;
    completedResponses: number;
    completionPercentage: number;
    missingIndicators: string[];
  }> {
    // Get all responses for the session
    const responses = await this.findBySession(sessionId);

    // Get the session to find the form and its indicators
    const session = await this.responseRepository
      .createQueryBuilder('response')
      .leftJoinAndSelect('response.session', 'session')
      .leftJoinAndSelect('session.form', 'form')
      .leftJoinAndSelect('form.lessonPhases', 'phases')
      .leftJoinAndSelect('phases.indicators', 'phaseIndicators')
      .leftJoinAndSelect('form.competencyDomains', 'domains')
      .leftJoinAndSelect('domains.indicators', 'domainIndicators')
      .where('response.sessionId = :sessionId', { sessionId })
      .getOne();

    if (!session) {
      return {
        totalIndicators: 0,
        completedResponses: 0,
        completionPercentage: 0,
        missingIndicators: [],
      };
    }

    // Get all active indicators from the form
    const allIndicators = [
      ...(session.session.form.lessonPhases?.flatMap((phase) =>
        phase.indicators.filter((indicator) => indicator.isActive),
      ) || []),
      ...(session.session.form.competencyDomains?.flatMap((domain) =>
        domain.indicators.filter((indicator) => indicator.isActive),
      ) || []),
    ];

    const responseIndicatorIds = responses.map((r) => r.indicatorId);
    const missingIndicators = allIndicators
      .filter((indicator) => !responseIndicatorIds.includes(indicator.id))
      .map((indicator) => indicator.indicatorNumber);

    const totalIndicators = allIndicators.length;
    const completedResponses = responses.length;
    const completionPercentage =
      totalIndicators > 0 ? Math.round((completedResponses / totalIndicators) * 100) : 0;

    return {
      totalIndicators,
      completedResponses,
      completionPercentage,
      missingIndicators,
    };
  }

  async validateAllResponses(sessionId: string): Promise<{ isValid: boolean; errors: string[] }> {
    const responses = await this.findBySession(sessionId);
    const errors: string[] = [];

    for (const response of responses) {
      try {
        this.validateResponse(response.indicator, {
          indicatorId: response.indicatorId,
          selectedScore: response.selectedScore,
          selectedLevel: response.selectedLevel,
          notes: response.notes,
        });
      } catch (error) {
        errors.push(`Indicator ${response.indicator.indicatorNumber}: ${error.message}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validateResponse(indicator: Indicator, responseDto: CreateIndicatorResponseDto): void {
    if (indicator.rubricType === RubricType.SCALE) {
      // Scale indicators must have a selected score
      if (responseDto.selectedScore === undefined || responseDto.selectedScore === null) {
        throw new BadRequestException(
          `Scale indicator '${indicator.indicatorNumber}' requires a selected score`,
        );
      }

      // Score must be within valid range
      if (responseDto.selectedScore < 1 || responseDto.selectedScore > indicator.maxScore) {
        throw new BadRequestException(
          `Score for indicator '${indicator.indicatorNumber}' must be between 1 and ${indicator.maxScore}`,
        );
      }
    } else if (indicator.rubricType === RubricType.CHECKBOX) {
      // Checkbox indicators must have a selected level
      if (!responseDto.selectedLevel) {
        throw new BadRequestException(
          `Checkbox indicator '${indicator.indicatorNumber}' requires a selected level`,
        );
      }

      // For checkbox, score should be 0 or 1
      if (
        responseDto.selectedScore !== undefined &&
        responseDto.selectedScore !== 0 &&
        responseDto.selectedScore !== 1
      ) {
        throw new BadRequestException(
          `Checkbox indicator '${indicator.indicatorNumber}' score must be 0 or 1`,
        );
      }
    }
  }
}
