import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleHierarchyAccess } from '../entities/role-hierarchy-access.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { AuditService } from '../common/services/audit.service';
import { EncryptionService } from '../common/services/encryption.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([RoleHierarchyAccess, AuditLog])],
  providers: [AuditService, EncryptionService],
  exports: [TypeOrmModule, AuditService, EncryptionService],
})
export class SharedModule {}
