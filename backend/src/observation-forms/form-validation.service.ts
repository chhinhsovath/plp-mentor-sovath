import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObservationForm } from '../entities/observation-form.entity';
import { LessonPhase } from '../entities/lesson-phase.entity';
import { Indicator, RubricType } from '../entities/indicator.entity';
import { ObservationSession } from '../entities/observation-session.entity';
import { CreateObservationFormDto } from './dto/create-observation-form.dto';
import { UpdateObservationFormDto } from './dto/update-observation-form.dto';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

@Injectable()
export class FormValidationService {
  // Business rule constants
  private readonly MIN_INDICATORS_PER_PHASE = 1;
  private readonly MAX_INDICATORS_PER_PHASE = 15;
  private readonly MIN_PHASES_PER_FORM = 1;
  private readonly MAX_PHASES_PER_FORM = 5;
  private readonly MAX_TOTAL_INDICATORS = 30;
  private readonly MIN_SCALE_OPTIONS = 2;
  private readonly MAX_SCALE_OPTIONS = 5;
  private readonly VALID_SUBJECTS = ['Khmer', 'Mathematics', 'Science', 'Social Studies', 'English', 'Other'];
  private readonly VALID_GRADES = ['1', '2', '3', '4', '5', '6', '1-3', '4-6', '1-6'];

  constructor(
    @InjectRepository(ObservationForm)
    private observationFormRepository: Repository<ObservationForm>,
    @InjectRepository(ObservationSession)
    private observationSessionRepository: Repository<ObservationSession>,
    @InjectRepository(LessonPhase)
    private lessonPhaseRepository: Repository<LessonPhase>,
    @InjectRepository(Indicator)
    private indicatorRepository: Repository<Indicator>,
  ) {}

  /**
   * Validate form creation DTO
   */
  async validateCreateForm(dto: CreateObservationFormDto): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate form code format
    if (!this.isValidFormCode(dto.formCode)) {
      errors.push({
        field: 'formCode',
        message: 'Form code must follow pattern: G[grade]-[subject abbreviation] (e.g., G1-KH)',
        code: 'INVALID_FORM_CODE_FORMAT',
      });
    }

    // Check form code uniqueness
    const existingForm = await this.observationFormRepository.findOne({
      where: { formCode: dto.formCode },
    });
    if (existingForm) {
      errors.push({
        field: 'formCode',
        message: `Form code '${dto.formCode}' already exists`,
        code: 'DUPLICATE_FORM_CODE',
      });
    }

    // Validate subject
    if (!this.VALID_SUBJECTS.includes(dto.subject)) {
      warnings.push({
        field: 'subject',
        message: `Subject '${dto.subject}' is not in the standard list`,
        code: 'NON_STANDARD_SUBJECT',
      });
    }

    // Validate grade range
    if (!this.VALID_GRADES.includes(dto.gradeRange)) {
      errors.push({
        field: 'gradeRange',
        message: `Grade range '${dto.gradeRange}' is not valid`,
        code: 'INVALID_GRADE_RANGE',
      });
    }

    // Validate lesson phases
    if (dto.lessonPhases) {
      const phaseValidation = await this.validateLessonPhases(dto.lessonPhases);
      errors.push(...phaseValidation.errors);
      warnings.push(...phaseValidation.warnings);
    }

    // Validate competency domains
    if (dto.competencyDomains) {
      const domainValidation = await this.validateCompetencyDomains(dto.competencyDomains);
      errors.push(...domainValidation.errors);
      warnings.push(...domainValidation.warnings);
    }

    // Check total indicators count
    const totalIndicators = this.countTotalIndicators(dto);
    if (totalIndicators > this.MAX_TOTAL_INDICATORS) {
      warnings.push({
        field: 'indicators',
        message: `Form has ${totalIndicators} indicators, which exceeds recommended maximum of ${this.MAX_TOTAL_INDICATORS}`,
        code: 'TOO_MANY_INDICATORS',
      });
    }

