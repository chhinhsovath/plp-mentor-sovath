const { Client } = require('pg');
require('dotenv').config();

async function checkDatabaseSchema() {
  console.log('🔍 Checking Database Schema...\n');

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

    // Get columns of users table
    console.log('📋 Users Table Schema:');
    console.log('=====================');
    
    const columnsResult = await client.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'users'
      ORDER BY ordinal_position;
    `);

    if (columnsResult.rows.length === 0) {
      console.log('❌ Users table not found!');
    } else {
      columnsResult.rows.forEach(col => {
        console.log(`   ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    }

    // Now check users with correct column names
    console.log('\n\n👥 All Users in Database:');
    console.log('========================');
    
    const usersResult = await client.query(`
      SELECT * FROM users ORDER BY username;
    `);

    if (usersResult.rows.length === 0) {
      console.log('❌ No users found in the database!');
    } else {
      console.log(`Found ${usersResult.rows.length} users:\n`);
      
      usersResult.rows.forEach((user, index) => {
        console.log(`${index + 1}. Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive || user.is_active || 'N/A'}`);
        
        // Show all fields for first user as example
        if (index === 0) {
          console.log('\n   All fields for this user:');
          Object.keys(user).forEach(key => {
            if (key !== 'password') { // Don't show password
              console.log(`   - ${key}: ${user[key]}`);
            }
          });
        }
        console.log('---');
      });
    }

    // Check for chhinhs specifically
    console.log('\n🔍 Checking for chhinhs user:');
    const chhinhsResult = await client.query(`
      SELECT username, email, role FROM users WHERE username = 'chhinhs';
    `);

    if (chhinhsResult.rows.length > 0) {
      console.log('✅ User "chhinhs" EXISTS!');
    } else {
      console.log('❌ User "chhinhs" NOT FOUND!');
    }

    await client.end();
    console.log('\n✅ Schema check complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDatabaseSchema();