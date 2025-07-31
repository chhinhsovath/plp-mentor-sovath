import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherObservation456 } from '../entities/teacher-observation-456.entity';
import { TeacherObservations456Service } from './teacher-observations-456.service';
import { TeacherObservations456Controller } from './teacher-observations-456.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TeacherObservation456])],
  controllers: [TeacherObservations456Controller],
  providers: [TeacherObservations456Service],
  exports: [TeacherObservations456Service],
})
export class TeacherObservations456Module {}