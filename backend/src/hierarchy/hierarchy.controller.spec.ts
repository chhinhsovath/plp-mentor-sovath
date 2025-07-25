import { Test, TestingModule } from '@nestjs/testing';
import { HierarchyController } from './hierarchy.controller';
import { HierarchyService } from './hierarchy.service';
import { User, UserRole } from '../entities/user.entity';

describe('HierarchyController', () => {
  let controller: HierarchyController;
  let hierarchyService: HierarchyService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'testuser',
    fullName: 'Test User',
    role: UserRole.PROVINCIAL,
    locationScope: 'Phnom Penh',
  };

  const mockHierarchy = {
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
      controllers: [HierarchyController],
      providers: [
        {
          provide: HierarchyService,
          useValue: {
            getUserHierarchy: jest.fn(),
            getSubordinateUsers: jest.fn(),
            canUserAccessData: jest.fn(),
            canUserManageUser: jest.fn(),
            canUserApproveMissions: jest.fn(),
            getLocationScope: jest.fn(),
            validateHierarchicalAccess: jest.fn(),
            getRoleHierarchyTree: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<HierarchyController>(HierarchyController);
    hierarchyService = module.get<HierarchyService>(HierarchyService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUserHierarchy', () => {
    it('should return user hierarchy information', async () => {
      jest.spyOn(hierarchyService, 'getUserHierarchy').mockResolvedValue(mockHierarchy);

      const result = await controller.getUserHierarchy(mockUser as User);

      expect(result).toEqual(mockHierarchy);
      expect(hierarchyService.getUserHierarchy).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getSubordinateUsers', () => {
    it('should return subordinate users', async () => {
      jest.spyOn(hierarchyService, 'getSubordinateUsers').mockResolvedValue(mockSubordinateUsers);

      const result = await controller.getSubordinateUsers(mockUser as User);

      expect(result).toEqual(mockSubordinateUsers);
      expect(hierarchyService.getSubordinateUsers).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('checkDataAccess', () => {
    it('should return access permission for target user', async () => {
      const targetUserId = '123e4567-e89b-12d3-a456-426614174001';
      jest.spyOn(hierarchyService, 'canUserAccessData').mockResolvedValue(true);

      const result = await controller.checkDataAccess(targetUserId, mockUser as User);

      expect(result).toEqual({ canAccess: true });
      expect(hierarchyService.canUserAccessData).toHaveBeenCalledWith(mockUser, targetUserId);
    });

    it('should return false for unauthorized access', async () => {
      const targetUserId = 'unauthorized-user-id';
      jest.spyOn(hierarchyService, 'canUserAccessData').mockResolvedValue(false);

      const result = await controller.checkDataAccess(targetUserId, mockUser as User);

      expect(result).toEqual({ canAccess: false });
    });
  });

  describe('checkManagementPermission', () => {
    it('should return management permission for target user', async () => {
      const targetUserId = '123e4567-e89b-12d3-a456-426614174002';
      jest.spyOn(hierarchyService, 'canUserManageUser').mockResolvedValue(true);

      const result = await controller.checkManagementPermission(targetUserId, mockUser as User);

      expect(result).toEqual({ canManage: true });
      expect(hierarchyService.canUserManageUser).toHaveBeenCalledWith(mockUser, targetUserId);
    });

    it('should return false for unauthorized management', async () => {
      const targetUserId = 'peer-user-id';
      jest.spyOn(hierarchyService, 'canUserManageUser').mockResolvedValue(false);

      const result = await controller.checkManagementPermission(targetUserId, mockUser as User);

      expect(result).toEqual({ canManage: false });
    });
  });

  describe('checkApprovalAuthority', () => {
    it('should return approval authority status', async () => {
      jest.spyOn(hierarchyService, 'canUserApproveMissions').mockResolvedValue(true);

      const result = await controller.checkApprovalAuthority(mockUser as User);

      expect(result).toEqual({ canApprove: true });
      expect(hierarchyService.canUserApproveMissions).toHaveBeenCalledWith(mockUser);
    });

    it('should return false for users without approval authority', async () => {
      jest.spyOn(hierarchyService, 'canUserApproveMissions').mockResolvedValue(false);

      const result = await controller.checkApprovalAuthority(mockUser as User);

      expect(result).toEqual({ canApprove: false });
    });
  });

  describe('getLocationScope', () => {
    it('should return user location scope', async () => {
      const mockLocationScope = [
        { id: '1', name: 'Phnom Penh - District 1', type: 'district' },
        { id: '2', name: 'Phnom Penh - District 2', type: 'district' },
      ];

      jest.spyOn(hierarchyService, 'getLocationScope').mockResolvedValue(mockLocationScope);

      const result = await controller.getLocationScope(mockUser as User);

      expect(result).toEqual(mockLocationScope);
      expect(hierarchyService.getLocationScope).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getRoleHierarchyTree', () => {
    it('should return complete role hierarchy tree', async () => {
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

      jest.spyOn(hierarchyService, 'getRoleHierarchyTree').mockResolvedValue(mockHierarchyTree);

      const result = await controller.getRoleHierarchyTree();

      expect(result).toEqual(mockHierarchyTree);
      expect(hierarchyService.getRoleHierarchyTree).toHaveBeenCalled();
    });
  });

  describe('validateAccess', () => {
    it('should validate hierarchical access successfully', async () => {
      const accessDto = {
        targetUserId: '123e4567-e89b-12d3-a456-426614174001',
        operation: 'read' as const,
      };

      jest.spyOn(hierarchyService, 'validateHierarchicalAccess').mockResolvedValue(undefined);

      const result = await controller.validateAccess(accessDto, mockUser as User);

      expect(result).toEqual({ valid: true });
      expect(hierarchyService.validateHierarchicalAccess).toHaveBeenCalledWith(
        mockUser,
        accessDto.targetUserId,
        accessDto.operation,
      );
    });

    it('should handle validation errors', async () => {
      const accessDto = {
        targetUserId: 'unauthorized-user-id',
        operation: 'write' as const,
      };

      jest.spyOn(hierarchyService, 'validateHierarchicalAccess').mockRejectedValue(
        new Error('Access denied'),
      );

      try {
        await controller.validateAccess(accessDto, mockUser as User);
      } catch (error) {
        expect(error.message).toBe('Access denied');
      }
    });
  });
});