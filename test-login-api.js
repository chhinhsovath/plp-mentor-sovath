const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login...');
    
    // Try to login as chhinhs
    const response = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'chhinhs',
      password: 'password'  // Password from seed file
    });
    
    console.log('Login successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Test fetching users with the token
    if (response.data.access_token) {
      console.log('\nTesting users endpoint with token...');
      const usersResponse = await axios.get('http://localhost:3000/api/v1/users', {
        headers: {
          'Authorization': `Bearer ${response.data.access_token}`
        }
      });
      
      console.log('Users fetched successfully!');
      console.log('Total users:', usersResponse.data.meta.total);
      console.log('First user:', usersResponse.data.data[0]);
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testLogin();