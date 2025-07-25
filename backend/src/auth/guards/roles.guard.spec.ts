import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolesGuard } from './roles.guard';
import { RoleHierarchyAccess } from '../../entities/role-hierarchy-access.entity';
import { UserRole } from '../../entities/user.entity';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let roleHierarchyRepository: Repository<RoleHierarchyAccess>;

  const mockExecutionContext = (user: any, roles?: UserRole[]): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RoleHierarchyAccess),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
    roleHierarchyRepository = module.get<Repository<RoleHierarchyAccess>>(
      getRepositoryToken(RoleHierarchyAccess),
    );
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when no roles are required', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = mockExecutionContext({ role: UserRole.TEACHER });
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should allow access when user has required role', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.TEACHER]);

    const context = mockExecutionContext({ role: UserRole.TEACHER });
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should deny access when user does not have required role', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMINISTRATOR]);
    jest.spyOn(roleHierarchyRepository, 'findOne').mockResolvedValue(null);

    const context = mockExecutionContext({ role: UserRole.TEACHER });
    const result = await guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('should allow access based on role hierarchy', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.TEACHER]);
    
    const mockHierarchy = {
      manages: ['Teacher'],
    };
    jest.spyOn(roleHierarchyRepository, 'findOne').mockResolvedValue(mockHierarchy as any);

    const context = mockExecutionContext({ role: UserRole.ZONE });
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should handle user without role', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.TEACHER]);

    const context = mockExecutionContext({});
    const result = await guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('should handle no user in request', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.TEACHER]);

    const context = mockExecutionContext(null);
    const result = await guard.canActivate(context);

    expect(result).toBe(false);
  });
});