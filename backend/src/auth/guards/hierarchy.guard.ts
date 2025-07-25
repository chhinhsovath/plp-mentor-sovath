import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleHierarchyAccess } from '../../entities/role-hierarchy-access.entity';
import { User, UserRole } from '../../entities/user.entity';
import { HIERARCHY_CHECK_KEY } from '../decorators/hierarchy-check.decorator';

export interface HierarchyCheckOptions {
  checkLocationScope?: boolean;
  allowSelfAccess?: boolean;
  resourceUserIdParam?: string; // Parameter name for the user ID in the resource
  requiredLocationField?: string; // Field in request body/params containing location info
  locationLevel?: 'zone' | 'province' | 'department' | 'cluster' | 'school';
}

@Injectable()
export class HierarchyGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(RoleHierarchyAccess)
    private roleHierarchyRepository: Repository<RoleHierarchyAccess>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const hierarchyOptions = this.reflector.getAllAndOverride<HierarchyCheckOptions>(
      HIERARCHY_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!hierarchyOptions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    if (!user) {
      return false;
    }

    // Get user's role hierarchy permissions
    const userRoleHierarchy = await this.roleHierarchyRepository.findOne({
      where: { role: user.role },
    });

    if (!userRoleHierarchy) {
      throw new ForbiddenException('User role not found in hierarchy');
    }

    // Check if user is trying to access their own resource
    if (hierarchyOptions.allowSelfAccess && hierarchyOptions.resourceUserIdParam) {
      const resourceUserId = request.params[hierarchyOptions.resourceUserIdParam];
      if (resourceUserId === user.id) {
        return true;
      }
    }

    // Administrator has access to everything
    if (user.role === 'Administrator') {
      return true;
    }

    // For location scope checking, implement specific logic based on your needs
    if (hierarchyOptions.checkLocationScope) {
      return this.checkLocationScopeAccess(user, userRoleHierarchy, request);
    }

    return true;
  }

  private checkLocationScopeAccess(
    user: User,
    roleHierarchy: RoleHierarchyAccess,
    request: any,
  ): boolean {
    const hierarchyOptions = this.reflector.getAllAndOverride<HierarchyCheckOptions>(
      HIERARCHY_CHECK_KEY,
      [request.route.handler, request.route.handler.constructor],
    );

    if (!hierarchyOptions?.requiredLocationField) {
      return true;
    }

    // Get the location ID from the request
    const locationId = request.params[hierarchyOptions.requiredLocationField] || 
                      request.body[hierarchyOptions.requiredLocationField];

    if (!locationId) {
      return true; // No location specified, allow access
    }

    // Check based on user role and location hierarchy
    switch (user.role) {
      case UserRole.ADMINISTRATOR:
        return true; // Administrators can access all locations

      case UserRole.ZONE:
        // Zone users can access within their zone
        if (hierarchyOptions.locationLevel === 'zone') {
          return user.zoneId === locationId;
        }
        // Zone users can also access lower levels within their zone
        return this.isWithinZoneScope(user, locationId, hierarchyOptions.locationLevel);

      case UserRole.PROVINCIAL:
        // Provincial users can access within their province
        if (hierarchyOptions.locationLevel === 'province') {
          return user.provinceId === locationId;
        }
        // Provincial users can also access lower levels within their province
        return this.isWithinProvinceScope(user, locationId, hierarchyOptions.locationLevel);

      case UserRole.DEPARTMENT:
        // Department users can access within their department
        if (hierarchyOptions.locationLevel === 'department') {
          return user.departmentId === locationId;
        }
        // Department users can also access lower levels
        return this.isWithinDepartmentScope(user, locationId, hierarchyOptions.locationLevel);

      case UserRole.CLUSTER:
        // Cluster users can access within their cluster
        if (hierarchyOptions.locationLevel === 'cluster') {
          return user.clusterId === locationId;
        }
        // Cluster users can also access schools within their cluster
        return hierarchyOptions.locationLevel === 'school' && this.isSchoolInCluster(user, locationId);

      case UserRole.DIRECTOR:
      case UserRole.TEACHER:
        // Directors and teachers can only access their own school
        return hierarchyOptions.locationLevel === 'school' && user.schoolId === locationId;

      default:
        return false;
    }
  }

  private isWithinZoneScope(user: User, locationId: string, level: string): boolean {
    // In a real implementation, you would query the database to check
    // if the location is within the user's zone
    // For now, returning true as a placeholder
    return true;
  }

  private isWithinProvinceScope(user: User, locationId: string, level: string): boolean {
    // Check if location is within user's province
    return true;
  }

  private isWithinDepartmentScope(user: User, locationId: string, level: string): boolean {
    // Check if location is within user's department
    return true;
  }

  private isSchoolInCluster(user: User, schoolId: string): boolean {
    // Check if school is within user's cluster
    return true;
  }
}
