import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImprovementPlansController } from './improvement-plans.controller';
import { ImprovementPlansService } from './improvement-plans.service';
import { ImprovementActionsService } from './improvement-actions.service';
import { FollowUpActivitiesService } from './follow-up-activities.service';
import { NotificationService } from './notification.service';
import { ImprovementPlan } from '../entities/improvement-plan.entity';
import { ImprovementAction } from '../entities/improvement-action.entity';
import { FollowUpActivity } from '../entities/follow-up-activity.entity';
import { ObservationSession } from '../entities/observation-session.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ImprovementPlan,
      ImprovementAction,
      FollowUpActivity,
      ObservationSession,
      User,
    ]),
  ],
  controllers: [ImprovementPlansController],
  providers: [
    ImprovementPlansService,
    ImprovementActionsService,
    FollowUpActivitiesService,
    NotificationService,
  ],
  exports: [
    ImprovementPlansService,
    ImprovementActionsService,
    FollowUpActivitiesService,
    NotificationService,
  ],
})
export class ImprovementPlansModule {}
