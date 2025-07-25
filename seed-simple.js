const { Client } = require('pg');
const bcrypt = require('bcryptjs'); // Use same as auth service
require('dotenv').config();

async function seedUsers() {
  console.log('🌱 Seeding users with bcryptjs...\n');

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
    console.log('✅ Connected to database!\n');

    // Hash the password using bcryptjs (same as auth service)
    const hashedPassword = await bcrypt.hash('password', 10);
    
    console.log('Updating teacher_demo password...');
    
    // Update teacher_demo user password
    await client.query(
      'UPDATE users SET password = $1 WHERE username = $2',
      [hashedPassword, 'teacher_demo']
    );
    
    console.log('✅ Password updated for teacher_demo');
    
    // Verify the user
    const result = await client.query(
      'SELECT username, full_name, role, is_active FROM users WHERE username = $1',
      ['teacher_demo']
    );
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log(`✓ User verified: ${user.username} (${user.full_name}) - ${user.role} - Active: ${user.is_active}`);
    }

    await client.end();
    console.log('\n✅ Seeding complete!');
    
  } catch (error) {
    console.error('❌ Error seeding users:', error.message);
    process.exit(1);
  }
}

seedUsers();