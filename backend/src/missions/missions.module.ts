import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MissionsController } from './missions.controller';
import { MissionsService } from './missions.service';
import { Mission, MissionParticipant, MissionTracking } from '../entities/mission.entity';
import { User } from '../entities/user.entity';
import { HierarchyModule } from '../hierarchy/hierarchy.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Mission, MissionParticipant, MissionTracking, User]),
    HierarchyModule,
    AuthModule,
  ],
  controllers: [MissionsController],
  providers: [MissionsService],
  exports: [MissionsService],
})
export class MissionsModule {}