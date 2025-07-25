import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../entities/user.entity';
import { RoleHierarchyAccess } from '../../entities/role-hierarchy-access.entity';
import { RequestUser } from '../types/request-user.interface';

interface AuthenticatedRequest extends Request {
  user?: RequestUser;
}

@Injectable()
export class HierarchyValidationMiddleware implements NestMiddleware {
  private readonly roleHierarchy: Map<UserRole, number> = new Map([
    [UserRole.ADMINISTRATOR, 7],
    [UserRole.ZONE, 6],
    [UserRole.PROVINCIAL, 5],
    [UserRole.DEPARTMENT, 4],
    [UserRole.CLUSTER, 3],
    [UserRole.DIRECTOR, 2],
    [UserRole.TEACHER, 1],
  ]);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RoleHierarchyAccess)
    private roleHierarchyRepository: Repository<RoleHierarchyAccess>,
  ) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const user = req.user;
    
    if (!user) {
      return next();
    }

    // Enrich user object with hierarchy information
    const userWithHierarchy = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['zone', 'province', 'department', 'cluster', 'school'],
    });

    if (userWithHierarchy) {
      req.user = {
        ...user,
        ...userWithHierarchy,
        hierarchyLevel: this.roleHierarchy.get(user.role) || 0,
      };
    }

    // Load role permissions
    const rolePermissions = await this.roleHierarchyRepository.findOne({
      where: { role: user.role },
    });

    if (rolePermissions) {
      req.user.permissions = rolePermissions;
    }

    // Add helper methods to check permissions
    req.user.canManageRole = (targetRole: UserRole): boolean => {
      const userLevel = this.roleHierarchy.get(user.role) || 0;
      const targetLevel = this.roleHierarchy.get(targetRole) || 0;
      return userLevel > targetLevel;
    };

    req.user.canAccessLocation = (
      locationLevel: 'zone' | 'province' | 'department' | 'cluster' | 'school',
      locationId: string,
    ): boolean => {
      // Administrator can access everything
      if (user.role === UserRole.ADMINISTRATOR) {
        return true;
      }

      // Check if user has access to the location based on their role and assigned locations
      switch (locationLevel) {
        case 'zone':
          return user.role === UserRole.ZONE && user.zoneId === locationId;
        
        case 'province':
          return (user.role === UserRole.ZONE || user.role === UserRole.PROVINCIAL) && 
                 user.provinceId === locationId;
        
        case 'department':
          return [UserRole.ZONE, UserRole.PROVINCIAL, UserRole.DEPARTMENT].includes(user.role) &&
                 user.departmentId === locationId;
        
        case 'cluster':
          return [UserRole.ZONE, UserRole.PROVINCIAL, UserRole.DEPARTMENT, UserRole.CLUSTER].includes(user.role) &&
                 user.clusterId === locationId;
        
        case 'school':
          return user.schoolId === locationId;
        
        default:
          return false;
      }
    };

    next();
  }
}