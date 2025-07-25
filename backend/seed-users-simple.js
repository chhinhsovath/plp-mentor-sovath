const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function seedUsers() {
  console.log('🌱 Seeding users to live database...\n');

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

    // Hash the password once
    const hashedPassword = await bcrypt.hash('password', 10);
    
    // Users to create
    const users = [
      {
        username: 'chhinhs',
        email: 'chhinhs@moeys.gov.kh',
        full_name: 'Chheng Sothy',
        role: 'Administrator',
        location_scope: JSON.stringify({ type: 'national', id: 'cambodia', name: 'Cambodia' })
      },
      {
        username: 'admin',
        email: 'admin@moeys.gov.kh',
        full_name: 'System Administrator',
        role: 'Administrator',
        location_scope: JSON.stringify({ type: 'national', id: 'cambodia', name: 'Cambodia' })
      },
      {
        username: 'teacher_demo',
        email: 'teacher@moeys.gov.kh',
        full_name: 'Demo Teacher',
        role: 'Teacher',
        location_scope: JSON.stringify({ type: 'school', id: 'school-001', name: 'Demo School' })
      },
      {
        username: 'zone_demo',
        email: 'zone@moeys.gov.kh',
        full_name: 'Zone Manager',
        role: 'Zone',
        location_scope: JSON.stringify({ type: 'zone', id: 'zone-1', name: 'Zone 1' })
      }
    ];

    console.log('Creating users...\n');
    
    for (const user of users) {
      // Check if user already exists
      const checkResult = await client.query(
        'SELECT id, username FROM users WHERE username = $1',
        [user.username]
      );

      if (checkResult.rows.length > 0) {
        console.log(`⚠️  User ${user.username} already exists`);
        
        // Update password to ensure it's correct
        await client.query(
          'UPDATE users SET password = $1 WHERE username = $2',
          [hashedPassword, user.username]
        );
        console.log(`   ✅ Password updated to: password`);
      } else {
        // Create new user
        const insertResult = await client.query(`
          INSERT INTO users (
            id,
            username,
            email,
            password,
            full_name,
            role,
            location_scope,
            is_active,
            created_at,
            updated_at
          ) VALUES (
            gen_random_uuid(),
            $1, $2, $3, $4, $5, $6, $7, 
            NOW(), NOW()
          )
          RETURNING id, username;
        `, [
          user.username,
          user.email,
          hashedPassword,
          user.full_name,
          user.role,
          user.location_scope,
          true
        ]);
        
        console.log(`✅ Created user: ${user.username}`);
        console.log(`   ID: ${insertResult.rows[0].id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Password: password`);
      }
      console.log('');
    }

    // Show final user count
    const countResult = await client.query('SELECT COUNT(*) FROM users');
    console.log(`\n📊 Total users in database: ${countResult.rows[0].count}`);

    await client.end();
    
    console.log('\n✅ Seeding complete!');
    console.log('\n📋 Login Credentials:');
    console.log('====================');
    console.log('Username: chhinhs');
    console.log('Password: password');
    console.log('Role: Administrator');
    console.log('\nOther test users:');
    console.log('- admin / password (Administrator)');
    console.log('- teacher_demo / password (Teacher)');
    console.log('- zone_demo / password (Zone Manager)');

  } catch (error) {
    console.error('❌ Error seeding users:');
    console.error(`   ${error.message}`);
    if (error.detail) {
      console.error(`   Detail: ${error.detail}`);
    }
    process.exit(1);
  }
}

// Run the seeding
seedUsers();