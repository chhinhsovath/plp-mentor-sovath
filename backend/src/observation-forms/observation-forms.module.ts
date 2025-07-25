import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObservationFormsController } from './observation-forms.controller';
import { ObservationFormsService } from './observation-forms.service';
import { LessonPhasesService } from './lesson-phases.service';
import { IndicatorsService } from './indicators.service';
import { FormTemplateService } from './form-template.service';
import { FormValidationService } from './form-validation.service';
import { ObservationForm } from '../entities/observation-form.entity';
import { LessonPhase } from '../entities/lesson-phase.entity';
import { CompetencyDomain } from '../entities/competency-domain.entity';
import { Indicator } from '../entities/indicator.entity';
import { IndicatorScale } from '../entities/indicator-scale.entity';
import { RoleHierarchyAccess } from '../entities/role-hierarchy-access.entity';
import { ObservationSession } from '../entities/observation-session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ObservationForm,
      LessonPhase,
      CompetencyDomain,
      Indicator,
      IndicatorScale,
      RoleHierarchyAccess,
      ObservationSession,
    ]),
  ],
  controllers: [ObservationFormsController],
  providers: [ObservationFormsService, LessonPhasesService, IndicatorsService, FormTemplateService, FormValidationService],
  exports: [ObservationFormsService, LessonPhasesService, IndicatorsService, FormTemplateService, FormValidationService],
})
export class ObservationFormsModule {}
