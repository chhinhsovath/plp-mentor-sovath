import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObservationForm } from '../entities/observation-form.entity';
import { User, UserRole } from '../entities/user.entity';
import { RubricType } from '../entities/indicator.entity';
import { RequestUser } from '../auth/types/request-user.interface';

export interface FormTemplateConfig {
  gradeLevel: string;
  subject: string;
  formCode: string;
  title: string;
  phases: {
    title: string;
    order: number;
    indicators: {
      number: string;
      text: string;
      rubricType: RubricType;
      maxScore: number;
      scales?: { label: string; description: string }[];
    }[];
  }[];
  competencyDomains?: {
    domainName: string;
    indicators: {
      number: string;
      text: string;
      rubricType: RubricType;
      maxScore: number;
      scales?: { label: string; description: string }[];
    }[];
  }[];
}

@Injectable()
export class FormTemplateService {
  // Default form template configurations for different grade/subject combinations
  private readonly formTemplates: FormTemplateConfig[] = [
    // KH-G1-Level1 - Primary Khmer Assessment Form (Corrected spelling)
    {
      gradeLevel: '1',
      subject: 'Khmer',
      formCode: 'KH-G1-Level1',
      title: 'ឧបករណ៍វាស់ស្ទង់កម្រិតអំណាន និងសរសេរភាសាខ្មែរ សម្រាប់ទំប៉ូតារកម្រិតអាបដៅប៉ូទីសាលាបឋមសិក្សា - កម្រិតទី១',
      phases: [
        {
          title: 'ការវិភាគទូទៅ',
          order: 1,
          indicators: [
            {
              number: '១',
              text: 'លេខិតាស្វ័យវិភាគ',
              rubricType: RubricType.SCALE,
              maxScore: 5,
              scales: [
                { label: 'កម្រិត ១', description: 'ត្រូវការជំនួយច្រើន' },
                { label: 'កម្រិត ២', description: 'កម្រិតចាប់ផ្តើម' },
                { label: 'កម្រិត ៣', description: 'កម្រិតអភិវឌ្ឍន៍' },
                { label: 'កម្រិត ៤', description: 'កម្រិតជំនាញ' },
                { label: 'កម្រិត ៥', description: 'កម្រិតល្អប្រសើរ' },
              ],
            },
          ],
        },
        {
          title: 'សកម្មភាពអាន',
          order: 2,
          indicators: [
            {
              number: '២.១',
              text: 'សកម្មភាព ១៖ ការស្គាល់សម្លេងអក្សរបី',
              rubricType: RubricType.SCALE,
              maxScore: 5,
            },
            {
              number: '២.២',
              text: 'សកម្មភាព ២៖ ការស្គាល់ផ្គុំអក្សរបី',
              rubricType: RubricType.SCALE,
              maxScore: 5,
            },
            {
              number: '២.៣',
              text: 'សកម្មភាព ៣៖ ការអានពាក្យ',
              rubricType: RubricType.SCALE,
              maxScore: 5,
            },
            {
              number: '២.៤',
              text: 'សកម្មភាព ៤៖ ការអានប្រយោគ',
              rubricType: RubricType.SCALE,
              maxScore: 5,
            },
            {
              number: '២.៥',
              text: 'សកម្មភាព ៥៖ ការរឿងសព្ទ',
              rubricType: RubricType.SCALE,
              maxScore: 5,
            },
            {
              number: '២.៦',
              text: 'សកម្មភាព ៦៖ ការអានសម្រួន (និងមានក្លែងរួមរបស់ក្នុងការវិទ្យា)',
              rubricType: RubricType.SCALE,
              maxScore: 5,
            },
            {
              number: '២.៧',
              text: 'សកម្មភាព ៧៖ ការអានអត្ថបទខ្លី',
              rubricType: RubricType.SCALE,
              maxScore: 5,
            },
            {
              number: '២.៨',
              text: 'សកម្មភាព ៨៖ ការសរសេរស',
              rubricType: RubricType.SCALE,
              maxScore: 5,
            },
          ],
        },
        {
          title: 'សរុបរួម',
          order: 3,
          indicators: [
            {
              number: '៣',
              text: 'សរុបរួម',
              rubricType: RubricType.SCALE,
              maxScore: 5,
            },
          ],
        },
      ],
    },
  ];

