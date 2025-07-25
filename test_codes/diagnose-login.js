const axios = require('axios');
const { Client } = require('pg');
require('dotenv').config({ path: './backend/.env' });

async function diagnoseLogin() {
  console.log('🔍 Diagnosing Login Issues\n');
  console.log('=========================\n');

  // Step 1: Check database connection and user
  console.log('1️⃣ Checking Database Connection...');
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
    console.log('   ✅ Database connected');

    // Check if chhinhs user exists
    const userResult = await client.query(
      'SELECT id, username, email, role, is_active FROM users WHERE username = $1',
      ['chhinhs']
    );

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log('   ✅ User "chhinhs" found:');
      console.log(`      - ID: ${user.id}`);
      console.log(`      - Email: ${user.email}`);
      console.log(`      - Role: ${user.role}`);
      console.log(`      - Active: ${user.is_active}`);
    } else {
      console.log('   ❌ User "chhinhs" NOT found in database!');
    }

    await client.end();
  } catch (error) {
    console.log('   ❌ Database error:', error.message);
  }

  // Step 2: Check if backend is running
  console.log('\n2️⃣ Checking Backend Server...');
  try {
    const healthCheck = await axios.get('http://localhost:3000/api/v1/auth/login', {
      timeout: 5000
    }).catch(err => err.response);

    if (healthCheck) {
      console.log('   ✅ Backend is responding');
      console.log(`   Status: ${healthCheck.status}`);
    } else {
      console.log('   ❌ Backend is NOT running!');
      console.log('   Run: cd backend && npm run start:dev');
      return;
    }
  } catch (error) {
    console.log('   ❌ Cannot reach backend:', error.message);
    console.log('   Make sure backend is running on port 3000');
    return;
  }

  // Step 3: Test login API directly
  console.log('\n3️⃣ Testing Login API Directly...');
  try {
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'chhinhs',
      password: 'password'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('   ✅ Login API Success!');
    console.log(`   Status: ${loginResponse.status}`);
    console.log('   Response includes:');
    if (loginResponse.data.tokens) {
      console.log('   - JWT Tokens ✅');
      console.log(`     Access Token: ${loginResponse.data.tokens.accessToken.substring(0, 50)}...`);
    }
    if (loginResponse.data.user) {
      console.log('   - User Data ✅');
      console.log(`     Username: ${loginResponse.data.user.username}`);
      console.log(`     Role: ${loginResponse.data.user.role}`);
    }

  } catch (error) {
    console.log('   ❌ Login API Failed!');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data.message || JSON.stringify(error.response.data)}`);
      
      if (error.response.status === 401) {
        console.log('\n   Possible issues:');
        console.log('   - Wrong password');
        console.log('   - User not active');
        console.log('   - Password not properly hashed in database');
      }
    } else {
      console.log(`   Error: ${error.message}`);
    }
  }

  // Step 4: Check frontend
  console.log('\n4️⃣ Checking Frontend...');
  try {
    const frontendCheck = await axios.get('http://localhost:5173', {
      timeout: 5000
    });
    
    if (frontendCheck.status === 200) {
      console.log('   ✅ Frontend is running');
    }
  } catch (error) {
    console.log('   ❌ Frontend is NOT running!');
    console.log('   Run: cd frontend && npm run dev');
  }

  // Step 5: Check API configuration
  console.log('\n5️⃣ Checking API Configuration...');
  console.log('   Backend expects: /api/v1/auth/login');
  console.log('   Frontend .env should have: VITE_API_URL=http://localhost:3000/api/v1');

  // Summary
  console.log('\n📊 Summary');
  console.log('==========');
  console.log('To fix login issues:');
  console.log('1. Make sure both servers are running:');
  console.log('   - cd backend && npm run start:dev');
  console.log('   - cd frontend && npm run dev');
  console.log('2. Check frontend/.env has correct API URL');
  console.log('3. Try logging in at http://localhost:5173/login');
  console.log('4. Username: chhinhs');
  console.log('5. Password: password');
}

// Run diagnosis
diagnoseLogin().catch(console.error);