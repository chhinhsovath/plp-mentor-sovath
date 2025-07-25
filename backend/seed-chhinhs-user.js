const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function seedChhinhsUser() {
  console.log('🌱 Seeding chhinhs user to live database...\n');

  const client = new Client({
    host: process.env.DB_HOST || '157.10.73.52',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'admin',
    password: process.env.DB_PASSWORD || 'P@ssw0rd',
    database: process.env.DB_NAME || 'plp_mentoring_sovath',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database!\n');

    // Check if user already exists
    const checkResult = await client.query(
      'SELECT id, username, role FROM users WHERE username = $1',
      ['chhinhs']
    );

    if (checkResult.rows.length > 0) {
      console.log('⚠️  User chhinhs already exists!');
      console.log(`   ID: ${checkResult.rows[0].id}`);
      console.log(`   Role: ${checkResult.rows[0].role}`);
      
      // Update password to ensure it's correct
      const hashedPassword = await bcrypt.hash('password', 10);
      await client.query(
        'UPDATE users SET password = $1 WHERE username = $2',
        [hashedPassword, 'chhinhs']
      );
      console.log('✅ Password updated to: password');
      
      await client.end();
      return;
    }

    // First, check if we have the role hierarchy set up
    const roleCheck = await client.query(
      "SELECT id FROM role_hierarchy_access WHERE name = 'Administrator'"
    );

    let roleHierarchyId = null;
    if (roleCheck.rows.length > 0) {
      roleHierarchyId = roleCheck.rows[0].id;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('password', 10);

    // Location scope for administrator
    const locationScope = JSON.stringify({
      type: 'national',
      id: 'cambodia',
      name: 'Cambodia'
    });

    // Insert the chhinhs user
    const insertResult = await client.query(`
      INSERT INTO users (
        username,
        email,
        password,
        full_name,
        role,
        location_scope,
        is_active,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id, username, email, role;
    `, [
      'chhinhs',
      'chhinhs@moeys.gov.kh',
      hashedPassword,
      'Chheng Sothy',
      'Administrator',
      locationScope,
      true
    ]);

    console.log('✅ User created successfully!');
    console.log(`   ID: ${insertResult.rows[0].id}`);
    console.log(`   Username: ${insertResult.rows[0].username}`);
    console.log(`   Email: ${insertResult.rows[0].email}`);
    console.log(`   Role: ${insertResult.rows[0].role}`);
    console.log(`   Password: password`);

    // Also create a few more test users
    console.log('\n🌱 Creating additional test users...');
    
    const testUsers = [
      {
        username: 'admin',
        email: 'admin@moeys.gov.kh',
        full_name: 'System Administrator',
        role: 'Administrator'
      },
      {
        username: 'teacher1',
        email: 'teacher1@moeys.gov.kh',
        full_name: 'Test Teacher',
        role: 'Teacher'
      }
    ];

    for (const user of testUsers) {
      // Check if user exists
      const exists = await client.query(
        'SELECT id FROM users WHERE username = $1',
        [user.username]
      );

      if (exists.rows.length === 0) {
        await client.query(`
          INSERT INTO users (
            username, email, password, full_name, role,
            location_scope, is_active, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        `, [
          user.username,
          user.email,
          hashedPassword,
          user.full_name,
          user.role,
          locationScope,
          true
        ]);
        console.log(`   ✅ Created user: ${user.username} (password: password)`);
      } else {
        console.log(`   ⚠️  User ${user.username} already exists`);
      }
    }

    await client.end();
    console.log('\n✅ Seeding complete!');
    console.log('\n📋 You can now login with:');
    console.log('   Username: chhinhs');
    console.log('   Password: password');
    console.log('   Role: Administrator');

  } catch (error) {
    console.error('❌ Error seeding user:');
    console.error(`   ${error.message}`);
    if (error.detail) {
      console.error(`   Detail: ${error.detail}`);
    }
    process.exit(1);
  }
}

// Run the seeding
seedChhinhsUser();