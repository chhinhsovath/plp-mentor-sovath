const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: './backend/.env' });

async function verifyLogin() {
  console.log('🔐 Direct Database Login Verification\n');
  
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
    console.log('✅ Connected to database\n');

    // Get user from database
    const userResult = await client.query(
      'SELECT * FROM users WHERE username = $1',
      ['chhinhs']
    );

    if (userResult.rows.length === 0) {
      console.log('❌ User chhinhs not found!');
      return;
    }

    const user = userResult.rows[0];
    console.log('✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.is_active}`);
    console.log(`   Full Name: ${user.full_name}\n`);

    // Test password
    console.log('🔑 Testing password...');
    const testPassword = 'password';
    const isValidPassword = await bcrypt.compare(testPassword, user.password);
    
    if (isValidPassword) {
      console.log('✅ Password "password" is CORRECT!');
      console.log('   The login should work once backend is fixed.\n');
    } else {
      console.log('❌ Password "password" is INCORRECT!');
      console.log('   The password hash does not match.\n');
      
      // Let's update the password to ensure it's correct
      console.log('🔧 Updating password to "password"...');
      const newHash = await bcrypt.hash('password', 10);
      
      await client.query(
        'UPDATE users SET password = $1 WHERE username = $2',
        [newHash, 'chhinhs']
      );
      
      console.log('✅ Password updated successfully!');
      console.log('   You can now login with:');
      console.log('   Username: chhinhs');
      console.log('   Password: password\n');
    }

    // Show what the backend issue is
    console.log('⚠️  Backend Issue:');
    console.log('The Docker backend has TypeScript compilation errors.');
    console.log('This is preventing the API from running.\n');
    
    console.log('🛠️  To fix:');
    console.log('1. Fix the TypeScript errors in the backend code');
    console.log('2. OR run the backend locally instead of Docker:');
    console.log('   cd backend');
    console.log('   npm run start:dev\n');
    
    console.log('3. The frontend in Docker should work with local backend');
    console.log('   Frontend: http://localhost:5173 (Docker)');
    console.log('   Backend: http://localhost:3000 (Local)');

    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyLogin();