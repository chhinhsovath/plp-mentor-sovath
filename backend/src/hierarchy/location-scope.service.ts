import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { LocationScopeDto } from './dto/hierarchy-filter.dto';

export interface GeographicEntity {
  id: string;
  name: string;
  nameKh: string;
  parentId?: string;
  level: string;
}

export interface LocationHierarchy {
  zone?: GeographicEntity;
  province?: GeographicEntity;
  department?: GeographicEntity;
  cluster?: GeographicEntity;
  school?: GeographicEntity;
}

@Injectable()
export class LocationScopeService {
  // Mock geographic data - in production, this would come from dedicated geographic entities tables
  private readonly geographicData = {
    zones: [
      { id: 'zone-001', name: 'Central Zone', nameKh: 'តំបន់កណ្តាល', level: 'zone' },
      { id: 'zone-002', name: 'Northern Zone', nameKh: 'តំបន់ខាងជើង', level: 'zone' },
      { id: 'zone-003', name: 'Southern Zone', nameKh: 'តំបន់ខាងត្បូង', level: 'zone' },
      { id: 'zone-004', name: 'Eastern Zone', nameKh: 'តំបន់ខាងកើត', level: 'zone' },
      { id: 'zone-005', name: 'Western Zone', nameKh: 'តំបន់ខាងលិច', level: 'zone' },
    ],
    provinces: [
      {
        id: 'province-001',
        name: 'Phnom Penh',
        nameKh: 'ភ្នំពេញ',
        zoneId: 'zone-001',
        level: 'province',
      },
      {
        id: 'province-002',
        name: 'Kandal',
        nameKh: 'កណ្តាល',
        zoneId: 'zone-001',
        level: 'province',
      },
      {
        id: 'province-003',
        name: 'Siem Reap',
        nameKh: 'សៀមរាប',
        zoneId: 'zone-002',
        level: 'province',
      },
      {
        id: 'province-004',
        name: 'Battambang',
        nameKh: 'បាត់ដំបង',
        zoneId: 'zone-002',
        level: 'province',
      },
      { id: 'province-005', name: 'Kampot', nameKh: 'កំពត', zoneId: 'zone-003', level: 'province' },
      {
        id: 'province-006',
        name: 'Preah Vihear',
        nameKh: 'ព្រះវិហារ',
        zoneId: 'zone-002',
        level: 'province',
      },
      { id: 'province-007', name: 'Takeo', nameKh: 'តាកែវ', zoneId: 'zone-003', level: 'province' },
      {
        id: 'province-008',
        name: 'Banteay Meanchey',
        nameKh: 'បន្ទាយមានជ័យ',
        zoneId: 'zone-005',
        level: 'province',
      },
    ],
    departments: [
      {
        id: 'dept-001',
        name: 'Phnom Penh Education Department',
        nameKh: 'នាយកដ្ឋានអប់រំភ្នំពេញ',
        provinceId: 'province-001',
        level: 'department',
      },
      {
        id: 'dept-002',
        name: 'Kandal Education Department',
        nameKh: 'នាយកដ្ឋានអប់រំកណ្តាល',
        provinceId: 'province-002',
        level: 'department',
      },
      {
        id: 'dept-003',
        name: 'Siem Reap Education Department',
        nameKh: 'នាយកដ្ឋានអប់រំសៀមរាប',
        provinceId: 'province-003',
        level: 'department',
      },
      {
        id: 'dept-004',
        name: 'Battambang Education Department',
        nameKh: 'នាយកដ្ឋានអប់រំបាត់ដំបង',
        provinceId: 'province-004',
        level: 'department',
      },
      {
        id: 'dept-005',
        name: 'Kampot Education Department',
        nameKh: 'នាយកដ្ឋានអប់រំកំពត',
        provinceId: 'province-005',
        level: 'department',
      },
    ],
    clusters: [
      {
        id: 'cluster-001',
        name: 'Daun Penh Cluster',
        nameKh: 'ចង្កោមដូនពេញ',
        departmentId: 'dept-001',
        level: 'cluster',
      },
      {
        id: 'cluster-002',
        name: 'Chamkar Mon Cluster',
        nameKh: 'ចង្កោមចំការមន',
        departmentId: 'dept-001',
        level: 'cluster',
      },
      {
        id: 'cluster-003',
        name: 'Kandal Stung Cluster',
        nameKh: 'ចង្កោមកណ្តាលស្ទឹង',
        departmentId: 'dept-002',
        level: 'cluster',
      },
      {
        id: 'cluster-004',
        name: 'Siem Reap Central Cluster',
        nameKh: 'ចង្កោមសៀមរាបកណ្តាល',
        departmentId: 'dept-003',
        level: 'cluster',
      },
      {
        id: 'cluster-005',
        name: 'Battambang North Cluster',
        nameKh: 'ចង្កោមបាត់ដំបងខាងជើង',
        departmentId: 'dept-004',
        level: 'cluster',
      },
    ],
    schools: [
      {
        id: 'school-001',
        name: 'Hun Sen Primary School',
        nameKh: 'សាលាបឋមសិក្សាហ៊ុនសែន',
        clusterId: 'cluster-001',
        level: 'school',
      },
      {
        id: 'school-002',
        name: 'Preah Sisowath High School',
        nameKh: 'វិទ្យាល័យព្រះសីសុវត្ថិ',
        clusterId: 'cluster-001',
        level: 'school',
      },
      {
        id: 'school-003',
        name: 'Kandal Primary School',
        nameKh: 'សាលាបឋមសិក្សាកណ្តាល',
        clusterId: 'cluster-003',
        level: 'school',
      },
      {
        id: 'school-004',
        name: 'Angkor High School',
        nameKh: 'វិទ្យាល័យអង្គរ',
        clusterId: 'cluster-004',
        level: 'school',
      },
      {
        id: 'school-005',
        name: 'Battambang Central School',
        nameKh: 'សាលាបាត់ដំបងកណ្តាល',
        clusterId: 'cluster-005',
        level: 'school',
      },
      {
        id: 'school-006',
        name: 'Wat Phnom Primary School',
        nameKh: 'សាលាបឋមសិក្សាវត្តភ្នំ',
        clusterId: 'cluster-002',
        level: 'school',
      },
    ],
  };

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getUserLocationScope(user: User): Promise<LocationScopeDto> {
    const scope: LocationScopeDto = {};

    // Build location scope based on user's assigned IDs
    if (user.zoneId) {
      scope.zone = this.geographicData.zones.find((z) => z.id === user.zoneId);
    }

    if (user.provinceId) {
      const province = this.geographicData.provinces.find((p) => p.id === user.provinceId);
      if (province) {
        scope.province = {
          id: province.id,
          name: province.name,
          nameKh: province.nameKh,
          zoneId: province.zoneId,
        };
      }
    }

    if (user.departmentId) {
      const department = this.geographicData.departments.find((d) => d.id === user.departmentId);
      if (department) {
        scope.department = {
          id: department.id,
          name: department.name,
          nameKh: department.nameKh,
          provinceId: department.provinceId,
        };
      }
    }

    if (user.clusterId) {
      const cluster = this.geographicData.clusters.find((c) => c.id === user.clusterId);
      if (cluster) {
        scope.cluster = {
          id: cluster.id,
          name: cluster.name,
          nameKh: cluster.nameKh,
          departmentId: cluster.departmentId,
        };
      }
    }

    if (user.schoolId) {
      const school = this.geographicData.schools.find((s) => s.id === user.schoolId);
      if (school) {
        scope.school = {
          id: school.id,
          name: school.name,
          nameKh: school.nameKh,
          clusterId: school.clusterId,
        };
      }
    }

    return scope;
  }

