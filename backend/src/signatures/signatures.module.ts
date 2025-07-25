import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SignaturesController } from './signatures.controller';
import { SignaturesService } from './signatures.service';
import { ApprovalWorkflowService } from './approval-workflow.service';
import { AuditTrailService } from './audit-trail.service';
import { Signature } from '../entities/signature.entity';
import { ObservationSession } from '../entities/observation-session.entity';
import { User } from '../entities/user.entity';
import { RoleHierarchyAccess } from '../entities/role-hierarchy-access.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Signature, ObservationSession, User, RoleHierarchyAccess])],
  controllers: [SignaturesController],
  providers: [SignaturesService, ApprovalWorkflowService, AuditTrailService],
  exports: [SignaturesService, ApprovalWorkflowService, AuditTrailService],
})
export class SignaturesModule {}
