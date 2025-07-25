import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { RoleHierarchyAccess } from '../entities/role-hierarchy-access.entity';
import * as bcrypt from 'bcrypt';

interface FindAllParams {
  page: number;
  limit: number;
  search?: string;
  roleId?: string;
  status?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RoleHierarchyAccess)
    private roleHierarchyRepository: Repository<RoleHierarchyAccess>,
  ) {}

  async findAll(currentUser: User, params?: FindAllParams) {
    const {
      page = 1,
      limit = 10,
      search = '',
      roleId,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params || {};

    // Get current user's role hierarchy
    const roleHierarchy = await this.roleHierarchyRepository.findOne({
      where: { role: currentUser.role },
    });

    if (!roleHierarchy) {
      throw new ForbiddenException('Role hierarchy not found');
    }

    // Build query based on user's permissions
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // Administrator can see all users
    if (currentUser.role === UserRole.ADMINISTRATOR) {
      // No additional filters needed
    } else {
      // Filter users based on hierarchy and location scope
      const managedRoles = roleHierarchy.manages;

      if (managedRoles.length > 0) {
        queryBuilder.where('user.role IN (:...roles)', { roles: managedRoles });

        // Add location scope filtering if applicable
        if (currentUser.locationScope) {
          queryBuilder.andWhere('user.locationScope = :locationScope', {
            locationScope: currentUser.locationScope,
          });
        }
      } else {
        // User can only see themselves
        queryBuilder.where('user.id = :userId', { userId: currentUser.id });
      }
    }

    // Apply search filter
    if (search) {
      queryBuilder.andWhere(
        '(user.username LIKE :search OR user.email LIKE :search OR user.fullName LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply role filter
    if (roleId) {
      queryBuilder.andWhere('user.role = :roleId', { roleId });
    }

    // Apply status filter
    if (status) {
      if (status === 'active') {
        queryBuilder.andWhere('user.isActive = :isActive', { isActive: true });
      } else if (status === 'inactive' || status === 'suspended') {
        queryBuilder.andWhere('user.isActive = :isActive', { isActive: false });
      }
    }

    // Apply sorting
    queryBuilder.orderBy(`user.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC');

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).limit(limit);

    // Execute query
    const [users, total] = await queryBuilder
      .select([
        'user.id',
        'user.username',
        'user.email',
        'user.fullName',
        'user.role',
        'user.locationScope',
        'user.isActive',
        'user.lastLogin',
        'user.createdAt',
        'user.profilePicture',
        'user.phoneNumber',
      ])
      .getManyAndCount();

    // Transform the response to match frontend expectations
    const transformedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: {
        id: user.role,
        name: user.role.toLowerCase(),
        displayName: user.role,
      },
      isActive: user.isActive,
      status: user.isActive ? 'active' : 'inactive',
      lastLogin: user.lastLogin,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt,
      phoneNumber: user.phoneNumber,
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: transformedUsers,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findOne(id: string, currentUser: User) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'username',
        'email',
        'fullName',
        'role',
        'locationScope',
        'zoneId',
        'provinceId',
        'departmentId',
        'clusterId',
        'schoolId',
        'isActive',
        'lastLogin',
        'createdAt',
        'updatedAt',
        'profilePicture',
        'phoneNumber',
        'officeLocation',
        'officeLatitude',
        'officeLongitude',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if current user can access this user
    const canAccess = await this.canAccessUser(currentUser, user);
    if (!canAccess) {
      throw new ForbiddenException('Access denied');
    }

    return user;
  }

  async updateUserStatus(id: string, isActive: boolean, currentUser: User) {
    const user = await this.findOne(id, currentUser);

    // Prevent users from deactivating themselves
    if (user.id === currentUser.id) {
      throw new ForbiddenException('Cannot modify your own status');
    }

    await this.userRepository.update(id, { isActive });

    return this.findOne(id, currentUser);
  }

  private async canAccessUser(currentUser: User, targetUser: User): Promise<boolean> {
    // Users can always access their own profile
    if (currentUser.id === targetUser.id) {
      return true;
    }

    // Administrator can access all users
    if (currentUser.role === UserRole.ADMINISTRATOR) {
      return true;
    }

    // Get current user's role hierarchy
    const roleHierarchy = await this.roleHierarchyRepository.findOne({
      where: { role: currentUser.role },
    });

    if (!roleHierarchy) {
      return false;
    }

    // Check if current user can manage target user's role
    const canManage = roleHierarchy.manages.includes(targetUser.role);
    if (!canManage) {
      return false;
    }

    // Check location scope if applicable
    if (currentUser.locationScope && targetUser.locationScope) {
      return currentUser.locationScope === targetUser.locationScope;
    }

    return true;
  }

  async getUsersByRole(role: UserRole, currentUser: User) {
    // Check if current user can access users with this role
    const roleHierarchy = await this.roleHierarchyRepository.findOne({
      where: { role: currentUser.role },
    });

    if (!roleHierarchy) {
      throw new ForbiddenException('Role hierarchy not found');
    }

    if (currentUser.role !== UserRole.ADMINISTRATOR && !roleHierarchy.manages.includes(role)) {
      throw new ForbiddenException('Access denied for this role');
    }

    return this.userRepository.find({
      where: { role, isActive: true },
      select: ['id', 'username', 'fullName', 'email', 'locationScope'],
    });
  }

  async toggleUserStatus(id: string, currentUser: User) {
    const user = await this.findOne(id, currentUser);

    // Prevent users from toggling their own status
    if (user.id === currentUser.id) {
      throw new ForbiddenException('Cannot modify your own status');
    }

    const newStatus = !user.isActive;
    await this.userRepository.update(id, { isActive: newStatus });

    const updatedUser = await this.findOne(id, currentUser);
    
    return {
      success: true,
      data: {
        ...updatedUser,
        role: {
          id: updatedUser.role,
          name: updatedUser.role.toLowerCase(),
          displayName: updatedUser.role,
        },
        status: updatedUser.isActive ? 'active' : 'inactive',
      },
    };
  }

  async resetPassword(id: string, currentUser: User) {
    const user = await this.findOne(id, currentUser);

    // Generate a temporary password
    const temporaryPassword = this.generateTemporaryPassword();

    // Hash the password
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    await this.userRepository.update(id, { password: hashedPassword });

    return {
      success: true,
      data: {
        temporaryPassword,
      },
    };
  }

  async deleteUser(id: string, currentUser: User) {
    const user = await this.findOne(id, currentUser);

    // Prevent users from deleting themselves
    if (user.id === currentUser.id) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    await this.userRepository.delete(id);

    return {
      success: true,
      message: 'User deleted successfully',
    };
  }

  async getRoles() {
    const roles = Object.values(UserRole).map((role) => ({
      id: role,
      name: role.toLowerCase(),
      displayName: role,
    }));

    return {
      success: true,
      data: roles,
    };
  }

  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  async createUser(createUserDto: any, currentUser: User) {
    // Validate required fields
    if (!createUserDto.username || !createUserDto.email || !createUserDto.password) {
      throw new BadRequestException('Username, email, and password are required');
    }

    // Check if username already exists
    const existingUsername = await this.userRepository.findOne({
      where: { username: createUserDto.username },
    });
    if (existingUsername) {
      throw new BadRequestException('Username already exists');
    }

    // Check if email already exists
    const existingEmail = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingEmail) {
      throw new BadRequestException('Email already exists');
    }

    // Check if current user can create users with the specified role
    const roleToAssign = createUserDto.roleId || createUserDto.role || UserRole.TEACHER;
    const roleHierarchy = await this.roleHierarchyRepository.findOne({
      where: { role: currentUser.role },
    });

    if (!roleHierarchy || !roleHierarchy.manages.includes(roleToAssign)) {
      throw new ForbiddenException(`You cannot create users with role: ${roleToAssign}`);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create the user
    const user = this.userRepository.create({
      username: createUserDto.username,
      email: createUserDto.email,
      password: hashedPassword,
      fullName: createUserDto.fullName || `${createUserDto.firstName || ''} ${createUserDto.lastName || ''}`.trim(),
      role: roleToAssign,
      phoneNumber: createUserDto.phoneNumber,
      preferredLanguage: createUserDto.preferredLanguage || 'km',
      bio: createUserDto.bio,
      isActive: createUserDto.status === 'active' || true,
      // Location fields
      zoneId: createUserDto.zoneId,
      provinceId: createUserDto.provinceId,
      departmentId: createUserDto.departmentId,
      clusterId: createUserDto.clusterId,
      schoolId: createUserDto.schoolId,
    });

    // Save the user
    const savedUser = await this.userRepository.save(user);

    // Return user without password
    const { password, ...userWithoutPassword } = savedUser;
    return userWithoutPassword;
  }

  async updateUser(id: string, updateUserDto: any, currentUser: User) {
    const user = await this.findOne(id, currentUser);

    // Check if trying to update role
    if (updateUserDto.roleId && updateUserDto.roleId !== user.role) {
      // Check if current user can assign this role
      const roleHierarchy = await this.roleHierarchyRepository.findOne({
        where: { role: currentUser.role },
      });

      if (!roleHierarchy || !roleHierarchy.manages.includes(updateUserDto.roleId)) {
        throw new ForbiddenException('Cannot assign this role');
      }
    }

    // Check if email is being changed and already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ForbiddenException('Email already in use');
      }
    }

    // Update user - only include fields that are defined
    const updateData: any = {};
    
    if (updateUserDto.fullName !== undefined) updateData.fullName = updateUserDto.fullName;
    if (updateUserDto.email !== undefined) updateData.email = updateUserDto.email;
    if (updateUserDto.phoneNumber !== undefined) updateData.phoneNumber = updateUserDto.phoneNumber;
    if (updateUserDto.isActive !== undefined) {
      // Handle boolean values that might come as strings from FormData
      if (typeof updateUserDto.isActive === 'string') {
        updateData.isActive = updateUserDto.isActive === 'true';
      } else {
        updateData.isActive = updateUserDto.isActive;
      }
    }
    if (updateUserDto.officeLocation !== undefined) updateData.officeLocation = updateUserDto.officeLocation;
    if (updateUserDto.officeLatitude !== undefined) updateData.officeLatitude = updateUserDto.officeLatitude;
    if (updateUserDto.officeLongitude !== undefined) updateData.officeLongitude = updateUserDto.officeLongitude;

    if (updateUserDto.roleId) {
      updateData.role = updateUserDto.roleId;
    }

    await this.userRepository.update(id, updateData);

    const updatedUser = await this.findOne(id, currentUser);

    return {
      success: true,
      data: updatedUser,
    };
  }

  async uploadAvatar(id: string, file: any, currentUser: User) {
    const user = await this.findOne(id, currentUser);

    if (!file) {
      throw new ForbiddenException('No file uploaded');
    }

    // In a real application, you would:
    // 1. Validate the file (size, type, etc.)
    // 2. Upload to a storage service (S3, etc.)
    // 3. Save the URL to the database
    
    // For now, we'll just save a placeholder URL
    const avatarUrl = `/uploads/avatars/${id}/${file.originalname}`;

    await this.userRepository.update(id, { profilePicture: avatarUrl });

    return {
      success: true,
      data: {
        profilePicture: avatarUrl,
      },
    };
  }
}
