require('dotenv').config();
const { DataSource } = require('typeorm');
const bcrypt = require('bcrypt');
const path = require('path');

// Define UserRole enum values
const UserRole = {
  ADMINISTRATOR: 'Administrator',
  ZONE: 'Zone',
  PROVINCIAL: 'Provincial',
  DEPARTMENT: 'Department',
  CLUSTER: 'Cluster',
  DIRECTOR: 'Director',
  TEACHER: 'Teacher',
};

async function createDemoUsers() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'daunpenhsovath.c2uikekrbf9c.us-east-1.rds.amazonaws.com',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'SovathGogLikeLive',
    database: process.env.DB_NAME || 'plp_mentoring_sovath',
    entities: [path.join(__dirname, 'src/entities/*.entity.js')],
    synchronize: false,
    logging: false,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connected');

    const demoUsers = [
      {
        username: 'admin_demo',
        password: 'Admin@123',
        fullName: 'អ្នកគ្រប់គ្រងប្រព័ន្ធ',
        email: 'admin@plp-mentor.edu.kh',
        phoneNumber: '012345678',
        role: UserRole.ADMINISTRATOR,
        locationScope: 'national',
        bio: 'Full system access - can view and manage all data nationwide'
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
        bio: 'Regional manager - can view all in zone, approve missions'
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
        bio: 'Provincial manager - can view all in province, approve missions'
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
        bio: 'Department head - can view department & cluster, cannot approve missions'
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
        bio: 'Cluster manager - manages multiple schools, cannot approve missions'
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
        bio: 'School principal - can view teachers in school, approve missions'
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
        bio: 'Teacher - self check-in, self missions only'
      }
    ];

    console.log('\n🔑 Creating Demo Users for Role Testing...');
    console.log('============================================\n');

    for (const userData of demoUsers) {
      try {
        // Check if user already exists
        const existingUser = await dataSource.query(
          'SELECT id FROM users WHERE username = $1',
          [userData.username]
        );

        if (existingUser.length > 0) {
          console.log(`✓ User ${userData.username} already exists`);
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        // Insert user
        await dataSource.query(`
          INSERT INTO users (
            username, email, password, full_name, role, 
            location_scope, zone_id, province_id, department_id, 
            cluster_id, school_id, phone_number, 
            preferred_language, bio, is_active, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true, NOW(), NOW()
          )
        `, [
          userData.username,
          userData.email,
          hashedPassword,
          userData.fullName,
          userData.role,
          userData.locationScope,
          userData.zoneId || null,
          userData.provinceId || null,
          userData.departmentId || null,
          userData.clusterId || null,
          userData.schoolId || null,
          userData.phoneNumber,
          'km',
          userData.bio
        ]);

        console.log(`✅ Created demo user: ${userData.username} (${userData.role})`);
        console.log(`   Password: ${userData.password}`);
        console.log(`   Description: ${userData.bio}`);
      } catch (error) {
        console.error(`✗ Error creating user ${userData.username}:`, error.message);
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

    console.log('\n✨ Demo users created successfully!');
    console.log('You can now login with these accounts to test role-based access.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

createDemoUsers();