  async getLocationHierarchy(user: User): Promise<LocationHierarchy> {
    const hierarchy: LocationHierarchy = {};
    const scope = await this.getUserLocationScope(user);

    // Build complete hierarchy from user's scope
    if (scope.school) {
      hierarchy.school = {
        id: scope.school.id,
        name: scope.school.name,
        nameKh: scope.school.nameKh,
        level: 'school',
      };

      // Get cluster from school
      const cluster = this.geographicData.clusters.find((c) => c.id === scope.school.clusterId);
      if (cluster) {
        hierarchy.cluster = {
          id: cluster.id,
          name: cluster.name,
          nameKh: cluster.nameKh,
          level: 'cluster',
          parentId: cluster.departmentId,
        };
      }
    }

    if (scope.cluster || hierarchy.cluster) {
      const clusterId = scope.cluster?.id || hierarchy.cluster?.id;
      const cluster = this.geographicData.clusters.find((c) => c.id === clusterId);

      if (cluster) {
        hierarchy.cluster = hierarchy.cluster || {
          id: cluster.id,
          name: cluster.name,
          nameKh: cluster.nameKh,
          level: 'cluster',
          parentId: cluster.departmentId,
        };

        // Get department from cluster
        const department = this.geographicData.departments.find(
          (d) => d.id === cluster.departmentId,
        );
        if (department) {
          hierarchy.department = {
            id: department.id,
            name: department.name,
            nameKh: department.nameKh,
            level: 'department',
            parentId: department.provinceId,
          };
        }
      }
    }

    if (scope.department || hierarchy.department) {
      const departmentId = scope.department?.id || hierarchy.department?.id;
      const department = this.geographicData.departments.find((d) => d.id === departmentId);

      if (department) {
        hierarchy.department = hierarchy.department || {
          id: department.id,
          name: department.name,
          nameKh: department.nameKh,
          level: 'department',
          parentId: department.provinceId,
        };

        // Get province from department
        const province = this.geographicData.provinces.find((p) => p.id === department.provinceId);
        if (province) {
          hierarchy.province = {
            id: province.id,
            name: province.name,
            nameKh: province.nameKh,
            level: 'province',
            parentId: province.zoneId,
          };
        }
      }
    }

    if (scope.province || hierarchy.province) {
      const provinceId = scope.province?.id || hierarchy.province?.id;
      const province = this.geographicData.provinces.find((p) => p.id === provinceId);

      if (province) {
        hierarchy.province = hierarchy.province || {
          id: province.id,
          name: province.name,
          nameKh: province.nameKh,
          level: 'province',
          parentId: province.zoneId,
        };

        // Get zone from province
        const zone = this.geographicData.zones.find((z) => z.id === province.zoneId);
        if (zone) {
          hierarchy.zone = {
            id: zone.id,
            name: zone.name,
            nameKh: zone.nameKh,
            level: 'zone',
          };
        }
      }
    }

    if (scope.zone) {
      hierarchy.zone = {
        id: scope.zone.id,
        name: scope.zone.name,
        nameKh: scope.zone.nameKh,
        level: 'zone',
      };
    }

    return hierarchy;
  }

