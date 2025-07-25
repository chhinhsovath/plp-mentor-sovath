import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { ObservationForm } from '../entities/observation-form.entity';
import { LessonPhase } from '../entities/lesson-phase.entity';
import { CompetencyDomain } from '../entities/competency-domain.entity';
import { Indicator } from '../entities/indicator.entity';
import { IndicatorScale } from '../entities/indicator-scale.entity';
import { CreateObservationFormDto } from './dto/create-observation-form.dto';
import { UpdateObservationFormDto } from './dto/update-observation-form.dto';
import { FormFilterDto } from './dto/form-filter.dto';
import { FormValidationService } from './form-validation.service';

@Injectable()
export class ObservationFormsService {
  constructor(
    @InjectRepository(ObservationForm)
    private observationFormRepository: Repository<ObservationForm>,
    @InjectRepository(LessonPhase)
    private lessonPhaseRepository: Repository<LessonPhase>,
    @InjectRepository(CompetencyDomain)
    private competencyDomainRepository: Repository<CompetencyDomain>,
    @InjectRepository(Indicator)
    private indicatorRepository: Repository<Indicator>,
    @InjectRepository(IndicatorScale)
    private indicatorScaleRepository: Repository<IndicatorScale>,
    private formValidationService: FormValidationService,
  ) {}

  async create(createObservationFormDto: CreateObservationFormDto): Promise<ObservationForm> {
    // Validate form data
    const validation = await this.formValidationService.validateCreateForm(createObservationFormDto);
    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'Form validation failed',
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }

    // Log warnings if any
    if (validation.warnings.length > 0) {
      console.warn('Form creation warnings:', validation.warnings);
    }

    // Create the form
    const form = this.observationFormRepository.create({
      formCode: createObservationFormDto.formCode,
      title: createObservationFormDto.title,
      subject: createObservationFormDto.subject,
      gradeRange: createObservationFormDto.gradeRange,
    });

    const savedForm = await this.observationFormRepository.save(form);

    // Create lesson phases if provided
    if (createObservationFormDto.lessonPhases?.length) {
      await this.createLessonPhases(savedForm.id, createObservationFormDto.lessonPhases);
    }

    // Create competency domains if provided
    if (createObservationFormDto.competencyDomains?.length) {
      await this.createCompetencyDomains(savedForm.id, createObservationFormDto.competencyDomains);
    }

