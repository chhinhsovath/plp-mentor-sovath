const axios = require('axios');

async function testObservationAPI() {
  try {
    // First, login to get a token
    console.log('Logging in...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'chhinhs',
      password: 'password'
    });
    
    const token = loginResponse.data.access_token;
    console.log('Login successful!');
    
    // Test observation sessions endpoint
    console.log('\nTesting observation sessions endpoint...');
    try {
      const response = await axios.get('http://localhost:3000/api/v1/observation-sessions', {
        params: {
          page: 1,
          limit: 10
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Success! Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error('Error calling observation sessions API:');
      console.error('Status:', error.response?.status);
      console.error('Error data:', JSON.stringify(error.response?.data, null, 2));
    }
    
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
  }
}

testObservationAPI();