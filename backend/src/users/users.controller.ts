import { Controller, Get, Post, Put, Delete, Param, Patch, Body, UseGuards, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { HierarchyGuard } from '../auth/guards/hierarchy.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { HierarchyCheck } from '../auth/decorators/hierarchy-check.decorator';
import { User, UserRole } from '../entities/user.entity';
import { UserQueryDto } from './dto/user-query.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard, HierarchyGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users (filtered by permissions)' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              username: { type: 'string' },
              email: { type: 'string' },
              fullName: { type: 'string' },
              role: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  displayName: { type: 'string' },
                },
              },
              status: { type: 'string', enum: ['active', 'inactive', 'suspended'] },
              lastLogin: { type: 'string', format: 'date-time' },
              profilePicture: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  async findAll(
    @Query() query: UserQueryDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.usersService.findAll(currentUser, {
      page: query.page || 1,
      limit: query.limit || 10,
      search: query.search || '',
      roleId: query.roleId,
      status: query.status,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || 'desc',
    });
  }

  @Get('by-role/:role')
  @ApiOperation({ summary: 'Get users by role' })
  @ApiParam({
    name: 'role',
    enum: UserRole,
    description: 'User role to filter by',
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied for this role',
  })
  async getUsersByRole(@Param('role') role: UserRole, @CurrentUser() currentUser: User) {
    return this.usersService.getUsersByRole(role, currentUser);
  }

  @Get('roles')
  @ApiOperation({ summary: 'Get available roles' })
  @ApiResponse({
    status: 200,
    description: 'Roles retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              displayName: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async getRoles() {
    return this.usersService.getRoles();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        username: { type: 'string' },
        email: { type: 'string' },
        fullName: { type: 'string' },
        role: { type: 'string' },
        locationScope: { type: 'string' },
        zoneId: { type: 'string' },
        provinceId: { type: 'string' },
        departmentId: { type: 'string' },
        clusterId: { type: 'string' },
        schoolId: { type: 'string' },
        isActive: { type: 'boolean' },
        lastLogin: { type: 'string', format: 'date-time' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied',
  })
  @HierarchyCheck({ allowSelfAccess: true, resourceUserIdParam: 'id' })
  async findOne(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.usersService.findOne(id, currentUser);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update user status (activate/deactivate)' })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'User status updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied or cannot modify own status',
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL, UserRole.DIRECTOR)
  async updateUserStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
    @CurrentUser() currentUser: User,
  ) {
    return this.usersService.updateUserStatus(id, isActive, currentUser);
  }

  @Post(':id/toggle-status')
  @ApiOperation({ summary: 'Toggle user status' })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'User status toggled successfully',
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL, UserRole.DIRECTOR)
  async toggleUserStatus(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.usersService.toggleUserStatus(id, currentUser);
  }

  @Post(':id/reset-password')
  @ApiOperation({ summary: 'Reset user password' })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            temporaryPassword: { type: 'string' },
          },
        },
      },
    },
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL, UserRole.DIRECTOR)
  async resetPassword(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.usersService.resetPassword(id, currentUser);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
  })
  @Roles(UserRole.ADMINISTRATOR)
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.usersService.deleteUser(id, currentUser);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Username or email already exists',
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL, UserRole.DIRECTOR)
  async createUser(
    @Body() createUserDto: any,
    @CurrentUser() currentUser: User,
  ) {
    return this.usersService.createUser(createUserDto, currentUser);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user information' })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied',
  })
  @Roles(UserRole.ADMINISTRATOR, UserRole.ZONE, UserRole.PROVINCIAL, UserRole.DIRECTOR)
  @HierarchyCheck({ allowSelfAccess: true, resourceUserIdParam: 'id' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: any,
    @CurrentUser() currentUser: User,
  ) {
    return this.usersService.updateUser(id, updateUserDto, currentUser);
  }

  @Post(':id/upload-avatar')
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Avatar uploaded successfully',
  })
  @UseInterceptors(FileInterceptor('avatar'))
  @HierarchyCheck({ allowSelfAccess: true, resourceUserIdParam: 'id' })
  async uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @CurrentUser() currentUser: User,
  ) {
    return this.usersService.uploadAvatar(id, file, currentUser);
  }
}
