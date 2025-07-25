import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { RoleHierarchyAccess } from '../entities/role-hierarchy-access.entity';
import { UserRole } from '../entities/user.entity';

export async function seedDevelopmentUsers(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);
  const roleHierarchyRepository = dataSource.getRepository(RoleHierarchyAccess);

  // Get the Administrator role
  const adminRole = await roleHierarchyRepository.findOne({
    where: { role: UserRole.ADMINISTRATOR },
  });

  if (!adminRole) {
    throw new Error('Administrator role not found. Please run role hierarchy seed first.');
  }

  // Development users
  const developmentUsers = [
    {
      username: 'chhinhs',
      email: 'chhinhs@moeys.gov.kh',
      password: 'password',
      fullName: 'Chheng Sothy',
      phoneNumber: '+855123456789',
      role: UserRole.ADMINISTRATOR,
      roleHierarchyAccess: adminRole,
      locationScope: {
        type: 'national',
        id: 'cambodia',
        name: 'Cambodia',
      },
    },
    {
      username: 'zone_user',
      email: 'zone@moeys.gov.kh',
      password: 'password',
      fullName: 'Zone Manager',
      phoneNumber: '+855123456790',
      role: UserRole.ZONE,
      roleHierarchyAccess: await roleHierarchyRepository.findOne({
        where: { role: UserRole.ZONE },
      }),
      locationScope: {
        type: 'zone',
        id: 'zone-1',
        name: 'Zone 1',
      },
    },
    {
      username: 'provincial_user',
      email: 'provincial@moeys.gov.kh',
      password: 'password',
      fullName: 'Provincial Officer',
      phoneNumber: '+855123456791',
      role: UserRole.PROVINCIAL,
      roleHierarchyAccess: await roleHierarchyRepository.findOne({
        where: { role: UserRole.PROVINCIAL },
      }),
      locationScope: {
        type: 'provincial',
        id: 'phnom-penh',
        name: 'Phnom Penh',
        parentId: 'zone-1',
      },
    },
    {
      username: 'teacher_user',
      email: 'teacher@moeys.gov.kh',
      password: 'password',
      fullName: 'Teacher Demo',
      phoneNumber: '+855123456792',
      role: UserRole.TEACHER,
      roleHierarchyAccess: await roleHierarchyRepository.findOne({
        where: { role: UserRole.TEACHER },
      }),
      locationScope: {
        type: 'school',
        id: 'school-001',
        name: 'Demo Primary School',
        parentId: 'cluster-1',
      },
    },
  ];

  for (const userData of developmentUsers) {
    // Check if user already exists by username or email
    const existingUser = await userRepository.findOne({
      where: [
        { username: userData.username },
        { email: userData.email }
      ],
    });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Determine location IDs based on role and location scope
      const locationIds = {
        zoneId: null,
        provinceId: null,
        departmentId: null,
        clusterId: null,
        schoolId: null,
      };

      switch (userData.role) {
        case UserRole.ADMINISTRATOR:
          // Admin has no specific location
          break;
        case UserRole.ZONE:
          locationIds.zoneId = userData.locationScope.id;
          break;
        case UserRole.PROVINCIAL:
          locationIds.zoneId = userData.locationScope.parentId;
          locationIds.provinceId = userData.locationScope.id;
          break;
        case UserRole.TEACHER:
        case UserRole.DIRECTOR:
          locationIds.schoolId = userData.locationScope.id;
          // You may need to populate zone, province, etc based on school hierarchy
          break;
      }

      const user = userRepository.create({
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        fullName: userData.fullName,
        role: userData.role,
        locationScope: JSON.stringify(userData.locationScope),
        ...locationIds,
        isActive: true,
      });

      await userRepository.save(user);
      console.log(
        `✅ Created development user: ${userData.username} with password: ${userData.password}`,
      );
    } else {
      console.log(`⚠️  User ${userData.username} already exists`);
    }
  }

  console.log('Development users seeding completed!');
}
