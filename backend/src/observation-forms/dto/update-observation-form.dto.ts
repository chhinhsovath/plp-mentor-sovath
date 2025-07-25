import { PartialType } from '@nestjs/swagger';
import { CreateObservationFormDto } from './create-observation-form.dto';

export class UpdateObservationFormDto extends PartialType(CreateObservationFormDto) {}
