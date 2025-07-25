import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HierarchyService, UserHierarchyInfo } from './hierarchy.service';
import { LocationScopeService } from './location-scope.service';
import { DataFilteringService } from './data-filtering.service';
import { GeographicEntityService } from './geographic-entity.service';
import { HierarchyFilterDto, BreadcrumbDto } from './dto/hierarchy-filter.dto';
import { User } from '../entities/user.entity';

@ApiTags('hierarchy')
@Controller('hierarchy')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HierarchyController {
  constructor(
    private readonly hierarchyService: HierarchyService,
    private readonly locationScopeService: LocationScopeService,
    private readonly dataFilteringService: DataFilteringService,
    private readonly geographicEntityService: GeographicEntityService,
  ) {}

  @Get('user-info')
  @ApiOperation({ summary: 'Get current user hierarchy information' })
  @ApiResponse({
    status: 200,
    description: 'User hierarchy information retrieved successfully',
  })
  async getUserHierarchyInfo(@Request() req): Promise<UserHierarchyInfo> {
    return this.hierarchyService.getUserHierarchyInfo(req.user.id);
  }

  @Get('accessible-users')
  @ApiOperation({ summary: 'Get users accessible to current user based on hierarchy' })
  @ApiResponse({
    status: 200,
    description: 'Accessible users retrieved successfully',
  })
  async getAccessibleUsers(
    @Request() req,
    @Query() filterDto: HierarchyFilterDto,
  ): Promise<User[]> {
    return this.hierarchyService.getAccessibleUsers(req.user, filterDto);
  }

  @Get('breadcrumbs')
  @ApiOperation({ summary: 'Get breadcrumb navigation for current user context' })
  @ApiResponse({
    status: 200,
    description: 'Breadcrumbs retrieved successfully',
  })
  async getBreadcrumbs(
    @Request() req,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ): Promise<BreadcrumbDto[]> {
    return this.hierarchyService.getBreadcrumbs(req.user, entityType, entityId);
  }

  @Get('location-scope')
  @ApiOperation({ summary: 'Get location scope for current user' })
  @ApiResponse({
    status: 200,
    description: 'Location scope retrieved successfully',
  })
  async getLocationScope(@Request() req) {
    return this.locationScopeService.getUserLocationScope(req.user);
  }

  @Get('managed-entities')
  @ApiOperation({ summary: 'Get entities managed by current user' })
  @ApiResponse({
    status: 200,
    description: 'Managed entities retrieved successfully',
  })
  async getManagedEntities(@Request() req) {
    return this.hierarchyService.getManagedEntities(req.user);
  }

  @Get('geographic-entities/:type')
  @ApiOperation({ summary: 'Get geographic entities by type within user scope' })
  @ApiResponse({
    status: 200,
    description: 'Geographic entities retrieved successfully',
  })
  async getGeographicEntities(
    @Request() req,
    @Param('type') type: string,
    @Query() filterDto: HierarchyFilterDto,
  ) {
    return this.geographicEntityService.getEntitiesByType(req.user, type, filterDto);
  }

  @Get('validate-access/:entityType/:entityId')
  @ApiOperation({ summary: 'Validate user access to specific entity' })
  @ApiResponse({
    status: 200,
    description: 'Access validation result',
  })
  async validateAccess(
    @Request() req,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ): Promise<{ hasAccess: boolean }> {
    const hasAccess = await this.hierarchyService.validateUserAccess(
      req.user,
      entityType,
      entityId,
    );

    if (!hasAccess) {
      throw new ForbiddenException(`Access denied to ${entityType} with ID ${entityId}`);
    }

    return { hasAccess };
  }

  @Get('data-summary')
  @ApiOperation({ summary: 'Get data summary within user scope' })
  @ApiResponse({
    status: 200,
    description: 'Data summary retrieved successfully',
  })
  async getDataSummary(@Request() req, @Query() filterDto: HierarchyFilterDto) {
    return this.dataFilteringService.getDataSummary(req.user, filterDto);
  }
}
