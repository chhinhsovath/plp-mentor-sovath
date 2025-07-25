const { Client } = require('pg');
require('dotenv').config();

async function checkAllTables() {
  console.log('🔍 Checking All Database Tables...\n');

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

    // Get all tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('📋 All Tables in Database:');
    console.log('=========================');
    
    if (tablesResult.rows.length === 0) {
      console.log('❌ No tables found!');
    } else {
      tablesResult.rows.forEach((table, index) => {
        console.log(`${index + 1}. ${table.table_name}`);
      });
    }

    // Check specific tables from our schema
    const expectedTables = [
      'users',
      'role_hierarchy_access',
      'observation_forms',
      'lesson_phases',
      'competency_domains',
      'indicators',
      'indicator_scales',
      'observation_sessions',
      'indicator_responses',
      'group_reflection_comments',
      'improvement_plans',
      'improvement_actions',
      'follow_up_activities',
      'signatures'
    ];

    console.log('\n🎯 Checking Expected Tables:');
    console.log('============================');
    
    for (const tableName of expectedTables) {
      const tableExists = tablesResult.rows.some(row => row.table_name === tableName);
      console.log(`${tableExists ? '✅' : '❌'} ${tableName}`);
    }

    // Check if we have seed data
    console.log('\n📊 Sample Data Check:');
    console.log('=====================');
    
    try {
      const roleHierarchyCount = await client.query('SELECT COUNT(*) FROM role_hierarchy_access');
      console.log(`✅ role_hierarchy_access: ${roleHierarchyCount.rows[0].count} records`);
    } catch (e) {
      console.log('❌ role_hierarchy_access: Table not found or error');
    }

    try {
      const observationFormsCount = await client.query('SELECT COUNT(*) FROM observation_forms');
      console.log(`✅ observation_forms: ${observationFormsCount.rows[0].count} records`);
    } catch (e) {
      console.log('❌ observation_forms: Table not found or error');
    }

    await client.end();
    console.log('\n✅ Table check complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAllTables();