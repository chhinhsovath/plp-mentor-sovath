import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../../entities/user.entity';
import { RoleHierarchyAccess } from '../../entities/role-hierarchy-access.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(RoleHierarchyAccess)
    private roleHierarchyRepository: Repository<RoleHierarchyAccess>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      return false;
    }

    // Check if user has one of the required roles
    const hasRole = requiredRoles.some((role) => user.role === role);
    if (hasRole) {
      return true;
    }

    // Check if user's role can manage any of the required roles
    const userRoleHierarchy = await this.roleHierarchyRepository.findOne({
      where: { role: user.role },
    });

    if (!userRoleHierarchy) {
      return false;
    }

    // Check if user can manage any of the required roles
    const canManage = requiredRoles.some((role) => userRoleHierarchy.manages.includes(role));

    return canManage;
  }
}
