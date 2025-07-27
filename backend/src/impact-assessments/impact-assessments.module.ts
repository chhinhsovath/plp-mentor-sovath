import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImpactAssessmentsController } from './impact-assessments.controller';
import { ImpactAssessmentsService } from './impact-assessments.service';
import { ImpactAssessment } from '../entities/impact-assessment.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ImpactAssessment]),
    AuthModule
  ],
  controllers: [ImpactAssessmentsController],
  providers: [ImpactAssessmentsService],
  exports: [ImpactAssessmentsService]
})
export class ImpactAssessmentsModule {}