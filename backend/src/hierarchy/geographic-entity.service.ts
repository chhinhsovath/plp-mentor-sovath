import { Injectable, NotFoundException } from '@nestjs/common';
import { User, UserRole } from '../entities/user.entity';
import { HierarchyFilterDto } from './dto/hierarchy-filter.dto';
import { LocationScopeService, GeographicEntity } from './location-scope.service';

export interface EntitySelectionOption {
  id: string;
  name: string;
  nameKh: string;
  level: string;
  parentId?: string;
  parentName?: string;
  parentNameKh?: string;
  hasChildren: boolean;
  childrenCount: number;
}

export interface EntityHierarchyTree {
  id: string;
  name: string;
  nameKh: string;
  level: string;
  children: EntityHierarchyTree[];
  isAccessible: boolean;
  isManaged: boolean;
}

@Injectable()
export class GeographicEntityService {
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
      {
        id: 'dept-006',
        name: 'Preah Vihear Education Department',
        nameKh: 'នាយកដ្ឋានអប់រំព្រះវិហារ',
        provinceId: 'province-006',
        level: 'department',
      },
      {
        id: 'dept-007',
        name: 'Takeo Education Department',
        nameKh: 'នាយកដ្ឋានអប់រំតាកែវ',
        provinceId: 'province-007',
        level: 'department',
      },
      {
        id: 'dept-008',
        name: 'Banteay Meanchey Education Department',
        nameKh: 'នាយកដ្ឋានអប់រំបន្ទាយមានជ័យ',
        provinceId: 'province-008',
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
      {
        id: 'cluster-006',
        name: 'Kampot Central Cluster',
        nameKh: 'ចង្កោមកំពតកណ្តាល',
        departmentId: 'dept-005',
        level: 'cluster',
      },
      {
        id: 'cluster-007',
        name: 'Preah Vihear Cluster',
        nameKh: 'ចង្កោមព្រះវិហារ',
        departmentId: 'dept-006',
        level: 'cluster',
      },
      {
        id: 'cluster-008',
        name: 'Takeo South Cluster',
        nameKh: 'ចង្កោមតាកែវខាងត្បូង',
        departmentId: 'dept-007',
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
      {
        id: 'school-007',
        name: 'Kampot Seaside School',
        nameKh: 'សាលាកំពតមាត់សមុទ្រ',
        clusterId: 'cluster-006',
        level: 'school',
      },
      {
        id: 'school-008',
        name: 'Preah Vihear Temple School',
        nameKh: 'សាលាព្រះវិហារប្រាសាទ',
        clusterId: 'cluster-007',
        level: 'school',
      },
      {
        id: 'school-009',
        name: 'Takeo Agricultural School',
        nameKh: 'សាលាកសិកម្មតាកែវ',
        clusterId: 'cluster-008',
        level: 'school',
      },
    ],
  };

  constructor(private locationScopeService: LocationScopeService) {}

  async getEntitiesByType(
    user: User,
    entityType: string,
    filterDto?: HierarchyFilterDto,
  ): Promise<EntitySelectionOption[]> {
    // Validate entity type
    const validTypes = ['zone', 'province', 'department', 'cluster', 'school'];
    if (!validTypes.includes(entityType)) {
      throw new NotFoundException(`Invalid entity type: ${entityType}`);
    }

    // Get entities based on user's access level
    let entities: any[] = [];

    switch (entityType) {
      case 'zone':
        entities = await this.getAccessibleZones(user);
        break;
      case 'province':
        entities = await this.getAccessibleProvinces(user, filterDto);
        break;
      case 'department':
        entities = await this.getAccessibleDepartments(user, filterDto);
        break;
      case 'cluster':
        entities = await this.getAccessibleClusters(user, filterDto);
        break;
      case 'school':
        entities = await this.getAccessibleSchools(user, filterDto);
        break;
    }

    // Transform to selection options
    return entities.map((entity) => this.transformToSelectionOption(entity, entityType));
  }

  async getEntityHierarchyTree(
    user: User,
    rootEntityType?: string,
    rootEntityId?: string,
  ): Promise<EntityHierarchyTree[]> {
    // If no root specified, start from user's highest accessible level
    if (!rootEntityType || !rootEntityId) {
      return this.buildTreeFromUserScope(user);
    }

    // Build tree from specified root
    const rootEntity = await this.getEntityById(rootEntityType, rootEntityId);
    if (!rootEntity) {
      throw new NotFoundException(`Entity not found: ${rootEntityType}/${rootEntityId}`);
    }

    // Validate user has access to root entity
    const hasAccess = await this.locationScopeService.validateLocationAccess(
      user,
      rootEntityType,
      rootEntityId,
    );
    if (!hasAccess) {
      throw new NotFoundException(`Access denied to ${rootEntityType}/${rootEntityId}`);
    }

    return [await this.buildEntityTree(rootEntity, rootEntityType, user)];
  }

