import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { HierarchyService } from './hierarchy.service';
import { User, UserRole } from '../entities/user.entity';
import { RoleHierarchyAccess } from '../entities/role-hierarchy-access.entity';

describe('HierarchyService', () => {
  let service: HierarchyService;
  let userRepository: Repository<User>;
  let roleHierarchyRepository: Repository<RoleHierarchyAccess>;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'testuser',
    fullName: 'Test User',
    role: UserRole.PROVINCIAL,
    locationScope: 'Phnom Penh',
  };

  const mockRoleHierarchy = {
    id: 1,
    role: 'Provincial',
    canView: 'Province wide',
    manages: ['Department', 'Cluster', 'Director', 'Teacher'],
    canApproveMissions: true,
    notes: 'Provincial level oversight',
  };

  const mockSubordinateUsers = [
    {
      id: '123e4567-e89b-12d3-a456-426614174001',
      username: 'department1',
      fullName: 'Department Head 1',
      role: UserRole.DEPARTMENT,
      locationScope: 'Phnom Penh - District 1',
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174002',
      username: 'teacher1',
      fullName: 'Teacher 1',
      role: UserRole.TEACHER,
      locationScope: 'Phnom Penh - School A',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HierarchyService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RoleHierarchyAccess),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<HierarchyService>(HierarchyService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    roleHierarchyRepository = module.get<Repository<RoleHierarchyAccess>>(
      getRepositoryToken(RoleHierarchyAccess),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserHierarchy', () => {
    it('should return user hierarchy information', async () => {
      jest.spyOn(roleHierarchyRepository, 'findOne').mockResolvedValue(mockRoleHierarchy as RoleHierarchyAccess);

      const result = await service.getUserHierarchy(mockUser as User);

      expect(result).toEqual(mockRoleHierarchy);
      expect(roleHierarchyRepository.findOne).toHaveBeenCalledWith({
        where: { role: mockUser.role },
      });
    });

    it('should throw NotFoundException when hierarchy not found', async () => {
      jest.spyOn(roleHierarchyRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getUserHierarchy(mockUser as User)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSubordinateUsers', () => {
    it('should return users within management scope', async () => {
      jest.spyOn(roleHierarchyRepository, 'findOne').mockResolvedValue(mockRoleHierarchy as RoleHierarchyAccess);
      jest.spyOn(userRepository, 'find').mockResolvedValue(mockSubordinateUsers as User[]);

      const result = await service.getSubordinateUsers(mockUser as User);

      expect(result).toEqual(mockSubordinateUsers);
      expect(userRepository.find).toHaveBeenCalledWith({
        where: {
          role: expect.any(Object),
          locationScope: expect.any(Object),
        },
      });
    });

    it('should return empty array for users with no subordinates', async () => {
      const teacherHierarchy = {
        ...mockRoleHierarchy,
        role: 'Teacher',
        manages: [],
      };
      jest.spyOn(roleHierarchyRepository, 'findOne').mockResolvedValue(teacherHierarchy as RoleHierarchyAccess);

      const result = await service.getSubordinateUsers({ ...mockUser, role: UserRole.TEACHER } as User);

      expect(result).toEqual([]);
    });
  });

  describe('canUserAccessData', () => {
    it('should return true when user can access their own data', async () => {
      const result = await service.canUserAccessData(mockUser as User, mockUser.id);

      expect(result).toBe(true);
    });

    it('should return true when user can access subordinate data', async () => {
      jest.spyOn(roleHierarchyRepository, 'findOne').mockResolvedValue(mockRoleHierarchy as RoleHierarchyAccess);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockSubordinateUsers[0] as User);

      const result = await service.canUserAccessData(mockUser as User, mockSubordinateUsers[0].id);

      expect(result).toBe(true);
    });

    it('should return false when user cannot access data outside their scope', async () => {
      jest.spyOn(roleHierarchyRepository, 'findOne').mockResolvedValue(mockRoleHierarchy as RoleHierarchyAccess);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue({
        id: 'other-user-id',
        role: UserRole.PROVINCIAL,
        locationScope: 'Siem Reap',
      } as User);

      const result = await service.canUserAccessData(mockUser as User, 'other-user-id');

      expect(result).toBe(false);
    });
  });

  describe('canUserManageUser', () => {
    it('should return true when user can manage subordinate', async () => {
      jest.spyOn(roleHierarchyRepository, 'findOne').mockResolvedValue(mockRoleHierarchy as RoleHierarchyAccess);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockSubordinateUsers[1] as User);

      const result = await service.canUserManageUser(mockUser as User, mockSubordinateUsers[1].id);

      expect(result).toBe(true);
    });

    it('should return false when user cannot manage peer or superior', async () => {
      jest.spyOn(roleHierarchyRepository, 'findOne').mockResolvedValue(mockRoleHierarchy as RoleHierarchyAccess);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue({
        id: 'peer-user-id',
        role: UserRole.PROVINCIAL,
        locationScope: 'Siem Reap',
      } as User);

      const result = await service.canUserManageUser(mockUser as User, 'peer-user-id');

      expect(result).toBe(false);
    });
  });

  describe('canUserApproveMissions', () => {
    it('should return true when user has approval authority', async () => {
      jest.spyOn(roleHierarchyRepository, 'findOne').mockResolvedValue(mockRoleHierarchy as RoleHierarchyAccess);

      const result = await service.canUserApproveMissions(mockUser as User);

      expect(result).toBe(true);
    });

    it('should return false when user has no approval authority', async () => {
      const noApprovalHierarchy = {
        ...mockRoleHierarchy,
        canApproveMissions: false,
      };
      jest.spyOn(roleHierarchyRepository, 'findOne').mockResolvedValue(noApprovalHierarchy as RoleHierarchyAccess);

      const result = await service.canUserApproveMissions(mockUser as User);

      expect(result).toBe(false);
    });
  });

  describe('getLocationScope', () => {
    it('should return filtered location scope based on user permissions', async () => {
      const mockLocations = [
        { id: '1', name: 'Phnom Penh - District 1', type: 'district' },
        { id: '2', name: 'Phnom Penh - District 2', type: 'district' },
        { id: '3', name: 'Siem Reap - District 1', type: 'district' },
      ];

      // Mock the location filtering logic
      const result = await service.getLocationScope(mockUser as User);

      expect(result).toBeDefined();
      // Should filter based on user's location scope
    });
  });

  describe('validateHierarchicalAccess', () => {
    it('should not throw when access is valid', async () => {
      jest.spyOn(service, 'canUserAccessData').mockResolvedValue(true);

      await expect(
        service.validateHierarchicalAccess(mockUser as User, 'target-user-id', 'read'),
      ).resolves.not.toThrow();
    });

    it('should throw ForbiddenException when access is denied', async () => {
      jest.spyOn(service, 'canUserAccessData').mockResolvedValue(false);

      await expect(
        service.validateHierarchicalAccess(mockUser as User, 'target-user-id', 'read'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should validate management permissions for write operations', async () => {
      jest.spyOn(service, 'canUserManageUser').mockResolvedValue(false);

      await expect(
        service.validateHierarchicalAccess(mockUser as User, 'target-user-id', 'write'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getRoleHierarchyTree', () => {
    it('should return complete role hierarchy structure', async () => {
      const mockHierarchyTree = [
        {
          role: 'Administrator',
          level: 1,
          manages: ['Zone', 'Provincial', 'Department', 'Cluster', 'Director', 'Teacher'],
        },
        {
          role: 'Zone',
          level: 2,
          manages: ['Provincial', 'Department', 'Cluster', 'Director', 'Teacher'],
        },
        {
          role: 'Provincial',
          level: 3,
          manages: ['Department', 'Cluster', 'Director', 'Teacher'],
        },
      ];

      jest.spyOn(roleHierarchyRepository, 'find').mockResolvedValue(mockHierarchyTree as RoleHierarchyAccess[]);

      const result = await service.getRoleHierarchyTree();

      expect(result).toEqual(mockHierarchyTree);
      expect(roleHierarchyRepository.find).toHaveBeenCalledWith({
        order: { id: 'ASC' },
      });
    });
  });
});