    return this.findOne(savedForm.id);
  }

  async findAll(filterDto?: FormFilterDto): Promise<ObservationForm[]> {
    const queryBuilder = this.observationFormRepository
      .createQueryBuilder('form')
      .leftJoinAndSelect('form.lessonPhases', 'phases')
      .leftJoinAndSelect('phases.indicators', 'phaseIndicators')
      .leftJoinAndSelect('phaseIndicators.scales', 'phaseScales')
      .leftJoinAndSelect('form.competencyDomains', 'domains')
      .leftJoinAndSelect('domains.indicators', 'domainIndicators')
      .leftJoinAndSelect('domainIndicators.scales', 'domainScales')
      .orderBy('form.createdAt', 'DESC')
      .addOrderBy('phases.sectionOrder', 'ASC')
      .addOrderBy('phaseIndicators.indicatorNumber', 'ASC')
      .addOrderBy('domainIndicators.indicatorNumber', 'ASC');

    if (filterDto?.subject) {
      queryBuilder.andWhere('form.subject = :subject', { subject: filterDto.subject });
    }

    if (filterDto?.grade) {
      queryBuilder.andWhere('form.gradeRange LIKE :grade', { grade: `%${filterDto.grade}%` });
    }

    if (filterDto?.search) {
      queryBuilder.andWhere('(form.formCode ILIKE :search OR form.title ILIKE :search)', {
        search: `%${filterDto.search}%`,
      });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<ObservationForm> {
    const form = await this.observationFormRepository.findOne({
      where: { id },
      relations: [
        'lessonPhases',
        'lessonPhases.indicators',
        'lessonPhases.indicators.scales',
        'competencyDomains',
        'competencyDomains.indicators',
        'competencyDomains.indicators.scales',
      ],
      order: {
        lessonPhases: {
          sectionOrder: 'ASC',
          indicators: {
            indicatorNumber: 'ASC',
          },
        },
        competencyDomains: {
          domainName: 'ASC',
          indicators: {
            indicatorNumber: 'ASC',
          },
        },
      },
    });

    if (!form) {
      throw new NotFoundException(`Observation form with ID '${id}' not found`);
    }

    return form;
  }

  async findByCode(formCode: string): Promise<ObservationForm> {
    const form = await this.observationFormRepository.findOne({
      where: { formCode },
      relations: [
        'lessonPhases',
        'lessonPhases.indicators',
        'lessonPhases.indicators.scales',
        'competencyDomains',
        'competencyDomains.indicators',
        'competencyDomains.indicators.scales',
      ],
    });

    if (!form) {
      throw new NotFoundException(`Observation form with code '${formCode}' not found`);
    }

    return form;
  }

  async update(
    id: string,
    updateObservationFormDto: UpdateObservationFormDto,
  ): Promise<ObservationForm> {
    // Validate update
    const validation = await this.formValidationService.validateUpdateForm(id, updateObservationFormDto);
    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'Form update validation failed',
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }

    // Log warnings if any
    if (validation.warnings.length > 0) {
      console.warn('Form update warnings:', validation.warnings);
    }

    const form = await this.findOne(id);

    // Update basic form properties
    await this.observationFormRepository.update(id, {
      formCode: updateObservationFormDto.formCode,
      title: updateObservationFormDto.title,
      subject: updateObservationFormDto.subject,
      gradeRange: updateObservationFormDto.gradeRange,
    });

    // Update lesson phases if provided
    if (updateObservationFormDto.lessonPhases) {
      await this.updateLessonPhases(id, updateObservationFormDto.lessonPhases);
    }

    // Update competency domains if provided
    if (updateObservationFormDto.competencyDomains) {
      await this.updateCompetencyDomains(id, updateObservationFormDto.competencyDomains);
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    // Validate deletion
    const validation = await this.formValidationService.validateFormDeletion(id);
    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'Form deletion validation failed',
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }

    const form = await this.findOne(id);
    await this.observationFormRepository.remove(form);
  }

  async getFormsByGradeAndSubject(grade: string, subject: string): Promise<ObservationForm[]> {
    return this.observationFormRepository.find({
      where: {
        gradeRange: Like(`%${grade}%`),
        subject,
      },
      relations: ['lessonPhases', 'competencyDomains'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async getAvailableSubjects(): Promise<string[]> {
    const result = await this.observationFormRepository
      .createQueryBuilder('form')
      .select('DISTINCT form.subject', 'subject')
      .getRawMany();

    return result.map((row) => row.subject);
  }

  async getAvailableGrades(): Promise<string[]> {
    const result = await this.observationFormRepository
      .createQueryBuilder('form')
      .select('DISTINCT form.gradeRange', 'grade')
      .getRawMany();

    return result.map((row) => row.grade);
  }

  private async createLessonPhases(formId: string, lessonPhasesDto: any[]): Promise<void> {
    for (const phaseDto of lessonPhasesDto) {
      const phase = this.lessonPhaseRepository.create({
        formId,
        title: phaseDto.title,
        sectionOrder: phaseDto.sectionOrder,
      });

      const savedPhase = await this.lessonPhaseRepository.save(phase);

      if (phaseDto.indicators?.length) {
        await this.createIndicators(savedPhase.id, null, phaseDto.indicators);
      }
    }
  }

  private async createCompetencyDomains(formId: string, domainsDto: any[]): Promise<void> {
    for (const domainDto of domainsDto) {
      const domain = this.competencyDomainRepository.create({
        formId,
        subject: domainDto.subject,
        domainName: domainDto.domainName,
      });

      const savedDomain = await this.competencyDomainRepository.save(domain);

      if (domainDto.indicators?.length) {
        await this.createIndicators(null, savedDomain.id, domainDto.indicators);
      }
    }
  }

  private async createIndicators(
    phaseId: string | null,
    domainId: string | null,
    indicatorsDto: any[],
  ): Promise<void> {
    for (const indicatorDto of indicatorsDto) {
      const indicator = this.indicatorRepository.create({
        phaseId,
        domainId,
        indicatorNumber: indicatorDto.indicatorNumber,
        indicatorText: indicatorDto.indicatorText,
        maxScore: indicatorDto.maxScore,
        rubricType: indicatorDto.rubricType,
      });

      const savedIndicator = await this.indicatorRepository.save(indicator);

      if (indicatorDto.scales?.length) {
        await this.createIndicatorScales(savedIndicator.id, indicatorDto.scales);
      }
    }
  }

  private async createIndicatorScales(indicatorId: string, scalesDto: any[]): Promise<void> {
    for (const scaleDto of scalesDto) {
      const scale = this.indicatorScaleRepository.create({
        indicatorId,
        scaleLabel: scaleDto.scaleLabel,
        scaleDescription: scaleDto.scaleDescription,
      });

      await this.indicatorScaleRepository.save(scale);
    }
  }

  private async updateLessonPhases(formId: string, lessonPhasesDto: any[]): Promise<void> {
    // Remove existing phases
    await this.lessonPhaseRepository.delete({ formId });

    // Create new phases
    await this.createLessonPhases(formId, lessonPhasesDto);
  }

  private async updateCompetencyDomains(formId: string, domainsDto: any[]): Promise<void> {
    // Remove existing domains
    await this.competencyDomainRepository.delete({ formId });

    // Create new domains
    await this.createCompetencyDomains(formId, domainsDto);
  }
}