  async getEntitySelectionOptions(
    user: User,
    targetLevel: string,
    parentEntityType?: string,
    parentEntityId?: string,
  ): Promise<EntitySelectionOption[]> {
    let entities: any[] = [];

    if (parentEntityType && parentEntityId) {
      // Get children of specific parent
      entities = await this.getChildEntities(parentEntityType, parentEntityId, targetLevel);
    } else {
      // Get all accessible entities of target level
      entities = await this.getEntitiesByType(user, targetLevel);
    }

    // Filter based on user access
    const accessibleEntities = [];
    for (const entity of entities) {
      const hasAccess = await this.locationScopeService.validateLocationAccess(
        user,
        targetLevel,
        entity.id,
      );
      if (hasAccess) {
        accessibleEntities.push(entity);
      }
    }

    return accessibleEntities.map((entity) => this.transformToSelectionOption(entity, targetLevel));
  }

  private async getAccessibleZones(user: User): Promise<any[]> {
    if (user.role === UserRole.ADMINISTRATOR) {
      return this.geographicData.zones;
    }

    if (user.role === UserRole.ZONE && user.zoneId) {
      return this.geographicData.zones.filter((z) => z.id === user.zoneId);
    }

    return [];
  }

  private async getAccessibleProvinces(user: User, filterDto?: HierarchyFilterDto): Promise<any[]> {
    let provinces = this.geographicData.provinces;

    // Filter by zone if specified or based on user's zone
    if (filterDto?.zoneId) {
      provinces = provinces.filter((p) => p.zoneId === filterDto.zoneId);
    } else if (user.zoneId && user.role !== UserRole.ADMINISTRATOR) {
      provinces = provinces.filter((p) => p.zoneId === user.zoneId);
    }

    // Further filter based on user's province access
    if (user.role === UserRole.PROVINCIAL && user.provinceId) {
      provinces = provinces.filter((p) => p.id === user.provinceId);
    }

    return provinces;
  }

  private async getAccessibleDepartments(
    user: User,
    filterDto?: HierarchyFilterDto,
  ): Promise<any[]> {
    let departments = this.geographicData.departments;

    // Filter by province if specified or based on user's access
    if (filterDto?.provinceId) {
      departments = departments.filter((d) => d.provinceId === filterDto.provinceId);
    } else if (user.provinceId && user.role !== UserRole.ADMINISTRATOR) {
      departments = departments.filter((d) => d.provinceId === user.provinceId);
    }

    // Further filter based on user's department access
    if (user.role === UserRole.DEPARTMENT && user.departmentId) {
      departments = departments.filter((d) => d.id === user.departmentId);
    }

    return departments;
  }

  private async getAccessibleClusters(user: User, filterDto?: HierarchyFilterDto): Promise<any[]> {
    let clusters = this.geographicData.clusters;

    // Filter by department if specified or based on user's access
    if (filterDto?.departmentId) {
      clusters = clusters.filter((c) => c.departmentId === filterDto.departmentId);
    } else if (user.departmentId && user.role !== UserRole.ADMINISTRATOR) {
      clusters = clusters.filter((c) => c.departmentId === user.departmentId);
    }

    // Further filter based on user's cluster access
    if (user.role === UserRole.CLUSTER && user.clusterId) {
      clusters = clusters.filter((c) => c.id === user.clusterId);
    }

    return clusters;
  }

  private async getAccessibleSchools(user: User, filterDto?: HierarchyFilterDto): Promise<any[]> {
    let schools = this.geographicData.schools;

    // Filter by cluster if specified or based on user's access
    if (filterDto?.clusterId) {
      schools = schools.filter((s) => s.clusterId === filterDto.clusterId);
    } else if (user.clusterId && user.role !== UserRole.ADMINISTRATOR) {
      schools = schools.filter((s) => s.clusterId === user.clusterId);
    }

    // Further filter based on user's school access
    if (user.role === UserRole.DIRECTOR && user.schoolId) {
      schools = schools.filter((s) => s.id === user.schoolId);
    }

    return schools;
  }

  private transformToSelectionOption(entity: any, entityType: string): EntitySelectionOption {
    const childrenCount = this.getChildrenCount(entityType, entity.id);
    const parentInfo = this.getParentInfo(entityType, entity);

    return {
      id: entity.id,
      name: entity.name,
      nameKh: entity.nameKh,
      level: entityType,
      parentId: parentInfo?.id,
      parentName: parentInfo?.name,
      parentNameKh: parentInfo?.nameKh,
      hasChildren: childrenCount > 0,
      childrenCount,
    };
  }

