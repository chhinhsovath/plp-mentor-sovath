const axios = require('axios');

async function testLogin() {
  console.log('Testing login with Docker backend...');
  
  try {
    const response = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'chhinhs',
      password: 'password'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login successful!');
    console.log('Response:', {
      status: response.status,
      user: response.data.user,
      hasAccessToken: !!response.data.access_token,
      hasRefreshToken: !!response.data.refresh_token
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    throw error;
  }
}

// Test the login
testLogin()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));