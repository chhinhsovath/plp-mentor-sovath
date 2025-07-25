import { User } from '../../entities/user.entity';
import { RoleHierarchyAccess } from '../../entities/role-hierarchy-access.entity';
import { UserRole } from '../../entities/user.entity';

export interface RequestUser extends User {
  hierarchyLevel?: number;
  permissions?: RoleHierarchyAccess;
  canManageRole?: (targetRole: UserRole) => boolean;
  canAccessLocation?: (locationLevel: 'zone' | 'province' | 'department' | 'cluster' | 'school', locationId: string) => boolean;
  zone?: any;
  province?: any;
  department?: any;
  cluster?: any;
  school?: any;
  assignedGrades?: string[];
  assignedSubjects?: string[];
}

declare module 'express' {
  interface Request {
    user?: RequestUser;
  }
}