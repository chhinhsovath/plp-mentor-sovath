import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../src/entities/user.entity';
import { RoleHierarchyAccess } from '../src/entities/role-hierarchy-access.entity';
import { JwtService } from '@nestjs/jwt';

describe('Hierarchy (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let roleHierarchyRepository: Repository<RoleHierarchyAccess>;
  let jwtService: JwtService;

  const mockUsers = [
    {
      id: 'admin-001',
      username: 'admin',
      email: 'admin@example.com',
      fullName: 'System Administrator',
      role: UserRole.ADMINISTRATOR,
      zoneId: null,
      provinceId: null,
      departmentId: null,
      clusterId: null,
      schoolId: null,
      isActive: true,
      passwordHash: 'hashed',
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'zone-001-user',
      username: 'zonemanager',
      email: 'zone@example.com',
      fullName: 'Zone Manager',
      role: UserRole.ZONE,
      zoneId: 'zone-001',
      provinceId: null,
      departmentId: null,
      clusterId: null,
      schoolId: null,
      isActive: true,
      passwordHash: 'hashed',
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'province-001-user',
      username: 'provincialmanager',
      email: 'province@example.com',
      fullName: 'Provincial Manager',
      role: UserRole.PROVINCIAL,
      zoneId: 'zone-001',
      provinceId: 'province-001',
      departmentId: null,
      clusterId: null,
      schoolId: null,
      isActive: true,
      passwordHash: 'hashed',
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'teacher-001',
      username: 'teacher',
      email: 'teacher@example.com',
      fullName: 'School Teacher',
      role: UserRole.TEACHER,
      zoneId: 'zone-001',
      provinceId: 'province-001',
      departmentId: 'dept-001',
      clusterId: 'cluster-001',
      schoolId: 'school-001',
      isActive: true,
      passwordHash: 'hashed',
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockRoleHierarchies = [
    {
      id: 1,
      role: UserRole.ADMINISTRATOR.toString(),
      manages: ['zone', 'province', 'department', 'cluster', 'school'],
      canView: 'national',
      canApproveMissions: true,
      notes: null,
    },
    {
      id: 2,
      role: UserRole.ZONE.toString(),
      manages: ['province', 'department', 'cluster', 'school'],
      canView: 'zone',
      canApproveMissions: true,
      notes: null,
    },
    {
      id: 3,
      role: UserRole.PROVINCIAL.toString(),
      manages: ['department', 'cluster', 'school'],
      canView: 'province',
      canApproveMissions: true,
      notes: null,
    },
    {
      id: 4,
      role: UserRole.TEACHER.toString(),
      manages: [],
      canView: 'self',
      canApproveMissions: false,
      notes: null,
    },
  ];

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    roleHierarchyRepository = moduleFixture.get<Repository<RoleHierarchyAccess>>(
      getRepositoryToken(RoleHierarchyAccess),
    );
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();

    // Seed test data
    await seedTestData();
  });

  afterEach(async () => {
    // Clean up test data
    await userRepository.clear();
    await roleHierarchyRepository.clear();
    await app.close();
  });

  async function seedTestData() {
    // Insert role hierarchies
    for (const roleHierarchy of mockRoleHierarchies) {
      await roleHierarchyRepository.save(roleHierarchy);
    }

    // Insert users
    for (const user of mockUsers) {
      await userRepository.save(user);
    }
  }

  function generateAuthToken(user: any): string {
    return jwtService.sign({
      sub: user.id,
      username: user.username,
      role: user.role,
    });
  }

  describe('/hierarchy/user-info (GET)', () => {
    it('should return user hierarchy info for administrator', async () => {
      const admin = mockUsers[0];
      const token = generateAuthToken(admin);

      const response = await request(app.getHttpServer())
        .get('/hierarchy/user-info')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.user.id).toBe(admin.id);
      expect(response.body.hierarchyLevel.level).toBe(UserRole.ADMINISTRATOR.toString());
      expect(response.body.hierarchyLevel.canManage).toContain('zone');
      expect(response.body.managedEntities).toBeDefined();
      expect(response.body.accessibleData).toBeDefined();
    });

    it('should return user hierarchy info for provincial manager', async () => {
      const provincial = mockUsers[2];
      const token = generateAuthToken(provincial);

      const response = await request(app.getHttpServer())
        .get('/hierarchy/user-info')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.user.id).toBe(provincial.id);
      expect(response.body.hierarchyLevel.level).toBe(UserRole.PROVINCIAL.toString());
      expect(response.body.locationScope.province).toBeDefined();
      expect(response.body.locationScope.zone).toBeDefined();
      expect(response.body.managedEntities.length).toBeGreaterThan(0);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer()).get('/hierarchy/user-info').expect(401);
    });
  });

  describe('/hierarchy/accessible-users (GET)', () => {
    it('should return all users for administrator', async () => {
      const admin = mockUsers[0];
      const token = generateAuthToken(admin);

      const response = await request(app.getHttpServer())
        .get('/hierarchy/accessible-users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(mockUsers.length);
    });

    it('should return filtered users for provincial manager', async () => {
      const provincial = mockUsers[2];
      const token = generateAuthToken(provincial);

      const response = await request(app.getHttpServer())
        .get('/hierarchy/accessible-users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Should only see users in their province
      const accessibleUsers = response.body;
      accessibleUsers.forEach((user) => {
        expect(user.provinceId).toBe(provincial.provinceId);
      });
    });

    it('should return only self for teacher', async () => {
      const teacher = mockUsers[3];
      const token = generateAuthToken(teacher);

      const response = await request(app.getHttpServer())
        .get('/hierarchy/accessible-users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(teacher.id);
    });
  });

  describe('/hierarchy/breadcrumbs (GET)', () => {
    it('should return breadcrumbs for provincial user', async () => {
      const provincial = mockUsers[2];
      const token = generateAuthToken(provincial);

      const response = await request(app.getHttpServer())
        .get('/hierarchy/breadcrumbs')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);

      const zoneBreadcrumb = response.body.find((b) => b.level === 'zone');
      const provinceBreadcrumb = response.body.find((b) => b.level === 'province');

      expect(zoneBreadcrumb).toBeDefined();
      expect(provinceBreadcrumb).toBeDefined();
      expect(zoneBreadcrumb.id).toBe('zone-001');
      expect(provinceBreadcrumb.id).toBe('province-001');
    });

    it('should include specific entity in breadcrumbs', async () => {
      const provincial = mockUsers[2];
      const token = generateAuthToken(provincial);

      const response = await request(app.getHttpServer())
        .get('/hierarchy/breadcrumbs')
        .query({ entityType: 'department', entityId: 'dept-001' })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      const departmentBreadcrumb = response.body.find((b) => b.level === 'department');
      expect(departmentBreadcrumb).toBeDefined();
      expect(departmentBreadcrumb.id).toBe('dept-001');
    });
  });

  describe('/hierarchy/location-scope (GET)', () => {
    it('should return location scope for teacher', async () => {
      const teacher = mockUsers[3];
      const token = generateAuthToken(teacher);

      const response = await request(app.getHttpServer())
        .get('/hierarchy/location-scope')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.zone).toBeDefined();
      expect(response.body.province).toBeDefined();
      expect(response.body.department).toBeDefined();
      expect(response.body.cluster).toBeDefined();
      expect(response.body.school).toBeDefined();

      expect(response.body.zone.id).toBe('zone-001');
      expect(response.body.province.id).toBe('province-001');
      expect(response.body.school.id).toBe('school-001');
    });

    it('should return partial scope for provincial user', async () => {
      const provincial = mockUsers[2];
      const token = generateAuthToken(provincial);

      const response = await request(app.getHttpServer())
        .get('/hierarchy/location-scope')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.zone).toBeDefined();
      expect(response.body.province).toBeDefined();
      expect(response.body.department).toBeUndefined();
      expect(response.body.cluster).toBeUndefined();
      expect(response.body.school).toBeUndefined();
    });
  });

  describe('/hierarchy/managed-entities (GET)', () => {
    it('should return managed entities for zone manager', async () => {
      const zoneManager = mockUsers[1];
      const token = generateAuthToken(zoneManager);

      const response = await request(app.getHttpServer())
        .get('/hierarchy/managed-entities')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      // Should return provinces in their zone
      response.body.forEach((entity) => {
        expect(entity.zoneId).toBe(zoneManager.zoneId);
      });
    });

    it('should return empty array for teacher', async () => {
      const teacher = mockUsers[3];
      const token = generateAuthToken(teacher);

      const response = await request(app.getHttpServer())
        .get('/hierarchy/managed-entities')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('/hierarchy/geographic-entities/:type (GET)', () => {
    it('should return provinces for zone manager', async () => {
      const zoneManager = mockUsers[1];
      const token = generateAuthToken(zoneManager);

      const response = await request(app.getHttpServer())
        .get('/hierarchy/geographic-entities/province')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      response.body.forEach((entity) => {
        expect(entity.level).toBe('province');
        expect(entity.hasChildren).toBeDefined();
        expect(entity.childrenCount).toBeDefined();
      });
    });

    it('should return 404 for invalid entity type', async () => {
      const admin = mockUsers[0];
      const token = generateAuthToken(admin);

      await request(app.getHttpServer())
        .get('/hierarchy/geographic-entities/invalid')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('/hierarchy/validate-access/:entityType/:entityId (GET)', () => {
    it('should allow administrator access to any entity', async () => {
      const admin = mockUsers[0];
      const token = generateAuthToken(admin);

      const response = await request(app.getHttpServer())
        .get('/hierarchy/validate-access/province/province-002')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.hasAccess).toBe(true);
    });

    it('should allow provincial user access to their province', async () => {
      const provincial = mockUsers[2];
      const token = generateAuthToken(provincial);

      const response = await request(app.getHttpServer())
        .get('/hierarchy/validate-access/province/province-001')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.hasAccess).toBe(true);
    });

    it('should deny provincial user access to other provinces', async () => {
      const provincial = mockUsers[2];
      const token = generateAuthToken(provincial);

      await request(app.getHttpServer())
        .get('/hierarchy/validate-access/province/province-002')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('/hierarchy/data-summary (GET)', () => {
    it('should return data summary for administrator', async () => {
      const admin = mockUsers[0];
      const token = generateAuthToken(admin);

      const response = await request(app.getHttpServer())
        .get('/hierarchy/data-summary')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.totalUsers).toBeDefined();
      expect(response.body.totalSessions).toBeDefined();
      expect(response.body.totalPlans).toBeDefined();
      expect(response.body.scopeLevel).toBe('national');
      expect(response.body.scopeName).toBe('National Level');
      expect(response.body.scopeNameKh).toBe('កម្រិតជាតិ');
    });

    it('should return filtered data summary for provincial user', async () => {
      const provincial = mockUsers[2];
      const token = generateAuthToken(provincial);

      const response = await request(app.getHttpServer())
        .get('/hierarchy/data-summary')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.scopeLevel).toBe('province');
      expect(response.body.scopeName).toBeDefined();
      expect(response.body.scopeNameKh).toBeDefined();
      expect(typeof response.body.totalUsers).toBe('number');
      expect(typeof response.body.totalSessions).toBe('number');
      expect(typeof response.body.totalPlans).toBe('number');
    });
  });

  describe('Filtering with query parameters', () => {
    it('should filter accessible users by role', async () => {
      const admin = mockUsers[0];
      const token = generateAuthToken(admin);

      const response = await request(app.getHttpServer())
        .get('/hierarchy/accessible-users')
        .query({ role: UserRole.TEACHER })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((user) => {
        expect(user.role).toBe(UserRole.TEACHER);
      });
    });

    it('should filter geographic entities by parent', async () => {
      const admin = mockUsers[0];
      const token = generateAuthToken(admin);

      const response = await request(app.getHttpServer())
        .get('/hierarchy/geographic-entities/province')
        .query({ zoneId: 'zone-001' })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((entity) => {
        expect(entity.level).toBe('province');
      });
    });
  });
});