  constructor(
    @InjectRepository(ObservationForm)
    private observationFormRepository: Repository<ObservationForm>,
  ) {}

  /**
   * Get available form templates for a specific grade and subject
   */
  async getAvailableTemplates(grade: string, subject?: string): Promise<FormTemplateConfig[]> {
    let templates = this.formTemplates.filter((t) => t.gradeLevel === grade);
    
    if (subject) {
      templates = templates.filter((t) => t.subject === subject);
    }
    
    // Ensure KH-G1-Level1 is always first
    templates.sort((a, b) => {
      if (a.formCode === 'KH-G1-Level1') return -1;
      if (b.formCode === 'KH-G1-Level1') return 1;
      return 0;
    });
    
    return templates;
  }

  /**
   * Get all available form templates
   */
  async getAllTemplates(): Promise<FormTemplateConfig[]> {
    // Return all templates with KH-G1-Level1 first
    return [...this.formTemplates].sort((a, b) => {
      if (a.formCode === 'KH-G1-Level1') return -1;
      if (b.formCode === 'KH-G1-Level1') return 1;
      return 0;
    });
  }

  /**
   * Get form template by code
   */
  async getTemplateByCode(formCode: string): Promise<FormTemplateConfig> {
    const template = this.formTemplates.find((t) => t.formCode === formCode);
    
    if (!template) {
      throw new NotFoundException(`Form template with code '${formCode}' not found`);
    }
    
    return template;
  }

  /**
   * Get recommended forms based on user role and assigned location
   */
  async getRecommendedForms(user: RequestUser): Promise<ObservationForm[]> {
    const queryBuilder = this.observationFormRepository.createQueryBuilder('form');

    // Filter based on user role and assigned grades/subjects
    switch (user.role) {
      case UserRole.TEACHER:
      case UserRole.DIRECTOR:
        // Teachers and directors see forms for their specific grades/subjects
        if (user.assignedGrades?.length) {
          queryBuilder.andWhere('form.gradeRange IN (:...grades)', { 
            grades: user.assignedGrades 
          });
        }
        if (user.assignedSubjects?.length) {
          queryBuilder.andWhere('form.subject IN (:...subjects)', { 
            subjects: user.assignedSubjects 
          });
        }
        break;
        
      case UserRole.CLUSTER:
      case UserRole.DEPARTMENT:
      case UserRole.PROVINCIAL:
      case UserRole.ZONE:
      case UserRole.ADMINISTRATOR:
        // Higher level users see all forms
        break;
    }

    queryBuilder.orderBy('form.gradeRange', 'ASC')
      .addOrderBy('form.subject', 'ASC');

    return queryBuilder.getMany();
  }

  /**
   * Get form configuration metadata
   */
  async getFormMetadata(formId: string): Promise<{
    totalIndicators: number;
    indicatorsByPhase: { phase: string; count: number }[];
    rubricTypes: { type: string; count: number }[];
    estimatedCompletionTime: number; // in minutes
  }> {
    const form = await this.observationFormRepository.findOne({
      where: { id: formId },
      relations: ['lessonPhases', 'lessonPhases.indicators', 'competencyDomains', 'competencyDomains.indicators'],
    });

    if (!form) {
      throw new NotFoundException(`Form with ID '${formId}' not found`);
    }

    let totalIndicators = 0;
    const indicatorsByPhase: { phase: string; count: number }[] = [];
    const rubricTypeCounts = new Map<string, number>();

    // Count indicators in lesson phases
    for (const phase of form.lessonPhases || []) {
      const phaseIndicatorCount = phase.indicators?.length || 0;
      totalIndicators += phaseIndicatorCount;
      indicatorsByPhase.push({
        phase: phase.title,
        count: phaseIndicatorCount,
      });

      // Count rubric types
      for (const indicator of phase.indicators || []) {
        const currentCount = rubricTypeCounts.get(indicator.rubricType) || 0;
        rubricTypeCounts.set(indicator.rubricType, currentCount + 1);
      }
    }

    // Count indicators in competency domains
    for (const domain of form.competencyDomains || []) {
      const domainIndicatorCount = domain.indicators?.length || 0;
      totalIndicators += domainIndicatorCount;

      // Count rubric types
      for (const indicator of domain.indicators || []) {
        const currentCount = rubricTypeCounts.get(indicator.rubricType) || 0;
        rubricTypeCounts.set(indicator.rubricType, currentCount + 1);
      }
    }

    const rubricTypes = Array.from(rubricTypeCounts.entries()).map(([type, count]) => ({
      type,
      count,
    }));

    // Estimate 2 minutes per indicator for completion
    const estimatedCompletionTime = totalIndicators * 2;

    return {
      totalIndicators,
      indicatorsByPhase,
      rubricTypes,
      estimatedCompletionTime,
    };
  }

