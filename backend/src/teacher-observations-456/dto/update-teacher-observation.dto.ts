import { PartialType } from '@nestjs/swagger';
import { CreateTeacherObservationDto } from './create-teacher-observation.dto';

export class UpdateTeacherObservationDto extends PartialType(CreateTeacherObservationDto) {}