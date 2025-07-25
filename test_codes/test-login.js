const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testLogin() {
  try {
    console.log('🔐 Testing login with chhinhs account...\n');
    
    const response = await axios.post(`${API_URL}/auth/login`, {
      username: 'chhinhs',
      password: 'password'
    });

    console.log('✅ Login successful!');
    console.log('\n📋 User Information:');
    console.log(`   ID: ${response.data.user.id}`);
    console.log(`   Username: ${response.data.user.username}`);
    console.log(`   Full Name: ${response.data.user.fullName}`);
    console.log(`   Email: ${response.data.user.email}`);
    console.log(`   Role: ${response.data.user.role}`);
    console.log(`   Location Scope: ${JSON.stringify(response.data.user.locationScope)}`);
    console.log('\n🔑 Tokens:');
    console.log(`   Access Token: ${response.data.tokens.accessToken.substring(0, 50)}...`);
    console.log(`   Expires At: ${new Date(response.data.tokens.expiresAt).toLocaleString()}`);
    
  } catch (error) {
    console.error('❌ Login failed!');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data.message || error.response.data}`);
    } else {
      console.error(`   Error: ${error.message}`);
      console.error('\n⚠️  Make sure the backend is running on http://localhost:3000');
    }
  }
}

// Test other endpoints
async function testAuthenticatedRequest(token) {
  try {
    console.log('\n🔍 Testing authenticated request...');
    
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Authenticated request successful!');
    console.log(`   Current user: ${response.data.username}`);
    
  } catch (error) {
    console.error('❌ Authenticated request failed!');
    console.error(`   Error: ${error.response?.data?.message || error.message}`);
  }
}

// Run the test
console.log('🚀 PLP Mentoring Platform - Login Test\n');
console.log('📍 API URL:', API_URL);
console.log('👤 Test User: chhinhs\n');

testLogin();