  async getSubordinateEntities(user: User, entityType: string): Promise<GeographicEntity[]> {
    const entities: GeographicEntity[] = [];

    switch (user.role) {
      case UserRole.ADMINISTRATOR:
        return this.getAllEntitiesByType(entityType);

      case UserRole.ZONE:
        if (entityType === 'province' && user.zoneId) {
          return this.geographicData.provinces
            .filter((p) => p.zoneId === user.zoneId)
            .map((p) => ({ ...p, level: 'province' }));
        }
        break;

      case UserRole.PROVINCIAL:
        if (entityType === 'department' && user.provinceId) {
          return this.geographicData.departments
            .filter((d) => d.provinceId === user.provinceId)
            .map((d) => ({ ...d, level: 'department' }));
        }
        break;

      case UserRole.DEPARTMENT:
        if (entityType === 'cluster' && user.departmentId) {
          return this.geographicData.clusters
            .filter((c) => c.departmentId === user.departmentId)
            .map((c) => ({ ...c, level: 'cluster' }));
        }
        break;

      case UserRole.CLUSTER:
        if (entityType === 'school' && user.clusterId) {
          return this.geographicData.schools
            .filter((s) => s.clusterId === user.clusterId)
            .map((s) => ({ ...s, level: 'school' }));
        }
        break;
    }

    return entities;
  }