  /**
   * Generate form preview data for UI
   */
  async generateFormPreview(formId: string): Promise<{
    formInfo: {
      code: string;
      title: string;
      subject: string;
      grade: string;
    };
    structure: Array<{
      type: 'phase' | 'domain';
      title: string;
      indicatorCount: number;
      sampleIndicators: string[];
    }>;
  }> {
    const form = await this.observationFormRepository.findOne({
      where: { id: formId },
      relations: ['lessonPhases', 'lessonPhases.indicators', 'competencyDomains', 'competencyDomains.indicators'],
    });

    if (!form) {
      throw new NotFoundException(`Form with ID '${formId}' not found`);
    }

    const structure: Array<{
      type: 'phase' | 'domain';
      title: string;
      indicatorCount: number;
      sampleIndicators: string[];
    }> = [];

    // Add lesson phases to structure
    for (const phase of form.lessonPhases || []) {
      structure.push({
        type: 'phase',
        title: phase.title,
        indicatorCount: phase.indicators?.length || 0,
        sampleIndicators: phase.indicators?.slice(0, 2).map(i => i.indicatorText) || [],
      });
    }

    // Add competency domains to structure
    for (const domain of form.competencyDomains || []) {
      structure.push({
        type: 'domain',
        title: domain.domainName,
        indicatorCount: domain.indicators?.length || 0,
        sampleIndicators: domain.indicators?.slice(0, 2).map(i => i.indicatorText) || [],
      });
    }

    return {
      formInfo: {
        code: form.formCode,
        title: form.title,
        subject: form.subject,
        grade: form.gradeRange,
      },
      structure,
    };
  }

  /**
   * Validate form completeness
   */
  async validateFormCompleteness(formId: string): Promise<{
    isComplete: boolean;
    missingElements: string[];
    warnings: string[];
  }> {
    const form = await this.observationFormRepository.findOne({
      where: { id: formId },
      relations: ['lessonPhases', 'lessonPhases.indicators', 'lessonPhases.indicators.scales'],
    });

    if (!form) {
      throw new NotFoundException(`Form with ID '${formId}' not found`);
    }

    const missingElements: string[] = [];
    const warnings: string[] = [];

    // Check if form has at least one phase
    if (!form.lessonPhases || form.lessonPhases.length === 0) {
      missingElements.push('Form must have at least one lesson phase');
    }

    // Check each phase
    for (const phase of form.lessonPhases || []) {
      if (!phase.indicators || phase.indicators.length === 0) {
        missingElements.push(`Phase '${phase.title}' has no indicators`);
      }

      // Check each indicator
      for (const indicator of phase.indicators || []) {
        if (indicator.rubricType === RubricType.SCALE) {
          if (!indicator.scales || indicator.scales.length === 0) {
            missingElements.push(`Indicator '${indicator.indicatorNumber}' has no scale definitions`);
          } else if (indicator.scales.length !== indicator.maxScore) {
            warnings.push(
              `Indicator '${indicator.indicatorNumber}' has ${indicator.scales.length} scales but maxScore is ${indicator.maxScore}`
            );
          }
        }
      }
    }

    // Add warnings for best practices
    const totalIndicators = form.lessonPhases.reduce(
      (sum, phase) => sum + (phase.indicators?.length || 0), 
      0
    );
    
    if (totalIndicators > 30) {
      warnings.push(`Form has ${totalIndicators} indicators, which may be too many for a single observation`);
    }

    return {
      isComplete: missingElements.length === 0,
      missingElements,
      warnings,
    };
  }
}