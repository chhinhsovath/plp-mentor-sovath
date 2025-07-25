const { Client } = require('pg');
require('dotenv').config();

async function checkLiveDatabase() {
  console.log('🔍 Checking Live Database Users...\n');
  
  console.log('📡 Connecting to Remote Database:');
  console.log(`   Host: ${process.env.DB_HOST}`);
  console.log(`   Database: ${process.env.DB_NAME}`);
  console.log(`   Port: ${process.env.DB_PORT}\n`);

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
    console.log('✅ Connected to live database successfully!\n');

    // Check if users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ Users table does not exist in the database!');
      console.log('   Run migrations first: npm run migration:run');
      await client.end();
      return;
    }

    // Get all users
    console.log('👥 Current Users in Database:');
    console.log('================================');
    
    const usersResult = await client.query(`
      SELECT 
        id,
        username,
        email,
        "fullName",
        role,
        "isActive",
        "createdAt"
      FROM users
      ORDER BY "createdAt" DESC;
    `);

    if (usersResult.rows.length === 0) {
      console.log('❌ No users found in the database!');
    } else {
      usersResult.rows.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.username} (${user.role})`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Full Name: ${user.fullName}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   Created: ${new Date(user.createdAt).toLocaleString()}`);
      });
    }

    // Specifically check for chhinhs
    console.log('\n\n🔍 Checking for chhinhs user specifically...');
    const chhinhsResult = await client.query(`
      SELECT * FROM users WHERE username = 'chhinhs';
    `);

    if (chhinhsResult.rows.length > 0) {
      console.log('✅ User "chhinhs" EXISTS in the database!');
      const user = chhinhsResult.rows[0];
      console.log(`   ID: ${user.id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive}`);
    } else {
      console.log('❌ User "chhinhs" NOT FOUND in the database!');
      console.log('   You need to run: npx ts-node seed-dev-users.ts');
    }

    // Check role_hierarchy_access table
    console.log('\n\n📊 Checking Role Hierarchy:');
    const rolesResult = await client.query(`
      SELECT name, level FROM role_hierarchy_access ORDER BY level DESC;
    `);

    if (rolesResult.rows.length === 0) {
      console.log('❌ No roles found! Run: npx ts-node src/scripts/setup-database.ts');
    } else {
      rolesResult.rows.forEach(role => {
        console.log(`   ${role.name} (Level: ${role.level})`);
      });
    }

    await client.end();
    console.log('\n✅ Database check complete!');

  } catch (error) {
    console.error('❌ Error connecting to database:');
    console.error(`   ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Possible issues:');
      console.error('   1. Check if you can reach the server: ping 157.10.73.52');
      console.error('   2. Verify PostgreSQL is running on the server');
      console.error('   3. Check firewall rules for port 5432');
    } else if (error.code === '28P01') {
      console.error('\n💡 Authentication failed. Check your credentials in .env');
    }
    
    process.exit(1);
  }
}

// Run the check
checkLiveDatabase();