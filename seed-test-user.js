const axios = require('axios');
const bcrypt = require('bcryptjs');

async function seedTestUser() {
  try {
    // First, let's try to connect directly to the database
    const { DataSource } = require('typeorm');
    
    const dataSource = new DataSource({
      type: 'sqlite',
      database: './data/plp-mentor.db',
      entities: ['dist/**/*.entity{.ts,.js}'],
      synchronize: true,
    });
    
    await dataSource.initialize();
    console.log('✓ Connected to database');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Insert test user directly
    const result = await dataSource.query(`
      INSERT OR REPLACE INTO users (
        id, username, email, password, full_name, role, 
        location_scope, is_active, created_at, updated_at,
        office_location, office_latitude, office_longitude
      ) VALUES (
        '${Date.now()}', 'teacher1', 'teacher1@example.com', 
        '${hashedPassword}', 'សោភា គ្រូបង្រៀន', 'Teacher', 
        'school', 1, datetime('now'), datetime('now'),
        'សាលាបឋមសិក្សាភ្នំពេញថ្មី', 11.5564, 104.9282
      )
    `);
    
    console.log('✓ Test user created/updated');
    
    // Also create an admin user
    const adminResult = await dataSource.query(`
      INSERT OR REPLACE INTO users (
        id, username, email, password, full_name, role, 
        location_scope, is_active, created_at, updated_at,
        office_location, office_latitude, office_longitude
      ) VALUES (
        '${Date.now() + 1}', 'admin', 'admin@example.com', 
        '${hashedPassword}', 'អ្នកគ្រប់គ្រង', 'Administrator', 
        'national', 1, datetime('now'), datetime('now'),
        'ក្រសួងអប់រំ យុវជន និងកីឡា', 11.5564, 104.9282
      )
    `);
    
    console.log('✓ Admin user created/updated');
    
    // Verify users exist
    const users = await dataSource.query('SELECT username, full_name, role, office_location FROM users');
    console.log('\nUsers in database:');
    users.forEach(user => {
      console.log(`  - ${user.username} (${user.full_name}) - ${user.role} - ${user.office_location || 'No office'}`);
    });
    
    await dataSource.destroy();
    console.log('\n✓ Database connection closed');
    
  } catch (error) {
    console.error('Error seeding users:', error);
  }
}

seedTestUser();