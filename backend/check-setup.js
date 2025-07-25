const { Client } = require('pg');
require('dotenv').config();

async function checkSetup() {
  console.log('🔍 Checking Backend Setup...\n');

  // 1. Check environment variables
  console.log('1️⃣ Environment Variables:');
  console.log(`   DB_HOST: ${process.env.DB_HOST}`);
  console.log(`   DB_PORT: ${process.env.DB_PORT}`);
  console.log(`   DB_USERNAME: ${process.env.DB_USERNAME}`);
  console.log(`   DB_NAME: ${process.env.DB_NAME}`);
  console.log(`   PORT: ${process.env.PORT || 3000}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}\n`);

  // 2. Test database connection
  console.log('2️⃣ Testing Database Connection...');
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('   ✅ Database connection successful!\n');

    // 3. Check if users table exists
    console.log('3️⃣ Checking Database Tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('   Found tables:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // 4. Check if chhinhs user exists
    console.log('\n4️⃣ Checking for chhinhs user...');
    const userResult = await client.query(`
      SELECT id, username, email, role, "isActive" 
      FROM users 
      WHERE username = 'chhinhs'
    `);

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log('   ✅ User found!');
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Username: ${user.username}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Role: ${user.role}`);
      console.log(`   - Active: ${user.isActive}`);
    } else {
      console.log('   ❌ User chhinhs not found!');
      console.log('   Run: npx ts-node seed-dev-users.ts');
    }

    await client.end();
  } catch (error) {
    console.error('   ❌ Database connection failed!');
    console.error(`   Error: ${error.message}`);
    process.exit(1);
  }

  console.log('\n✅ Setup check complete!');
}

checkSetup();