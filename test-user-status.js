const axios = require('axios');

async function testUserStatus() {
  try {
    console.log('Testing user status display consistency...\n');
    
    // Check if backend is up first
    const healthCheck = await axios.get('http://localhost:3000/api/v1/health');
    console.log('Backend health:', healthCheck.data.status);
    
    // Try different potential credentials
    const credentials = [
      { username: 'chhinhs', password: 'password' },
      { username: 'teacher_demo', password: 'password' },
      { username: 'admin', password: 'admin123' },
      { username: 'admin', password: 'password' },
      { username: 'demo', password: 'password' },
      { username: 'chhinh', password: 'password' }
    ];
    
    let token = null;
    let loginResponse = null;
    
    for (const cred of credentials) {
      try {
        console.log(`Trying login with: ${cred.username}`);
        loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', cred);
        token = loginResponse.data.data.accessToken;
        console.log(`✅ Login successful with: ${cred.username}\n`);
        break;
      } catch (err) {
        console.log(`❌ Login failed with: ${cred.username}`);
      }
    }
    
    if (!token) {
      throw new Error('Could not login with any credentials');
    }
    
    // Get users list
    const usersResponse = await axios.get('http://localhost:3000/api/v1/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Users data structure analysis:');
    console.log('=====================================\n');
    
    const users = usersResponse.data.data || [];
    
    users.forEach((user, index) => {
      console.log(`User ${index + 1}: ${user.fullName} (@${user.username})`);
      console.log(`  - status: ${user.status} (${typeof user.status})`);
      console.log(`  - isActive: ${user.isActive} (${typeof user.isActive})`);
      console.log(`  - Should show as: ${user.isActive ? 'Active' : 'Inactive'} in list`);
      console.log('');
    });
    
    // Find teacher_demo user specifically
    const teacherDemo = users.find(u => u.username === 'teacher_demo');
    if (teacherDemo) {
      console.log('\n🔍 TEACHER_DEMO USER ANALYSIS:');
      console.log('================================');
      console.log(`Full Name: ${teacherDemo.fullName}`);
      console.log(`Username: ${teacherDemo.username}`);
      console.log(`Status (string): ${teacherDemo.status}`);
      console.log(`IsActive (boolean): ${teacherDemo.isActive}`);
      console.log(`List should show: ${teacherDemo.isActive ? '✅ Active (Green)' : '❌ Inactive (Red)'}`);
      console.log(`Edit form should show: ${teacherDemo.isActive ? '✅ Switch ON' : '❌ Switch OFF'}`);
    } else {
      console.log('\n❌ teacher_demo user not found in the list');
    }
    
  } catch (error) {
    console.error('Error testing user status:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testUserStatus();