import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { RoleHierarchyAccess } from '../entities/role-hierarchy-access.entity';
import { HierarchyFilterDto, LocationScopeDto, BreadcrumbDto } from './dto/hierarchy-filter.dto';

export interface HierarchyLevel {
  level: string;
  name: string;
  nameKh: string;
  canManage: string[];
  canView: string;
  canApproveMissions: boolean;
}

export interface UserHierarchyInfo {
  user: User;
  hierarchyLevel: HierarchyLevel;
  locationScope: LocationScopeDto;
  managedEntities: any[];
  accessibleData: {
    users: number;
    sessions: number;
    plans: number;
  };
}

@Injectable()
export class HierarchyService {
  // Mock geographic data - in production, this would come from a database
  private readonly geographicData = {
    zones: [
      { id: 'zone-001', name: 'Central Zone', nameKh: 'តំបន់កណ្តាល' },
      { id: 'zone-002', name: 'Northern Zone', nameKh: 'តំបន់ខាងជើង' },
      { id: 'zone-003', name: 'Southern Zone', nameKh: 'តំបន់ខាងត្បូង' },
    ],
    provinces: [
      { id: 'province-001', name: 'Phnom Penh', nameKh: 'ភ្នំពេញ', zoneId: 'zone-001' },
      { id: 'province-002', name: 'Kandal', nameKh: 'កណ្តាល', zoneId: 'zone-001' },
      { id: 'province-003', name: 'Siem Reap', nameKh: 'សៀមរាប', zoneId: 'zone-002' },
      { id: 'province-004', name: 'Battambang', nameKh: 'បាត់ដំបង', zoneId: 'zone-002' },
      { id: 'province-005', name: 'Kampot', nameKh: 'កំពត', zoneId: 'zone-003' },
    ],
    departments: [
      {
        id: 'dept-001',
        name: 'Phnom Penh Education Department',
        nameKh: 'នាយកដ្ឋានអប់រំភ្នំពេញ',
        provinceId: 'province-001',
      },
      {
        id: 'dept-002',
        name: 'Kandal Education Department',
        nameKh: 'នាយកដ្ឋានអប់រំកណ្តាល',
        provinceId: 'province-002',
      },
      {
        id: 'dept-003',
        name: 'Siem Reap Education Department',
        nameKh: 'នាយកដ្ឋានអប់រំសៀមរាប',
        provinceId: 'province-003',
      },
    ],
    clusters: [
      {
        id: 'cluster-001',
        name: 'Daun Penh Cluster',
        nameKh: 'ចង្កោមដូនពេញ',
        departmentId: 'dept-001',
      },
      {
        id: 'cluster-002',
        name: 'Chamkar Mon Cluster',
        nameKh: 'ចង្កោមចំការមន',
        departmentId: 'dept-001',
      },
      {
        id: 'cluster-003',
        name: 'Kandal Stung Cluster',
        nameKh: 'ចង្កោមកណ្តាលស្ទឹង',
        departmentId: 'dept-002',
      },
    ],
    schools: [
      {
        id: 'school-001',
        name: 'Hun Sen Primary School',
        nameKh: 'សាលាបឋមសិក្សាហ៊ុនសែន',
        clusterId: 'cluster-001',
      },
      {
        id: 'school-002',
        name: 'Preah Sisowath High School',
        nameKh: 'វិទ្យាល័យព្រះសីសុវត្ថិ',
        clusterId: 'cluster-001',
      },
      {
        id: 'school-003',
        name: 'Kandal Primary School',
        nameKh: 'សាលាបឋមសិក្សាកណ្តាល',
        clusterId: 'cluster-003',
      },
    ],
  };

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RoleHierarchyAccess)
    private roleHierarchyRepository: Repository<RoleHierarchyAccess>,
  ) {}

  async getUserHierarchyInfo(userId: string): Promise<UserHierarchyInfo> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }

    const hierarchyLevel = await this.getHierarchyLevel(user.role);
    const locationScope = await this.getUserLocationScope(user);
    const managedEntities = await this.getManagedEntities(user);
    const accessibleData = await this.getAccessibleDataCounts(user);

    return {
      user,
      hierarchyLevel,
      locationScope,
      managedEntities,
      accessibleData,
    };
  }

  async getHierarchyLevel(role: UserRole): Promise<HierarchyLevel> {
    const roleHierarchy = await this.roleHierarchyRepository.findOne({
      where: { role: role.toString() },
    });

    if (!roleHierarchy) {
      throw new NotFoundException(`Hierarchy information not found for role '${role}'`);
    }

    return {
      level: role.toString(),
      name: this.getRoleName(role),
      nameKh: this.getRoleNameKh(role),
      canManage: roleHierarchy.manages,
      canView: roleHierarchy.canView,
      canApproveMissions: roleHierarchy.canApproveMissions,
    };
  }

  async getUserLocationScope(user: User): Promise<LocationScopeDto> {
    const scope: LocationScopeDto = {};

    // Build location scope based on user's assigned IDs
    if (user.zoneId) {
      scope.zone = this.geographicData.zones.find((z) => z.id === user.zoneId);
    }

    if (user.provinceId) {
      scope.province = this.geographicData.provinces.find((p) => p.id === user.provinceId);
    }

    if (user.departmentId) {
      scope.department = this.geographicData.departments.find((d) => d.id === user.departmentId);
    }

    if (user.clusterId) {
      scope.cluster = this.geographicData.clusters.find((c) => c.id === user.clusterId);
    }

    if (user.schoolId) {
      scope.school = this.geographicData.schools.find((s) => s.id === user.schoolId);
    }

    return scope;
  }

  async getManagedEntities(user: User): Promise<any[]> {
    const entities: any[] = [];

    switch (user.role) {
      case UserRole.ADMINISTRATOR:
        entities.push(...this.geographicData.zones);
        break;

      case UserRole.ZONE:
        if (user.zoneId) {
          const provinces = this.geographicData.provinces.filter((p) => p.zoneId === user.zoneId);
          entities.push(...provinces);
        }
        break;

      case UserRole.PROVINCIAL:
        if (user.provinceId) {
          const departments = this.geographicData.departments.filter(
            (d) => d.provinceId === user.provinceId,
          );
          entities.push(...departments);
        }
        break;

      case UserRole.DEPARTMENT:
        if (user.departmentId) {
          const clusters = this.geographicData.clusters.filter(
            (c) => c.departmentId === user.departmentId,
          );
          entities.push(...clusters);
        }
        break;

      case UserRole.CLUSTER:
        if (user.clusterId) {
          const schools = this.geographicData.schools.filter((s) => s.clusterId === user.clusterId);
          entities.push(...schools);
        }
        break;

      case UserRole.DIRECTOR:
        if (user.schoolId) {
          const school = this.geographicData.schools.find((s) => s.id === user.schoolId);
          if (school) entities.push(school);
        }
        break;

      default:
        // Teachers manage no entities
        break;
    }

    return entities;
  }

  async getAccessibleUsers(currentUser: User, filterDto?: HierarchyFilterDto): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // Apply role-based filtering
    await this.applyHierarchicalFiltering(queryBuilder, currentUser, 'user');

    // Apply additional filters
    if (filterDto?.role) {
      queryBuilder.andWhere('user.role = :role', { role: filterDto.role });
    }

    if (filterDto?.zoneId) {
      queryBuilder.andWhere('user.zoneId = :zoneId', { zoneId: filterDto.zoneId });
    }

    if (filterDto?.provinceId) {
      queryBuilder.andWhere('user.provinceId = :provinceId', { provinceId: filterDto.provinceId });
    }

    if (filterDto?.departmentId) {
      queryBuilder.andWhere('user.departmentId = :departmentId', {
        departmentId: filterDto.departmentId,
      });
    }

    if (filterDto?.clusterId) {
      queryBuilder.andWhere('user.clusterId = :clusterId', { clusterId: filterDto.clusterId });
    }

    if (filterDto?.schoolId) {
      queryBuilder.andWhere('user.schoolId = :schoolId', { schoolId: filterDto.schoolId });
    }

    return queryBuilder.getMany();
  }

  async getBreadcrumbs(
    user: User,
    entityType?: string,
    entityId?: string,
  ): Promise<BreadcrumbDto[]> {
    const breadcrumbs: BreadcrumbDto[] = [];

    // Start with user's location scope
    const locationScope = await this.getUserLocationScope(user);

    // Build breadcrumbs from top to bottom
    if (locationScope.zone) {
      breadcrumbs.push({
        level: 'zone',
        id: locationScope.zone.id,
        name: locationScope.zone.name,
        nameKh: locationScope.zone.nameKh,
        path: `/hierarchy/zone/${locationScope.zone.id}`,
      });
    }

    if (locationScope.province) {
      breadcrumbs.push({
        level: 'province',
        id: locationScope.province.id,
        name: locationScope.province.name,
        nameKh: locationScope.province.nameKh,
        path: `/hierarchy/province/${locationScope.province.id}`,
      });
    }

    if (locationScope.department) {
      breadcrumbs.push({
        level: 'department',
        id: locationScope.department.id,
        name: locationScope.department.name,
        nameKh: locationScope.department.nameKh,
        path: `/hierarchy/department/${locationScope.department.id}`,
      });
    }

    if (locationScope.cluster) {
      breadcrumbs.push({
        level: 'cluster',
        id: locationScope.cluster.id,
        name: locationScope.cluster.name,
        nameKh: locationScope.cluster.nameKh,
        path: `/hierarchy/cluster/${locationScope.cluster.id}`,
      });
    }

    if (locationScope.school) {
      breadcrumbs.push({
        level: 'school',
        id: locationScope.school.id,
        name: locationScope.school.name,
        nameKh: locationScope.school.nameKh,
        path: `/hierarchy/school/${locationScope.school.id}`,
      });
    }

    // Add specific entity if provided
    if (entityType && entityId) {
      const entity = await this.getEntityById(entityType, entityId);
      if (entity) {
        breadcrumbs.push({
          level: entityType,
          id: entityId,
          name: entity.name,
          nameKh: entity.nameKh,
          path: `/hierarchy/${entityType}/${entityId}`,
        });
      }
    }

    return breadcrumbs;
  }

  async validateUserAccess(
    currentUser: User,
    targetEntityType: string,
    targetEntityId: string,
  ): Promise<boolean> {
    const hierarchyLevel = await this.getHierarchyLevel(currentUser.role);

    // Administrators have access to everything
    if (currentUser.role === UserRole.ADMINISTRATOR) {
      return true;
    }

    // Get user's location scope
    const locationScope = await this.getUserLocationScope(currentUser);

    // Validate access based on hierarchy
    switch (targetEntityType) {
      case 'zone':
        return currentUser.role === UserRole.ZONE && currentUser.zoneId === targetEntityId;

      case 'province':
        if (currentUser.role === UserRole.ZONE) {
          const province = this.geographicData.provinces.find((p) => p.id === targetEntityId);
          return province?.zoneId === currentUser.zoneId;
        }
        return (
          currentUser.role === UserRole.PROVINCIAL && currentUser.provinceId === targetEntityId
        );

      case 'department':
        if ([UserRole.ZONE, UserRole.PROVINCIAL].includes(currentUser.role)) {
          const department = this.geographicData.departments.find((d) => d.id === targetEntityId);
          if (currentUser.role === UserRole.ZONE) {
            const province = this.geographicData.provinces.find(
              (p) => p.id === department?.provinceId,
            );
            return province?.zoneId === currentUser.zoneId;
          }
          return department?.provinceId === currentUser.provinceId;
        }
        return (
          currentUser.role === UserRole.DEPARTMENT && currentUser.departmentId === targetEntityId
        );

      case 'cluster':
        // Similar logic for cluster access
        return this.validateClusterAccess(currentUser, targetEntityId);

      case 'school':
        // Similar logic for school access
        return this.validateSchoolAccess(currentUser, targetEntityId);

      default:
        return false;
    }
  }

  async applyHierarchicalFiltering(
    queryBuilder: any,
    currentUser: User,
    tableAlias: string,
  ): Promise<void> {
    if (currentUser.role === UserRole.ADMINISTRATOR) {
      // Administrators can see everything
      return;
    }

    const conditions: string[] = [];
    const parameters: any = {};

    switch (currentUser.role) {
      case UserRole.ZONE:
        if (currentUser.zoneId) {
          conditions.push(`${tableAlias}.zoneId = :zoneId`);
          parameters.zoneId = currentUser.zoneId;
        }
        break;

      case UserRole.PROVINCIAL:
        if (currentUser.provinceId) {
          conditions.push(`${tableAlias}.provinceId = :provinceId`);
          parameters.provinceId = currentUser.provinceId;
        }
        break;

      case UserRole.DEPARTMENT:
        if (currentUser.departmentId) {
          conditions.push(`${tableAlias}.departmentId = :departmentId`);
          parameters.departmentId = currentUser.departmentId;
        }
        break;

      case UserRole.CLUSTER:
        if (currentUser.clusterId) {
          conditions.push(`${tableAlias}.clusterId = :clusterId`);
          parameters.clusterId = currentUser.clusterId;
        }
        break;

      case UserRole.DIRECTOR:
        if (currentUser.schoolId) {
          conditions.push(`${tableAlias}.schoolId = :schoolId`);
          parameters.schoolId = currentUser.schoolId;
        }
        break;

      case UserRole.TEACHER:
        // Teachers can only see their own data
        conditions.push(`${tableAlias}.id = :userId`);
        parameters.userId = currentUser.id;
        break;
    }

    if (conditions.length > 0) {
      queryBuilder.andWhere(`(${conditions.join(' OR ')})`, parameters);
    }
  }

  private async getAccessibleDataCounts(
    user: User,
  ): Promise<{ users: number; sessions: number; plans: number }> {
    // Mock data counts - in production, these would be actual database queries
    const multiplier = this.getDataMultiplier(user.role);

    return {
      users: Math.floor(Math.random() * 100) * multiplier,
      sessions: Math.floor(Math.random() * 500) * multiplier,
      plans: Math.floor(Math.random() * 200) * multiplier,
    };
  }

  private getDataMultiplier(role: UserRole): number {
    switch (role) {
      case UserRole.ADMINISTRATOR:
        return 10;
      case UserRole.ZONE:
        return 8;
      case UserRole.PROVINCIAL:
        return 6;
      case UserRole.DEPARTMENT:
        return 4;
      case UserRole.CLUSTER:
        return 3;
      case UserRole.DIRECTOR:
        return 2;
      case UserRole.TEACHER:
        return 1;
      default:
        return 1;
    }
  }

  private getRoleName(role: UserRole): string {
    const roleNames = {
      [UserRole.ADMINISTRATOR]: 'Administrator',
      [UserRole.ZONE]: 'Zone Manager',
      [UserRole.PROVINCIAL]: 'Provincial Manager',
      [UserRole.DEPARTMENT]: 'Department Manager',
      [UserRole.CLUSTER]: 'Cluster Manager',
      [UserRole.DIRECTOR]: 'School Director',
      [UserRole.TEACHER]: 'Teacher',
    };
    return roleNames[role] || role.toString();
  }

  private getRoleNameKh(role: UserRole): string {
    const roleNamesKh = {
      [UserRole.ADMINISTRATOR]: 'អ្នកគ្រប់គ្រងប្រព័ន្ធ',
      [UserRole.ZONE]: 'អ្នកគ្រប់គ្រងតំបន់',
      [UserRole.PROVINCIAL]: 'អ្នកគ្រប់គ្រងខេត្ត',
      [UserRole.DEPARTMENT]: 'អ្នកគ្រប់គ្រងនាយកដ្ឋាន',
      [UserRole.CLUSTER]: 'អ្នកគ្រប់គ្រងចង្កោម',
      [UserRole.DIRECTOR]: 'នាយកសាលារៀន',
      [UserRole.TEACHER]: 'គ្រូបង្រៀន',
    };
    return roleNamesKh[role] || role.toString();
  }

  private async getEntityById(entityType: string, entityId: string): Promise<any> {
    switch (entityType) {
      case 'zone':
        return this.geographicData.zones.find((z) => z.id === entityId);
      case 'province':
        return this.geographicData.provinces.find((p) => p.id === entityId);
      case 'department':
        return this.geographicData.departments.find((d) => d.id === entityId);
      case 'cluster':
        return this.geographicData.clusters.find((c) => c.id === entityId);
      case 'school':
        return this.geographicData.schools.find((s) => s.id === entityId);
      default:
        return null;
    }
  }

  private validateClusterAccess(currentUser: User, clusterId: string): boolean {
    const cluster = this.geographicData.clusters.find((c) => c.id === clusterId);
    if (!cluster) return false;

    switch (currentUser.role) {
      case UserRole.CLUSTER:
        return currentUser.clusterId === clusterId;
      case UserRole.DEPARTMENT:
        return currentUser.departmentId === cluster.departmentId;
      case UserRole.PROVINCIAL:
        const department = this.geographicData.departments.find(
          (d) => d.id === cluster.departmentId,
        );
        return currentUser.provinceId === department?.provinceId;
      case UserRole.ZONE:
        const dept = this.geographicData.departments.find((d) => d.id === cluster.departmentId);
        const province = this.geographicData.provinces.find((p) => p.id === dept?.provinceId);
        return currentUser.zoneId === province?.zoneId;
      default:
        return false;
    }
  }

  private validateSchoolAccess(currentUser: User, schoolId: string): boolean {
    const school = this.geographicData.schools.find((s) => s.id === schoolId);
    if (!school) return false;

    switch (currentUser.role) {
      case UserRole.DIRECTOR:
        return currentUser.schoolId === schoolId;
      case UserRole.CLUSTER:
        return currentUser.clusterId === school.clusterId;
      default:
        // Use similar logic as cluster access for higher levels
        return this.validateClusterAccess(currentUser, school.clusterId);
    }
  }
}