  private getChildrenCount(entityType: string, entityId: string): number {
    switch (entityType) {
      case 'zone':
        return this.geographicData.provinces.filter((p) => p.zoneId === entityId).length;
      case 'province':
        return this.geographicData.departments.filter((d) => d.provinceId === entityId).length;
      case 'department':
        return this.geographicData.clusters.filter((c) => c.departmentId === entityId).length;
      case 'cluster':
        return this.geographicData.schools.filter((s) => s.clusterId === entityId).length;
      case 'school':
        return 0; // Schools have no children
      default:
        return 0;
    }
  }

  private getParentInfo(
    entityType: string,
    entity: any,
  ): { id: string; name: string; nameKh: string } | null {
    switch (entityType) {
      case 'province':
        const zone = this.geographicData.zones.find((z) => z.id === entity.zoneId);
        return zone ? { id: zone.id, name: zone.name, nameKh: zone.nameKh } : null;
      case 'department':
        const province = this.geographicData.provinces.find((p) => p.id === entity.provinceId);
        return province ? { id: province.id, name: province.name, nameKh: province.nameKh } : null;
      case 'cluster':
        const department = this.geographicData.departments.find(
          (d) => d.id === entity.departmentId,
        );
        return department
          ? { id: department.id, name: department.name, nameKh: department.nameKh }
          : null;
      case 'school':
        const cluster = this.geographicData.clusters.find((c) => c.id === entity.clusterId);
        return cluster ? { id: cluster.id, name: cluster.name, nameKh: cluster.nameKh } : null;
      default:
        return null;
    }
  }

  private async buildTreeFromUserScope(user: User): Promise<EntityHierarchyTree[]> {
    const locationScope = await this.locationScopeService.getUserLocationScope(user);
    const trees: EntityHierarchyTree[] = [];

    // Start from the highest level the user has access to
    if (user.role === UserRole.ADMINISTRATOR) {
      // Build trees for all zones
      for (const zone of this.geographicData.zones) {
        trees.push(await this.buildEntityTree(zone, 'zone', user));
      }
    } else if (locationScope.zone) {
      trees.push(await this.buildEntityTree(locationScope.zone, 'zone', user));
    }

    return trees;
  }

  private async buildEntityTree(
    entity: any,
    entityType: string,
    user: User,
  ): Promise<EntityHierarchyTree> {
    const children: EntityHierarchyTree[] = [];
    const childEntities = await this.getChildEntities(entityType, entity.id);

    for (const childEntity of childEntities) {
      const childType = this.getChildEntityType(entityType);
      if (childType) {
        const hasAccess = await this.locationScopeService.validateLocationAccess(
          user,
          childType,
          childEntity.id,
        );
        if (hasAccess) {
          children.push(await this.buildEntityTree(childEntity, childType, user));
        }
      }
    }

    const isAccessible = await this.locationScopeService.validateLocationAccess(
      user,
      entityType,
      entity.id,
    );
    const isManaged = await this.isEntityManaged(user, entityType, entity.id);

    return {
      id: entity.id,
      name: entity.name,
      nameKh: entity.nameKh,
      level: entityType,
      children,
      isAccessible,
      isManaged,
    };
  }

  private async getChildEntities(
    parentType: string,
    parentId: string,
    targetType?: string,
  ): Promise<any[]> {
    const childType = targetType || this.getChildEntityType(parentType);
    if (!childType) return [];

    switch (childType) {
      case 'province':
        return this.geographicData.provinces.filter((p) => p.zoneId === parentId);
      case 'department':
        return this.geographicData.departments.filter((d) => d.provinceId === parentId);
      case 'cluster':
        return this.geographicData.clusters.filter((c) => c.departmentId === parentId);
      case 'school':
        return this.geographicData.schools.filter((s) => s.clusterId === parentId);
      default:
        return [];
    }
  }

  private getChildEntityType(parentType: string): string | null {
    const hierarchy = {
      zone: 'province',
      province: 'department',
      department: 'cluster',
      cluster: 'school',
      school: null,
    };
    return hierarchy[parentType] || null;
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

  private async isEntityManaged(
    user: User,
    entityType: string,
    entityId: string,
  ): Promise<boolean> {
    // Check if the user directly manages this entity
    switch (user.role) {
      case UserRole.ADMINISTRATOR:
        return true;
      case UserRole.ZONE:
        return entityType === 'zone' && user.zoneId === entityId;
      case UserRole.PROVINCIAL:
        return entityType === 'province' && user.provinceId === entityId;
      case UserRole.DEPARTMENT:
        return entityType === 'department' && user.departmentId === entityId;
      case UserRole.CLUSTER:
        return entityType === 'cluster' && user.clusterId === entityId;
      case UserRole.DIRECTOR:
        return entityType === 'school' && user.schoolId === entityId;
      default:
        return false;
    }
  }
}
