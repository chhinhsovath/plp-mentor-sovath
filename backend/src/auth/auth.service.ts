import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User, UserRole } from '../entities/user.entity';
import { RoleHierarchyAccess } from '../entities/role-hierarchy-access.entity';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { UserSession } from '../entities/user-session.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AuditService } from '../common/services/audit.service';
import { AuditAction, AuditEntityType } from '../entities/audit-log.entity';
import { EncryptionService } from '../common/services/encryption.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RoleHierarchyAccess)
    private roleHierarchyRepository: Repository<RoleHierarchyAccess>,
    @InjectRepository(PasswordResetToken)
    private passwordResetTokenRepository: Repository<PasswordResetToken>,
    @InjectRepository(UserSession)
    private userSessionRepository: Repository<UserSession>,
    private jwtService: JwtService,
    private auditService: AuditService,
    private encryptionService: EncryptionService,
  ) {}

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { username },
      select: [
        'id',
        'username',
        'email',
        'password',
        'fullName',
        'role',
        'locationScope',
        'isActive',
      ],
    });

    if (!user || !user.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // Remove password from returned user object
    const { password: _, ...result } = user;
    return result as User;
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.validateUser(loginDto.username, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.userRepository.update(user.id, { lastLogin: new Date() });

    // Get user permissions
    const permissions = await this.getUserPermissions(user.role);

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      locationScope: user.locationScope,
    };

    const access_token = this.jwtService.sign(payload);
    
    // Create user session - TEMPORARILY DISABLED FOR DEVELOPMENT
    // TODO: Fix UserSession entity registration
    // const session = this.userSessionRepository.create({
    //   userId: user.id,
    //   token: access_token,
    //   ipAddress,
    //   userAgent,
    //   expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    // });
    
    // await this.userSessionRepository.save(session);

    return {
      access_token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        locationScope: user.locationScope,
        permissions,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ username: registerDto.username }, { email: registerDto.email }],
    });

    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    // Create user
    const user = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);

    // Remove password from response
    const { password: _, ...result } = savedUser;
    return result;
  }

  async getUserPermissions(role: UserRole) {
    const roleHierarchy = await this.roleHierarchyRepository.findOne({
      where: { role: role.toString() },
    });

    return roleHierarchy || null;
  }

  async validateJwtPayload(payload: JwtPayload): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }

  async refreshToken(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      locationScope: user.locationScope,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async getUserProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: [
        'id',
        'username',
        'email',
        'fullName',
        'role',
        'locationScope',
        'isActive',
        'lastLogin',
        'createdAt',
        'officeLocation',
        'officeLatitude',
        'officeLongitude',
      ],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const permissions = await this.getUserPermissions(user.role);

    return {
      ...user,
      permissions,
    };
  }

  async logout(token: string): Promise<void> {
    await this.userSessionRepository.update(
      { token },
      { isActive: false }
    );
  }

  async logoutAllSessions(userId: string): Promise<void> {
    await this.userSessionRepository.update(
      { userId },
      { isActive: false }
    );
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { email: forgotPasswordDto.email },
    });

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, a password reset link has been sent.' };
    }

    // Generate reset token
    const resetToken = crypto.randomUUID();
    const hashedToken = await bcrypt.hash(resetToken, 10);

    // Save token with 1 hour expiration
    const passwordResetToken = this.passwordResetTokenRepository.create({
      token: hashedToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    await this.passwordResetTokenRepository.save(passwordResetToken);

    // In production, send email with reset link
    // For now, return the token (in production, this would be sent via email)
    console.log(`Password reset token for ${user.email}: ${resetToken}`);

    return { message: 'If the email exists, a password reset link has been sent.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    // Find valid token
    const passwordResetTokens = await this.passwordResetTokenRepository.find({
      where: {
        used: false,
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user'],
    });

    let validToken: PasswordResetToken | null = null;
    
    for (const tokenEntity of passwordResetTokens) {
      const isValid = await bcrypt.compare(resetPasswordDto.token, tokenEntity.token);
      if (isValid) {
        validToken = tokenEntity;
        break;
      }
    }

    if (!validToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    // Update user password
    await this.userRepository.update(
      validToken.userId,
      { password: hashedPassword }
    );

    // Mark token as used
    await this.passwordResetTokenRepository.update(
      validToken.id,
      { used: true }
    );

    // Invalidate all user sessions
    await this.logoutAllSessions(validToken.userId);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'password'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate current password
    const isPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    // Update password
    await this.userRepository.update(userId, { password: hashedPassword });
  }

  async validateSession(token: string): Promise<boolean> {
    const session = await this.userSessionRepository.findOne({
      where: {
        token,
        isActive: true,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (session) {
      // Update last activity
      await this.userSessionRepository.update(session.id, {
        lastActivityAt: new Date(),
      });
      return true;
    }

    return false;
  }

  async cleanupExpiredSessions(): Promise<void> {
    await this.userSessionRepository.delete({
      expiresAt: LessThan(new Date()),
    });

    await this.passwordResetTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if email is being changed and is unique
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateProfileDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    // Update user fields
    Object.assign(user, updateProfileDto);
    
    const updatedUser = await this.userRepository.save(user);

    // Remove sensitive information
    delete updatedUser.password;

    return updatedUser;
  }

  async uploadProfilePicture(userId: string, fileUrl: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.profilePicture = fileUrl;
    const updatedUser = await this.userRepository.save(user);

    delete updatedUser.password;
    return updatedUser;
  }

  async deleteAccount(userId: string, password: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'password'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate password before deletion
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid password');
    }

    // Soft delete or hard delete based on your requirements
    // For now, we'll do a soft delete by setting isActive to false
    await this.userRepository.update(userId, { isActive: false });

    // Invalidate all sessions
    await this.logoutAllSessions(userId);
  }

  async getUserSessions(userId: string): Promise<UserSession[]> {
    return this.userSessionRepository.find({
      where: { 
        userId,
        isActive: true,
        expiresAt: MoreThan(new Date()),
      },
      order: { lastActivityAt: 'DESC' },
    });
  }

  async terminateSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.userSessionRepository.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.userSessionRepository.update(sessionId, { isActive: false });
  }
}
