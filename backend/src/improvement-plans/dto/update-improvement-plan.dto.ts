import { PartialType } from '@nestjs/swagger';
import { CreateImprovementPlanDto } from './create-improvement-plan.dto';

export class UpdateImprovementPlanDto extends PartialType(CreateImprovementPlanDto) {}