    // Ensure form has at least one phase or domain
    if ((!dto.lessonPhases || dto.lessonPhases.length === 0) &&
        (!dto.competencyDomains || dto.competencyDomains.length === 0)) {
      errors.push({
        field: 'structure',
        message: 'Form must have at least one lesson phase or competency domain',
        code: 'NO_CONTENT_STRUCTURE',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate form update DTO
   */
  async validateUpdateForm(id: string, dto: UpdateObservationFormDto): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check if form exists
    const existingForm = await this.observationFormRepository.findOne({
      where: { id },
    });
    if (!existingForm) {
      errors.push({
        field: 'id',
        message: `Form with ID '${id}' not found`,
        code: 'FORM_NOT_FOUND',
      });
      return { isValid: false, errors, warnings };
    }

    // Check if form is in use
    const isInUse = await this.isFormInUse(id);
    if (isInUse) {
      warnings.push({
        field: 'form',
        message: 'This form is being used in observation sessions. Changes may affect existing data.',
        code: 'FORM_IN_USE',
      });
    }

    // Validate form code if being changed
    if (dto.formCode && dto.formCode !== existingForm.formCode) {
      if (!this.isValidFormCode(dto.formCode)) {
        errors.push({
          field: 'formCode',
          message: 'Form code must follow pattern: G[grade]-[subject abbreviation]',
          code: 'INVALID_FORM_CODE_FORMAT',
        });
      }

      const duplicateForm = await this.observationFormRepository.findOne({
        where: { formCode: dto.formCode },
      });
      if (duplicateForm && duplicateForm.id !== id) {
        errors.push({
          field: 'formCode',
          message: `Form code '${dto.formCode}' already exists`,
          code: 'DUPLICATE_FORM_CODE',
        });
      }
    }

    // Validate other fields if provided
    if (dto.subject && !this.VALID_SUBJECTS.includes(dto.subject)) {
      warnings.push({
        field: 'subject',
        message: `Subject '${dto.subject}' is not in the standard list`,
        code: 'NON_STANDARD_SUBJECT',
      });
    }

    if (dto.gradeRange && !this.VALID_GRADES.includes(dto.gradeRange)) {
      errors.push({
        field: 'gradeRange',
        message: `Grade range '${dto.gradeRange}' is not valid`,
        code: 'INVALID_GRADE_RANGE',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate indicator creation/update
   */
  async validateIndicator(indicator: any): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate indicator number format
    if (!this.isValidIndicatorNumber(indicator.indicatorNumber)) {
      errors.push({
        field: 'indicatorNumber',
        message: 'Indicator number must follow format: X.Y (e.g., 1.1, 2.3)',
        code: 'INVALID_INDICATOR_NUMBER',
      });
    }

    // Validate rubric type and max score
    if (indicator.rubricType === RubricType.CHECKBOX) {
      if (indicator.maxScore !== 1) {
        errors.push({
          field: 'maxScore',
          message: 'Checkbox indicators must have maxScore of 1',
          code: 'INVALID_CHECKBOX_SCORE',
        });
      }
    } else if (indicator.rubricType === RubricType.SCALE) {
      if (indicator.maxScore < this.MIN_SCALE_OPTIONS || indicator.maxScore > this.MAX_SCALE_OPTIONS) {
        errors.push({
          field: 'maxScore',
          message: `Scale indicators must have maxScore between ${this.MIN_SCALE_OPTIONS} and ${this.MAX_SCALE_OPTIONS}`,
          code: 'INVALID_SCALE_SCORE',
        });
      }

      // Validate scales
      if (indicator.scales) {
        if (indicator.scales.length !== indicator.maxScore) {
          errors.push({
            field: 'scales',
            message: `Scale indicator must have exactly ${indicator.maxScore} scale options`,
            code: 'SCALE_COUNT_MISMATCH',
          });
        }

        // Check for duplicate scale labels
        const scaleLabels = indicator.scales.map(s => s.scaleLabel);
        const uniqueLabels = new Set(scaleLabels);
        if (uniqueLabels.size !== scaleLabels.length) {
          errors.push({
            field: 'scales',
            message: 'Scale labels must be unique',
            code: 'DUPLICATE_SCALE_LABELS',
          });
        }
      } else {
        errors.push({
          field: 'scales',
          message: 'Scale indicators must have scale definitions',
          code: 'MISSING_SCALES',
        });
      }
    }

    // Validate indicator text length
    if (indicator.indicatorText.length < 10) {
      errors.push({
        field: 'indicatorText',
        message: 'Indicator text must be at least 10 characters long',
        code: 'INDICATOR_TEXT_TOO_SHORT',
      });
    } else if (indicator.indicatorText.length > 500) {
      warnings.push({
        field: 'indicatorText',
        message: 'Indicator text is very long. Consider making it more concise.',
        code: 'INDICATOR_TEXT_TOO_LONG',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate form deletion
   */
  async validateFormDeletion(formId: string): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check if form exists
    const form = await this.observationFormRepository.findOne({
      where: { id: formId },
    });
    if (!form) {
      errors.push({
        field: 'id',
        message: `Form with ID '${formId}' not found`,
        code: 'FORM_NOT_FOUND',
      });
      return { isValid: false, errors, warnings };
    }

    // Check if form is being used
    const isInUse = await this.isFormInUse(formId);
    if (isInUse) {
      errors.push({
        field: 'form',
        message: 'Cannot delete form that is being used in observation sessions',
        code: 'FORM_IN_USE',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate form structure for observation session
   */
  async validateFormForSession(formId: string): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const form = await this.observationFormRepository.findOne({
      where: { id: formId },
      relations: ['lessonPhases', 'lessonPhases.indicators', 'lessonPhases.indicators.scales'],
    });

    if (!form) {
      errors.push({
        field: 'formId',
        message: 'Form not found',
        code: 'FORM_NOT_FOUND',
      });
      return { isValid: false, errors, warnings };
    }

    // Check if form has indicators
    let totalIndicators = 0;
    for (const phase of form.lessonPhases || []) {
      if (!phase.indicators || phase.indicators.length === 0) {
        errors.push({
          field: `phase.${phase.id}`,
          message: `Phase '${phase.title}' has no indicators`,
          code: 'PHASE_NO_INDICATORS',
        });
      } else {
        totalIndicators += phase.indicators.length;

        // Validate each indicator
        for (const indicator of phase.indicators) {
          if (!indicator.isActive) {
            warnings.push({
              field: `indicator.${indicator.id}`,
              message: `Indicator '${indicator.indicatorNumber}' is inactive`,
              code: 'INACTIVE_INDICATOR',
            });
          }

          if (indicator.rubricType === RubricType.SCALE) {
            if (!indicator.scales || indicator.scales.length === 0) {
              errors.push({
                field: `indicator.${indicator.id}`,
                message: `Scale indicator '${indicator.indicatorNumber}' has no scale definitions`,
                code: 'MISSING_SCALES',
              });
            }
          }
        }
      }
    }

    if (totalIndicators === 0) {
      errors.push({
        field: 'form',
        message: 'Form has no indicators',
        code: 'NO_INDICATORS',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Helper methods
  private isValidFormCode(formCode: string): boolean {
    // Pattern: G[grade]-[subject abbreviation]
    const pattern = /^G[1-6](?:-[1-6])?-[A-Z]{2,}$/;
    return pattern.test(formCode);
  }

  private isValidIndicatorNumber(indicatorNumber: string): boolean {
    // Pattern: X.Y or X.Y.Z
    const pattern = /^\d+(\.\d+){1,2}$/;
    return pattern.test(indicatorNumber);
  }

  private async validateLessonPhases(phases: any[]): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (phases.length < this.MIN_PHASES_PER_FORM) {
      errors.push({
        field: 'lessonPhases',
        message: `Form must have at least ${this.MIN_PHASES_PER_FORM} lesson phase(s)`,
        code: 'TOO_FEW_PHASES',
      });
    } else if (phases.length > this.MAX_PHASES_PER_FORM) {
      warnings.push({
        field: 'lessonPhases',
        message: `Form has ${phases.length} phases, which exceeds recommended maximum of ${this.MAX_PHASES_PER_FORM}`,
        code: 'TOO_MANY_PHASES',
      });
    }

    // Check for duplicate section orders
    const sectionOrders = phases.map(p => p.sectionOrder);
    const uniqueOrders = new Set(sectionOrders);
    if (uniqueOrders.size !== sectionOrders.length) {
      errors.push({
        field: 'lessonPhases',
        message: 'Duplicate section orders found in phases',
        code: 'DUPLICATE_SECTION_ORDERS',
      });
    }

    // Validate each phase
    for (let index = 0; index < phases.length; index++) {
      const phase = phases[index];
      if (!phase.title || phase.title.trim().length < 3) {
        errors.push({
          field: `lessonPhases[${index}].title`,
          message: 'Phase title must be at least 3 characters long',
          code: 'PHASE_TITLE_TOO_SHORT',
        });
      }

      if (phase.indicators) {
        if (phase.indicators.length < this.MIN_INDICATORS_PER_PHASE) {
          errors.push({
            field: `lessonPhases[${index}].indicators`,
            message: `Phase must have at least ${this.MIN_INDICATORS_PER_PHASE} indicator(s)`,
            code: 'TOO_FEW_INDICATORS',
          });
        } else if (phase.indicators.length > this.MAX_INDICATORS_PER_PHASE) {
          warnings.push({
            field: `lessonPhases[${index}].indicators`,
            message: `Phase has ${phase.indicators.length} indicators, which exceeds recommended maximum of ${this.MAX_INDICATORS_PER_PHASE}`,
            code: 'TOO_MANY_INDICATORS',
          });
        }

        // Validate each indicator
        for (let indicatorIndex = 0; indicatorIndex < phase.indicators.length; indicatorIndex++) {
          const indicator = phase.indicators[indicatorIndex];
          const indicatorValidation = await this.validateIndicator(indicator);
          indicatorValidation.errors.forEach(error => {
            error.field = `lessonPhases[${index}].indicators[${indicatorIndex}].${error.field}`;
          });
          indicatorValidation.warnings.forEach(warning => {
            warning.field = `lessonPhases[${index}].indicators[${indicatorIndex}].${warning.field}`;
          });
          errors.push(...indicatorValidation.errors);
          warnings.push(...indicatorValidation.warnings);
        }
      }
    }

    return { errors, warnings };
  }

  private async validateCompetencyDomains(domains: any[]): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check for duplicate domain names
    const domainNames = domains.map(d => d.domainName);
    const uniqueNames = new Set(domainNames);
    if (uniqueNames.size !== domainNames.length) {
      errors.push({
        field: 'competencyDomains',
        message: 'Duplicate domain names found',
        code: 'DUPLICATE_DOMAIN_NAMES',
      });
    }

    // Validate each domain
    for (let index = 0; index < domains.length; index++) {
      const domain = domains[index];
      if (!domain.domainName || domain.domainName.trim().length < 3) {
        errors.push({
          field: `competencyDomains[${index}].domainName`,
          message: 'Domain name must be at least 3 characters long',
          code: 'DOMAIN_NAME_TOO_SHORT',
        });
      }

      if (domain.indicators) {
        // Validate each indicator
        for (let indicatorIndex = 0; indicatorIndex < domain.indicators.length; indicatorIndex++) {
          const indicator = domain.indicators[indicatorIndex];
          const indicatorValidation = await this.validateIndicator(indicator);
          indicatorValidation.errors.forEach(error => {
            error.field = `competencyDomains[${index}].indicators[${indicatorIndex}].${error.field}`;
          });
          indicatorValidation.warnings.forEach(warning => {
            warning.field = `competencyDomains[${index}].indicators[${indicatorIndex}].${warning.field}`;
          });
          errors.push(...indicatorValidation.errors);
          warnings.push(...indicatorValidation.warnings);
        }
      }
    }

    return { errors, warnings };
  }

  private countTotalIndicators(dto: CreateObservationFormDto): number {
    let count = 0;
    
    if (dto.lessonPhases) {
      count += dto.lessonPhases.reduce((sum, phase) => 
        sum + (phase.indicators?.length || 0), 0
      );
    }
    
    if (dto.competencyDomains) {
      count += dto.competencyDomains.reduce((sum, domain) => 
        sum + (domain.indicators?.length || 0), 0
      );
    }
    
    return count;
  }

  private async isFormInUse(formId: string): Promise<boolean> {
    const sessionCount = await this.observationSessionRepository.count({
      where: { formId },
    });
    return sessionCount > 0;
  }
}