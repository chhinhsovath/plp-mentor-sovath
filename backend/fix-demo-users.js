require('dotenv').config();
const { DataSource } = require('typeorm');
const bcrypt = require('bcrypt');
const path = require('path');

// Define UserRole enum values
const UserRole = {
  ZONE: 'Zone',
  TEACHER: 'Teacher',
};

async function fixDemoUsers() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'daunpenhsovath.c2uikekrbf9c.us-east-1.rds.amazonaws.com',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'SovathGogLikeLive',
    database: process.env.DB_NAME || 'plp_mentoring_sovath',
    entities: [path.join(__dirname, 'src/entities/*.entity.js')],
    synchronize: false,
    logging: true,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connected');

    // First, let's check what users exist
    console.log('\n📋 Checking existing demo users...');
    const existingUsers = await dataSource.query(
      `SELECT username, email, role, is_active FROM users WHERE username LIKE '%_demo'`
    );
    console.log('Existing demo users:', existingUsers);

    // Check specifically for teacher_demo and zone_demo
    const problemUsers = await dataSource.query(
      `SELECT username, email, role, is_active FROM users WHERE username IN ('teacher_demo', 'zone_demo')`
    );
    console.log('\nProblem users status:', problemUsers);

    // Delete existing teacher_demo and zone_demo if they exist
    console.log('\n🗑️ Removing existing teacher_demo and zone_demo...');
    await dataSource.query(`DELETE FROM users WHERE username IN ('teacher_demo', 'zone_demo')`);

    // Recreate the users
    const usersToFix = [
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

    console.log('\n🔧 Recreating users...');
    for (const userData of usersToFix) {
      try {
        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        // Insert user
        await dataSource.query(`
          INSERT INTO users (
            id, username, email, password, full_name, role, 
            location_scope, zone_id, province_id, department_id, 
            cluster_id, school_id, phone_number, 
            preferred_language, bio, is_active, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true, NOW(), NOW()
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

        console.log(`✅ Created user: ${userData.username} (${userData.role})`);
        console.log(`   Password: ${userData.password}`);
      } catch (error) {
        console.error(`❌ Error creating user ${userData.username}:`, error.message);
      }
    }

    // Verify the users were created
    console.log('\n✅ Verifying created users...');
    const verifyUsers = await dataSource.query(
      `SELECT username, email, role, is_active, location_scope FROM users WHERE username IN ('teacher_demo', 'zone_demo')`
    );
    console.log('Verified users:', verifyUsers);

    console.log('\n✨ Fix completed!');
    console.log('\n🔑 Login Credentials:');
    console.log('================================');
    console.log('Zone: zone_demo / Zone@123');
    console.log('Teacher: teacher_demo / Teacher@123');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

fixDemoUsers();