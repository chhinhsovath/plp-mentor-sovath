import { createConnection } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function addMissingColumns() {
  console.log('Adding missing columns to database...');
  
  try {
    const connection = await createConnection({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'mentoring_platform',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });

    // Check if phone_number column exists
    const result = await connection.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'phone_number';
    `);

    if (result.length === 0) {
      console.log('Adding phone_number column to users table...');
      await connection.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS phone_number VARCHAR(255);
      `);
      console.log('✅ phone_number column added successfully');
    } else {
      console.log('phone_number column already exists');
    }

    // Check if profile_picture column exists
    const profilePicResult = await connection.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'profile_picture';
    `);

    if (profilePicResult.length === 0) {
      console.log('Adding profile_picture column to users table...');
      await connection.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(255);
      `);
      console.log('✅ profile_picture column added successfully');
    }

    // Check if preferred_language column exists
    const langResult = await connection.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'preferred_language';
    `);

    if (langResult.length === 0) {
      console.log('Adding preferred_language column to users table...');
      await connection.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(255) DEFAULT 'en';
      `);
      console.log('✅ preferred_language column added successfully');
    }

    // Check if bio column exists
    const bioResult = await connection.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'bio';
    `);

    if (bioResult.length === 0) {
      console.log('Adding bio column to users table...');
      await connection.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS bio TEXT;
      `);
      console.log('✅ bio column added successfully');
    }

    await connection.close();
    console.log('🎉 All missing columns added successfully!');
  } catch (error) {
    console.error('❌ Error adding columns:', error);
    process.exit(1);
  }
}

addMissingColumns();