  async validateLocationAccess(user: User, entityType: string, entityId: string): Promise<boolean> {
    // Administrators have access to everything
    if (user.role === UserRole.ADMINISTRATOR) {
      return true;
    }

    const entity = await this.getEntityById(entityType, entityId);
    if (!entity) {
      return false;
    }

    // Check if entity is within user's scope
    const userScope = await this.getUserLocationScope(user);

    switch (entityType) {
      case 'zone':
        return user.role === UserRole.ZONE && user.zoneId === entityId;

      case 'province':
        if (user.role === UserRole.ZONE) {
          const province = this.geographicData.provinces.find((p) => p.id === entityId);
          return province?.zoneId === user.zoneId;
        }
        return user.role === UserRole.PROVINCIAL && user.provinceId === entityId;

      case 'department':
        return this.validateDepartmentAccess(user, entityId);

      case 'cluster':
        return this.validateClusterAccess(user, entityId);

      case 'school':
        return this.validateSchoolAccess(user, entityId);

      default:
        return false;
    }
  }

  private getAllEntitiesByType(entityType: string): GeographicEntity[] {
    switch (entityType) {
      case 'zone':
        return this.geographicData.zones.map((z) => ({ ...z, level: 'zone' }));
      case 'province':
        return this.geographicData.provinces.map((p) => ({ ...p, level: 'province' }));
      case 'department':
        return this.geographicData.departments.map((d) => ({ ...d, level: 'department' }));
      case 'cluster':
        return this.geographicData.clusters.map((c) => ({ ...c, level: 'cluster' }));
      case 'school':
        return this.geographicData.schools.map((s) => ({ ...s, level: 'school' }));
      default:
        return [];
    }
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

  private validateDepartmentAccess(user: User, departmentId: string): boolean {
    const department = this.geographicData.departments.find((d) => d.id === departmentId);
    if (!department) return false;

    switch (user.role) {
      case UserRole.DEPARTMENT:
        return user.departmentId === departmentId;
      case UserRole.PROVINCIAL:
        return user.provinceId === department.provinceId;
      case UserRole.ZONE:
        const province = this.geographicData.provinces.find((p) => p.id === department.provinceId);
        return user.zoneId === province?.zoneId;
      default:
        return false;
    }
  }

  private validateClusterAccess(user: User, clusterId: string): boolean {
    const cluster = this.geographicData.clusters.find((c) => c.id === clusterId);
    if (!cluster) return false;

    switch (user.role) {
      case UserRole.CLUSTER:
        return user.clusterId === clusterId;
      case UserRole.DEPARTMENT:
        return user.departmentId === cluster.departmentId;
      case UserRole.PROVINCIAL:
        const department = this.geographicData.departments.find(
          (d) => d.id === cluster.departmentId,
        );
        return user.provinceId === department?.provinceId;
      case UserRole.ZONE:
        const dept = this.geographicData.departments.find((d) => d.id === cluster.departmentId);
        const province = this.geographicData.provinces.find((p) => p.id === dept?.provinceId);
        return user.zoneId === province?.zoneId;
      default:
        return false;
    }
  }

  private validateSchoolAccess(user: User, schoolId: string): boolean {
    const school = this.geographicData.schools.find((s) => s.id === schoolId);
    if (!school) return false;

    switch (user.role) {
      case UserRole.DIRECTOR:
        return user.schoolId === schoolId;
      case UserRole.CLUSTER:
        return user.clusterId === school.clusterId;
      default:
        return this.validateClusterAccess(user, school.clusterId);
    }
  }
}
