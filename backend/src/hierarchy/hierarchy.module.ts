import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HierarchyController } from './hierarchy.controller';
import { HierarchyService } from './hierarchy.service';
import { LocationScopeService } from './location-scope.service';
import { DataFilteringService } from './data-filtering.service';
import { GeographicEntityService } from './geographic-entity.service';
import { User } from '../entities/user.entity';
import { RoleHierarchyAccess } from '../entities/role-hierarchy-access.entity';
import { ObservationSession } from '../entities/observation-session.entity';
import { ImprovementPlan } from '../entities/improvement-plan.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RoleHierarchyAccess, ObservationSession, ImprovementPlan]),
  ],
  controllers: [HierarchyController],
  providers: [
    HierarchyService,
    LocationScopeService,
    DataFilteringService,
    GeographicEntityService,
  ],
  exports: [HierarchyService, LocationScopeService, DataFilteringService, GeographicEntityService],
})
export class HierarchyModule {}
