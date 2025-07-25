import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User, UserRole } from '../entities/user.entity';
import { RoleHierarchyAccess } from '../entities/role-hierarchy-access.entity';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { UserSession } from '../entities/user-session.entity';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let roleHierarchyRepository: Repository<RoleHierarchyAccess>;
  let passwordResetTokenRepository: Repository<PasswordResetToken>;
  let userSessionRepository: Repository<UserSession>;
  let jwtService: JwtService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'testuser',
    email: 'test@example.com',
    password: '$2b$10$hashedpassword',
    fullName: 'Test User',
    role: UserRole.TEACHER,
    locationScope: 'Test Location',
    isActive: true,
  };

  const mockRoleHierarchy = {
    id: 1,
    role: 'Teacher',
    canView: 'Self only',
    manages: [],
    canApproveMissions: false,
    notes: 'Self check-in, self missions',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RoleHierarchyAccess),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PasswordResetToken),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserSession),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    roleHierarchyRepository = module.get<Repository<RoleHierarchyAccess>>(
      getRepositoryToken(RoleHierarchyAccess),
    );
    passwordResetTokenRepository = module.get<Repository<PasswordResetToken>>(
      getRepositoryToken(PasswordResetToken),
    );
    userSessionRepository = module.get<Repository<UserSession>>(
      getRepositoryToken(UserSession),
    );
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.validateUser('testuser', 'password');

      expect(result).toBeDefined();
      expect(result?.username).toBe('testuser');
      expect(result).not.toHaveProperty('password');
    });

    it('should return null when user is not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      const result = await service.validateUser('nonexistent', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      const result = await service.validateUser('testuser', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should return null when user is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(inactiveUser as User);

      const result = await service.validateUser('testuser', 'password');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user info when credentials are valid', async () => {
      const { password, ...userWithoutPassword } = mockUser;
      jest.spyOn(service, 'validateUser').mockResolvedValue(userWithoutPassword as User);
      jest.spyOn(userRepository, 'update').mockResolvedValue(undefined as any);
      jest
        .spyOn(roleHierarchyRepository, 'findOne')
        .mockResolvedValue(mockRoleHierarchy as RoleHierarchyAccess);
      jest.spyOn(jwtService, 'sign').mockReturnValue('mock-jwt-token');

      const result = await service.login({ username: 'testuser', password: 'password' });

      expect(result).toHaveProperty('access_token', 'mock-jwt-token');
      expect(result).toHaveProperty('user');
      expect(result.user.username).toBe('testuser');
      expect(userRepository.update).toHaveBeenCalledWith(mockUser.id, {
        lastLogin: expect.any(Date),
      });
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(
        service.login({ username: 'testuser', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should create and return new user', async () => {
      const registerDto = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        fullName: 'New User',
        role: UserRole.TEACHER,
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userRepository, 'create').mockReturnValue(mockUser as User);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser as User);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedpassword' as never);

      const result = await service.register(registerDto);

      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('password');
      expect(userRepository.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when user already exists', async () => {
      const registerDto = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123',
        fullName: 'Existing User',
        role: UserRole.TEACHER,
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('getUserPermissions', () => {
    it('should return role hierarchy for valid role', async () => {
      jest
        .spyOn(roleHierarchyRepository, 'findOne')
        .mockResolvedValue(mockRoleHierarchy as RoleHierarchyAccess);

      const result = await service.getUserPermissions(UserRole.TEACHER);

      expect(result).toEqual(mockRoleHierarchy);
    });

    it('should return null for invalid role', async () => {
      jest.spyOn(roleHierarchyRepository, 'findOne').mockResolvedValue(null);

      const result = await service.getUserPermissions(UserRole.TEACHER);

      expect(result).toBeNull();
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const changePasswordDto = {
        currentPassword: 'oldPassword',
        newPassword: 'NewPassword123!',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('newhashed' as never);
      jest.spyOn(userRepository, 'update').mockResolvedValue(undefined as any);

      await service.changePassword(mockUser.id, changePasswordDto);

      expect(userRepository.update).toHaveBeenCalledWith(mockUser.id, {
        password: 'newhashed',
      });
    });

    it('should throw BadRequestException for incorrect current password', async () => {
      const changePasswordDto = {
        currentPassword: 'wrongPassword',
        newPassword: 'NewPassword123!',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        service.changePassword(mockUser.id, changePasswordDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('logout', () => {
    it('should invalidate session successfully', async () => {
      jest.spyOn(userSessionRepository, 'update').mockResolvedValue(undefined as any);

      await service.logout('test-token');

      expect(userSessionRepository.update).toHaveBeenCalledWith(
        { token: 'test-token' },
        { isActive: false },
      );
    });
  });

  describe('validateSession', () => {
    it('should return true for valid active session', async () => {
      const mockSession = {
        id: 'session-id',
        token: 'test-token',
        isActive: true,
        expiresAt: new Date(Date.now() + 3600000),
      };

      jest.spyOn(userSessionRepository, 'findOne').mockResolvedValue(mockSession as UserSession);
      jest.spyOn(userSessionRepository, 'update').mockResolvedValue(undefined as any);

      const result = await service.validateSession('test-token');

      expect(result).toBe(true);
      expect(userSessionRepository.update).toHaveBeenCalledWith(
        mockSession.id,
        { lastActivityAt: expect.any(Date) },
      );
    });

    it('should return false for invalid or expired session', async () => {
      jest.spyOn(userSessionRepository, 'findOne').mockResolvedValue(null);

      const result = await service.validateSession('invalid-token');

      expect(result).toBe(false);
    });
  });

  describe('forgotPassword', () => {
    it('should create password reset token when email exists', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedtoken' as never);
      jest.spyOn(passwordResetTokenRepository, 'create').mockReturnValue({} as PasswordResetToken);
      jest.spyOn(passwordResetTokenRepository, 'save').mockResolvedValue({} as PasswordResetToken);

      const result = await service.forgotPassword({ email: 'test@example.com' });

      expect(result.message).toBe('If the email exists, a password reset link has been sent.');
      expect(passwordResetTokenRepository.save).toHaveBeenCalled();
    });

    it('should return generic message when email does not exist', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      const result = await service.forgotPassword({ email: 'nonexistent@example.com' });

      expect(result.message).toBe('If the email exists, a password reset link has been sent.');
      expect(passwordResetTokenRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const updateProfileDto = {
        fullName: 'Updated Name',
        email: 'newemail@example.com',
      };

      jest.spyOn(userRepository, 'findOne')
        .mockResolvedValueOnce(mockUser as User)
        .mockResolvedValueOnce(null);
      jest.spyOn(userRepository, 'save').mockResolvedValue({
        ...mockUser,
        ...updateProfileDto,
      } as User);

      const result = await service.updateProfile(mockUser.id, updateProfileDto);

      expect(result.fullName).toBe('Updated Name');
      expect(result.email).toBe('newemail@example.com');
      expect(result).not.toHaveProperty('password');
    });

    it('should throw ConflictException when email already exists', async () => {
      const updateProfileDto = {
        email: 'existing@example.com',
      };

      jest.spyOn(userRepository, 'findOne')
        .mockResolvedValueOnce(mockUser as User)
        .mockResolvedValueOnce({ id: 'other-user-id' } as User);

      await expect(
        service.updateProfile(mockUser.id, updateProfileDto),
      ).rejects.toThrow(ConflictException);
    });
  });
});
