import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { SurveysController } from './surveys.controller';
import { SurveysService } from './surveys.service';
import { SurveyResponsesService } from './survey-responses.service';
import { Survey, Question, SurveyResponse, Answer } from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Survey, Question, SurveyResponse, Answer]),
    MulterModule.register({
      dest: './uploads/surveys',
    }),
  ],
  controllers: [SurveysController],
  providers: [SurveysService, SurveyResponsesService],
  exports: [SurveysService, SurveyResponsesService],
})
export class SurveysModule {}