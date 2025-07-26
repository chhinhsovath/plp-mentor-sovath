import { DataSource } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

export async function seedRoleDemoUsers(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);

  console.log('Creating demo users for each role...');

  // Define demo users for each role
  const demoUsers = [
    {
      username: 'admin_demo',
      password: 'Admin@123',
      fullName: 'អ្នកគ្រប់គ្រងប្រព័ន្ធ',
      email: 'admin@plp-mentor.edu.kh',
      phoneNumber: '012345678',
      role: UserRole.ADMINISTRATOR,
      locationScope: 'national',
      zoneId: null,
      provinceId: null,
      departmentId: null,
      clusterId: null,
      schoolId: null,
      description: 'Full system access - can view and manage all data nationwide'
    },
    {
      username: 'zone_demo',
      password: 'Zone@123',
      fullName: 'អ្នកគ្រប់គ្រងតំបន់',
      email: 'zone@plp-mentor.edu.kh',
      phoneNumber: '012345679',
      role: UserRole.ZONE,
      locationScope: 'zone',
      zoneId: 'zone-1',
      provinceId: null,
      departmentId: null,
      clusterId: null,
      schoolId: null,
      description: 'Regional manager - can view all in zone, approve missions'
    },
    {
      username: 'provincial_demo',
      password: 'Provincial@123',
      fullName: 'អ្នកគ្រប់គ្រងខេត្ត',
      email: 'provincial@plp-mentor.edu.kh',
      phoneNumber: '012345680',
      role: UserRole.PROVINCIAL,
      locationScope: 'province',
      zoneId: 'zone-1',
      provinceId: 'province-1',
      departmentId: null,
      clusterId: null,
      schoolId: null,
      description: 'Provincial manager - can view all in province, approve missions'
    },
    {
      username: 'department_demo',
      password: 'Department@123',
      fullName: 'ប្រធាននាយកដ្ឋាន',
      email: 'department@plp-mentor.edu.kh',
      phoneNumber: '012345681',
      role: UserRole.DEPARTMENT,
      locationScope: 'department',
      zoneId: 'zone-1',
      provinceId: 'province-1',
      departmentId: 'department-1',
      clusterId: null,
      schoolId: null,
      description: 'Department head - can view department & cluster, cannot approve missions'
    },
    {
      username: 'cluster_demo',
      password: 'Cluster@123',
      fullName: 'ប្រធានចង្កោម',
      email: 'cluster@plp-mentor.edu.kh',
      phoneNumber: '012345682',
      role: UserRole.CLUSTER,
      locationScope: 'cluster',
      zoneId: 'zone-1',
      provinceId: 'province-1',
      departmentId: 'department-1',
      clusterId: 'cluster-1',
      schoolId: null,
      description: 'Cluster manager - manages multiple schools, cannot approve missions'
    },
    {
      username: 'director_demo',
      password: 'Director@123',
      fullName: 'នាយកសាលា',
      email: 'director@plp-mentor.edu.kh',
      phoneNumber: '012345683',
      role: UserRole.DIRECTOR,
      locationScope: 'school',
      zoneId: 'zone-1',
      provinceId: 'province-1',
      departmentId: 'department-1',
      clusterId: 'cluster-1',
      schoolId: 'school-1',
      description: 'School principal - can view teachers in school, approve missions'
    },
    {
      username: 'teacher_demo',
      password: 'Teacher@123',
      fullName: 'គ្រូបង្រៀន',
      email: 'teacher@plp-mentor.edu.kh',
      phoneNumber: '012345684',
      role: UserRole.TEACHER,
      locationScope: 'school',
      zoneId: 'zone-1',
      provinceId: 'province-1',
      departmentId: 'department-1',
      clusterId: 'cluster-1',
      schoolId: 'school-1',
      description: 'Teacher - self check-in, self missions only'
    }
  ];

  for (const userData of demoUsers) {
    try {
      // Check if user already exists
      const existingUser = await userRepository.findOne({
        where: { username: userData.username }
      });

      if (existingUser) {
        console.log(`✓ User ${userData.username} already exists`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user
      const user = userRepository.create({
        username: userData.username,
        password: hashedPassword,
        fullName: userData.fullName,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        role: userData.role,
        locationScope: userData.locationScope,
        zoneId: userData.zoneId,
        provinceId: userData.provinceId,
        departmentId: userData.departmentId,
        clusterId: userData.clusterId,
        schoolId: userData.schoolId,
        isActive: true,
        preferredLanguage: 'km',
        bio: userData.description
      });

      await userRepository.save(user);
      console.log(`✅ Created demo user: ${userData.username} (${userData.role})`);
      console.log(`   Password: ${userData.password}`);
      console.log(`   Description: ${userData.description}`);
    } catch (error) {
      console.error(`✗ Error creating user ${userData.username}:`, error);
    }
  }

  console.log('\n📋 Role-Based Access Summary:');
  console.log('================================');
  console.log('Administrator: Full system access, all menus visible');
  console.log('Zone: Regional access, can approve missions, see analytics');
  console.log('Provincial: Province-wide access, can approve missions');
  console.log('Department: Department/cluster view, no mission approval');
  console.log('Cluster: Multiple schools view, limited analytics');
  console.log('Director: School-level access, can approve missions');
  console.log('Teacher: Self-access only, basic observation forms');
  
  console.log('\n🔑 Login Credentials:');
  console.log('================================');
  demoUsers.forEach(user => {
    console.log(`${user.role}: ${user.username} / ${user.password}`);
  });
}