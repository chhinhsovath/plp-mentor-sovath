import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateImpactAssessmentDto } from './create-impact-assessment.dto';

export class UpdateImpactAssessmentDto extends PartialType(
  OmitType(CreateImpactAssessmentDto, ['submittedBy'] as const)
) {
  // All fields are optional for updates
  // Excluded submittedBy as it shouldn't be changed after submission
}