import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { ObservationSession } from '../entities/observation-session.entity';
import { ImprovementPlan } from '../entities/improvement-plan.entity';
import { HierarchyFilterDto } from './dto/hierarchy-filter.dto';
import { LocationScopeService } from './location-scope.service';

export interface DataSummary {
  totalUsers: number;
  totalSessions: number;
  totalPlans: number;
  activeUsers: number;
  completedSessions: number;
  pendingPlans: number;
  scopeLevel: string;
  scopeName: string;
  scopeNameKh: string;
}

export interface FilteredDataResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

@Injectable()
export class DataFilteringService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ObservationSession)
    private sessionRepository: Repository<ObservationSession>,
    @InjectRepository(ImprovementPlan)
    private planRepository: Repository<ImprovementPlan>,
    private locationScopeService: LocationScopeService,
  ) {}

  async getDataSummary(user: User, filterDto?: HierarchyFilterDto): Promise<DataSummary> {
    const locationScope = await this.locationScopeService.getUserLocationScope(user);

    // Get filtered counts based on user's hierarchy level
    const userQuery = this.userRepository.createQueryBuilder('user');
    const sessionQuery = this.sessionRepository.createQueryBuilder('session');
    const planQuery = this.planRepository.createQueryBuilder('plan');

    // Apply hierarchical filtering to all queries
    await this.applyHierarchicalFiltering(userQuery, user, 'user');
    await this.applyHierarchicalFiltering(sessionQuery, user, 'session');
    await this.applyHierarchicalFiltering(planQuery, user, 'plan');

    // Apply additional filters if provided
    if (filterDto) {
      this.applyAdditionalFilters(userQuery, filterDto, 'user');
      this.applyAdditionalFilters(sessionQuery, filterDto, 'session');
      this.applyAdditionalFilters(planQuery, filterDto, 'plan');
    }

    // Execute count queries
    const [totalUsers, totalSessions, totalPlans] = await Promise.all([
      userQuery.getCount(),
      sessionQuery.getCount(),
      planQuery.getCount(),
    ]);

    // Get additional metrics
    const activeUsersQuery = userQuery
      .clone()
      .andWhere('user.isActive = :isActive', { isActive: true });
    const completedSessionsQuery = sessionQuery
      .clone()
      .andWhere('session.status = :status', { status: 'completed' });
    const pendingPlansQuery = planQuery
      .clone()
      .andWhere('plan.status = :status', { status: 'pending' });

    const [activeUsers, completedSessions, pendingPlans] = await Promise.all([
      activeUsersQuery.getCount(),
      completedSessionsQuery.getCount(),
      pendingPlansQuery.getCount(),
    ]);

    // Determine scope information
    const scopeInfo = this.getScopeInfo(user, locationScope);

    return {
      totalUsers,
      totalSessions,
      totalPlans,
      activeUsers,
      completedSessions,
      pendingPlans,
      scopeLevel: scopeInfo.level,
      scopeName: scopeInfo.name,
      scopeNameKh: scopeInfo.nameKh,
    };
  }

  async getFilteredUsers(
    user: User,
    filterDto: HierarchyFilterDto,
    page: number = 1,
    limit: number = 20,
  ): Promise<FilteredDataResult<User>> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // Apply hierarchical filtering
    await this.applyHierarchicalFiltering(queryBuilder, user, 'user');

    // Apply additional filters
    this.applyAdditionalFilters(queryBuilder, filterDto, 'user');

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Add ordering
    queryBuilder.orderBy('user.fullName', 'ASC');

    // Execute query
    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      hasNext: offset + limit < total,
      hasPrevious: page > 1,
    };
  }

  async getFilteredSessions(
    user: User,
    filterDto: HierarchyFilterDto,
    page: number = 1,
    limit: number = 20,
  ): Promise<FilteredDataResult<ObservationSession>> {
    const queryBuilder = this.sessionRepository.createQueryBuilder('session');

    // Apply hierarchical filtering
    await this.applyHierarchicalFiltering(queryBuilder, user, 'session');

    // Apply additional filters
    this.applyAdditionalFilters(queryBuilder, filterDto, 'session');

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Add ordering
    queryBuilder.orderBy('session.dateObserved', 'DESC');

    // Execute query
    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      hasNext: offset + limit < total,
      hasPrevious: page > 1,
    };
  }

  async getFilteredPlans(
    user: User,
    filterDto: HierarchyFilterDto,
    page: number = 1,
    limit: number = 20,
  ): Promise<FilteredDataResult<ImprovementPlan>> {
    const queryBuilder = this.planRepository.createQueryBuilder('plan');

    // Apply hierarchical filtering
    await this.applyHierarchicalFiltering(queryBuilder, user, 'plan');

    // Apply additional filters
    this.applyAdditionalFilters(queryBuilder, filterDto, 'plan');

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Add ordering
    queryBuilder.orderBy('plan.createdAt', 'DESC');

    // Execute query
    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      hasNext: offset + limit < total,
      hasPrevious: page > 1,
    };
  }

  async applyHierarchicalFiltering(
    queryBuilder: SelectQueryBuilder<any>,
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
        if (tableAlias === 'user') {
          conditions.push(`${tableAlias}.id = :userId`);
          parameters.userId = currentUser.id;
        } else {
          // For sessions and plans, filter by observer or teacher
          conditions.push(
            `${tableAlias}.observerId = :userId OR ${tableAlias}.teacherId = :userId`,
          );
          parameters.userId = currentUser.id;
        }
        break;
    }

    if (conditions.length > 0) {
      queryBuilder.andWhere(`(${conditions.join(' OR ')})`, parameters);
    }
  }

  private applyAdditionalFilters(
    queryBuilder: SelectQueryBuilder<any>,
    filterDto: HierarchyFilterDto,
    tableAlias: string,
  ): void {
    if (filterDto.role && tableAlias === 'user') {
      queryBuilder.andWhere(`${tableAlias}.role = :role`, { role: filterDto.role });
    }

    if (filterDto.zoneId) {
      queryBuilder.andWhere(`${tableAlias}.zoneId = :zoneId`, { zoneId: filterDto.zoneId });
    }

    if (filterDto.provinceId) {
      queryBuilder.andWhere(`${tableAlias}.provinceId = :provinceId`, {
        provinceId: filterDto.provinceId,
      });
    }

    if (filterDto.departmentId) {
      queryBuilder.andWhere(`${tableAlias}.departmentId = :departmentId`, {
        departmentId: filterDto.departmentId,
      });
    }

    if (filterDto.clusterId) {
      queryBuilder.andWhere(`${tableAlias}.clusterId = :clusterId`, {
        clusterId: filterDto.clusterId,
      });
    }

    if (filterDto.schoolId) {
      queryBuilder.andWhere(`${tableAlias}.schoolId = :schoolId`, { schoolId: filterDto.schoolId });
    }
  }

  private getScopeInfo(
    user: User,
    locationScope: any,
  ): { level: string; name: string; nameKh: string } {
    // Determine the most specific scope level for the user
    if (locationScope.school) {
      return {
        level: 'school',
        name: locationScope.school.name,
        nameKh: locationScope.school.nameKh,
      };
    }

    if (locationScope.cluster) {
      return {
        level: 'cluster',
        name: locationScope.cluster.name,
        nameKh: locationScope.cluster.nameKh,
      };
    }

    if (locationScope.department) {
      return {
        level: 'department',
        name: locationScope.department.name,
        nameKh: locationScope.department.nameKh,
      };
    }

    if (locationScope.province) {
      return {
        level: 'province',
        name: locationScope.province.name,
        nameKh: locationScope.province.nameKh,
      };
    }

    if (locationScope.zone) {
      return {
        level: 'zone',
        name: locationScope.zone.name,
        nameKh: locationScope.zone.nameKh,
      };
    }

    return {
      level: 'national',
      name: 'National Level',
      nameKh: 'កម្រិតជាតិ',
    };
  }

  async getUsersInScope(user: User, includeSubordinates: boolean = true): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (includeSubordinates) {
      await this.applyHierarchicalFiltering(queryBuilder, user, 'user');
    } else {
      // Only get users at the same level
      this.applySameLevelFiltering(queryBuilder, user, 'user');
    }

    queryBuilder.orderBy('user.fullName', 'ASC');
    return queryBuilder.getMany();
  }

  private applySameLevelFiltering(
    queryBuilder: SelectQueryBuilder<any>,
    currentUser: User,
    tableAlias: string,
  ): void {
    const conditions: string[] = [];
    const parameters: any = {};

    // Filter to same role and same geographic scope
    conditions.push(`${tableAlias}.role = :role`);
    parameters.role = currentUser.role;

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
    }

    if (conditions.length > 0) {
      queryBuilder.andWhere(conditions.join(' AND '), parameters);
    }
  }
}
