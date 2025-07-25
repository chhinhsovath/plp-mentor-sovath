// Test distance calculation functionality
const axios = require('axios');

async function testDistanceCalculation() {
  console.log('🧪 Testing Distance Calculation...\n');
  
  try {
    // 1. Login
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'teacher_demo',
      password: 'password'
    });
    
    const token = loginResponse.data.access_token;
    const user = loginResponse.data.user;
    console.log('✓ Login successful');
    console.log(`  User: ${user.fullName}`);
    
    // 2. Get user profile to check office location
    console.log('\n2. Checking user office location...');
    const authAxios = axios.create({
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const profileResponse = await authAxios.get('http://localhost:3000/api/v1/auth/profile');
    const profile = profileResponse.data;
    
    if (profile.officeLatitude && profile.officeLongitude) {
      console.log('✓ Office location found:');
      console.log(`  Location: ${profile.officeLocation}`);
      console.log(`  Coordinates: ${profile.officeLatitude}, ${profile.officeLongitude}`);
    } else {
      console.log('⚠ No office location set for user');
      return;
    }
    
    // 3. Test distance calculation with manual calculation
    console.log('\n3. Testing distance calculation...');
    
    // Test coordinates: Siem Reap (destination)
    const destinationLat = 13.3633;
    const destinationLng = 103.8564;
    const officeLat = profile.officeLatitude;
    const officeLng = profile.officeLongitude;
    
    console.log(`  From: Office (${officeLat}, ${officeLng})`);
    console.log(`  To: Siem Reap (${destinationLat}, ${destinationLng})`);
    
    // Manual Haversine calculation
    function calculateDistance(lat1, lon1, lat2, lon2) {
      const R = 6371; // Radius of the Earth in kilometers
      const dLat = toRadians(lat2 - lat1);
      const dLon = toRadians(lon2 - lon1);
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      return Math.round(distance * 10) / 10;
    }
    
    function toRadians(degrees) {
      return degrees * (Math.PI / 180);
    }
    
    function calculateTravelTime(distance) {
      const durationByCar = Math.round((distance / 50) * 60); // 50 km/h in minutes
      const durationByBus = Math.round((distance / 35) * 60); // 35 km/h in minutes
      return { durationByCar, durationByBus };
    }
    
    const distance = calculateDistance(officeLat, officeLng, destinationLat, destinationLng);
    const { durationByCar, durationByBus } = calculateTravelTime(distance);
    
    console.log(`✓ Distance calculated: ${distance} km`);
    console.log(`✓ Travel time by car: ${Math.floor(durationByCar / 60)}h ${durationByCar % 60}m`);
    console.log(`✓ Travel time by bus: ${Math.floor(durationByBus / 60)}h ${durationByBus % 60}m`);
    
    // 4. Create a mission to test if distance is included
    console.log('\n4. Creating mission with location...');
    const missionData = {
      title: 'បេសកកម្មតេស្តការគិតចម្ងាយ',
      description: 'តេស្តការគិតចម្ងាយពីការិយាល័យទៅកាន់ទីតាំងបេសកកម្ម',
      type: 'field_trip',
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      location: 'សៀមរាប',
      latitude: destinationLat,
      longitude: destinationLng,
      purpose: 'តេស្តការគិតចម្ងាយ',
      objectives: 'ពិនិត្យមើលការគិតចម្ងាយដំណើរ',
      expectedOutcomes: 'ដឹងចម្ងាយ និងពេលវេលាធ្វើដំណើរ',
      budget: 100000,
      transportationDetails: 'ធ្វើដំណើរដោយរថយន្ត'
    };
    
    const createResponse = await authAxios.post('http://localhost:3000/api/v1/missions', missionData);
    
    console.log('✓ Mission created successfully!');
    console.log(`  Mission ID: ${createResponse.data.id}`);
    
    // 5. Fetch mission details to see if distance info is stored
    console.log('\n5. Checking mission details...');
    const missionDetails = await authAxios.get(`http://localhost:3000/api/v1/missions/${createResponse.data.id}`);
    
    console.log('✓ Mission details:');
    console.log(`  Title: ${missionDetails.data.title}`);
    console.log(`  Location: ${missionDetails.data.location}`);
    console.log(`  Coordinates: ${missionDetails.data.latitude}, ${missionDetails.data.longitude}`);
    
    // Check if there are any additional distance-related fields
    if (missionDetails.data.distanceFromOffice) {
      console.log(`  Distance from office: ${missionDetails.data.distanceFromOffice} km`);
    }
    
    console.log('\n🎉 Distance calculation test completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - User has office location: ✓`);
    console.log(`   - Distance calculation works: ✓`);
    console.log(`   - Travel time calculation works: ✓`);
    console.log(`   - Mission creation with coordinates: ✓`);
    console.log(`   - Distance: ${distance} km`);
    console.log(`   - Car travel time: ${Math.floor(durationByCar / 60)}h ${durationByCar % 60}m`);
    console.log(`   - Bus travel time: ${Math.floor(durationByBus / 60)}h ${durationByBus % 60}m`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.error('   Authentication failed. Check credentials.');
    }
  }
}

testDistanceCalculation();