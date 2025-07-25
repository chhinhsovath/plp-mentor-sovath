import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObservationSessionsController } from './observation-sessions.controller';
import { ObservationSessionsService } from './observation-sessions.service';
import { IndicatorResponsesService } from './indicator-responses.service';
import { SessionWorkflowService } from './session-workflow.service';
import { ObservationSession } from '../entities/observation-session.entity';
import { IndicatorResponse } from '../entities/indicator-response.entity';
import { GroupReflectionComment } from '../entities/group-reflection-comment.entity';
import { ObservationForm } from '../entities/observation-form.entity';
import { User } from '../entities/user.entity';
import { Indicator } from '../entities/indicator.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ObservationSession,
      IndicatorResponse,
      GroupReflectionComment,
      ObservationForm,
      User,
      Indicator,
    ]),
  ],
  controllers: [ObservationSessionsController],
  providers: [ObservationSessionsService, IndicatorResponsesService, SessionWorkflowService],
  exports: [ObservationSessionsService, IndicatorResponsesService, SessionWorkflowService],
})
export class ObservationSessionsModule {}
