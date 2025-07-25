const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/v1';

async function testMissionCreation() {
  let token = null;
  
  try {
    // 1. Login
    console.log('1. Testing Login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      username: 'teacher_demo',
      password: 'password'
    });
    
    if (loginResponse.data.access_token) {
      token = loginResponse.data.access_token;
      console.log('✓ Login successful');
      console.log('  User:', loginResponse.data.user.fullName);
      console.log('  Role:', loginResponse.data.user.role);
    }
    
    // Set auth header for subsequent requests
    const authAxios = axios.create({
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // 2. Create Mission
    console.log('\n2. Creating mission...');
    const missionData = {
      title: 'បេសកកម្មទស្សនកិច្ចសាលារៀនបឋមសិក្សា',
      description: 'ទស្សនកិច្ចការអនុវត្តវិធីសាស្ត្របង្រៀនថ្មីនៅសាលាបឋមសិក្សា',
      type: 'field_trip',
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      endDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
      location: 'សាលាបឋមសិក្សាអង្គរថម',
      latitude: 13.3633,
      longitude: 103.8564,
      purpose: 'ស្វែងយល់អំពីវិធីសាស្ត្របង្រៀនថ្មីៗ និងការអនុវត្តជាក់ស្តែង',
      objectives: '1. សង្កេតការបង្រៀន\n2. ពិភាក្សាជាមួយគ្រូបង្រៀន\n3. ចូលរួមក្នុងសកម្មភាពថ្នាក់រៀន',
      expectedOutcomes: 'ទទួលបានចំណេះដឹងថ្មីអំពីវិធីសាស្ត្របង្រៀន',
      budget: 500000, // 500,000 Riel
      transportationDetails: 'ធ្វើដំណើរដោយរថយន្តក្រុមហ៊ុន',
      accommodationDetails: 'ស្នាក់នៅសណ្ឋាគារក្នុងស្រុក'
    };
    
    const createResponse = await authAxios.post(`${API_BASE}/missions`, missionData);
    
    if (createResponse.data.id) {
      console.log('✓ Mission created successfully!');
      console.log('  Mission ID:', createResponse.data.id);
      console.log('  Status:', createResponse.data.status);
      console.log('  Title:', createResponse.data.title);
      
      // 3. Get mission details
      console.log('\n3. Fetching mission details...');
      const detailResponse = await authAxios.get(`${API_BASE}/missions/${createResponse.data.id}`);
      
      console.log('✓ Mission details retrieved:');
      console.log('  Location:', detailResponse.data.location);
      console.log('  Coordinates:', detailResponse.data.latitude, detailResponse.data.longitude);
      console.log('  Budget:', detailResponse.data.budget, 'KHR');
      console.log('  Created by:', detailResponse.data.createdBy?.fullName || 'N/A');
      
      // 4. List all missions
      console.log('\n4. Listing missions...');
      const listResponse = await authAxios.get(`${API_BASE}/missions`);
      
      console.log(`✓ Found ${listResponse.data.total} missions`);
      const ourMission = listResponse.data.missions.find(m => m.id === createResponse.data.id);
      if (ourMission) {
        console.log('✓ Our mission is in the list!');
      }
      
      // 5. Update mission status (submit for approval)
      console.log('\n5. Submitting mission for approval...');
      const statusResponse = await authAxios.patch(`${API_BASE}/missions/${createResponse.data.id}/status`, {
        status: 'submitted'
      });
      
      console.log('✓ Mission status updated to:', statusResponse.data.status);
      
    }
    
  } catch (error) {
    console.error('\n✗ Test failed:', error.response?.data || error.message);
    if (error.response?.data?.message) {
      console.error('  Error message:', error.response.data.message);
    }
    if (error.response?.status === 401) {
      console.error('  Authentication failed. Check if user exists and password is correct.');
    }
  }
}

// Run the test
console.log('Testing Mission Creation API...\n');
console.log('Backend URL:', API_BASE);
console.log('----------------------------\n');

testMissionCreation().then(() => {
  console.log('\n✓ All tests completed!');
}).catch(error => {
  console.error('\n✗ Test suite failed:', error);
  process.exit(1);
});