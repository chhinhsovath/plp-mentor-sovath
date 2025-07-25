import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { DatabaseUtils } from '../config/database.utils';

async function testDatabaseConnection() {
  const configService = new ConfigService();
  let dataSource: DataSource | null = null;

  try {
    console.log('🔄 Testing database connection...');
    console.log(`Host: ${configService.get('DB_HOST', 'localhost')}`);
    console.log(`Port: ${configService.get('DB_PORT', '5432')}`);
    console.log(`Database: ${configService.get('DB_NAME', 'mentoring_platform')}`);
    console.log(`Username: ${configService.get('DB_USERNAME', 'postgres')}`);
    console.log(`SSL: ${configService.get('DB_SSL', 'false')}`);

    // Test connection with retry logic
    dataSource = await DatabaseUtils.createConnection(configService);

    // Test basic query
    const result = await dataSource.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Query test successful!');
    console.log(`Current database time: ${result[0].current_time}`);
    console.log(`PostgreSQL version: ${result[0].pg_version.split(' ')[0]} ${result[0].pg_version.split(' ')[1]}`);

    // Test database existence
    const dbName = configService.get('DB_NAME', 'mentoring_platform');
    const dbExists = await DatabaseUtils.databaseExists(configService, dbName);
    console.log(`Database '${dbName}' exists: ${dbExists ? '✅' : '❌'}`);

    // Get database statistics
    const stats = await DatabaseUtils.getDatabaseStats(dataSource);
    if (stats) {
      console.log(`Database size: ${stats.databaseSize}`);
      console.log(`Number of tables: ${stats.tables.length}`);
      
      if (stats.tables.length > 0) {
        console.log('\n📊 Table statistics:');
        stats.tables.slice(0, 5).forEach((table: any) => {
          console.log(`   ${table.tablename}: ${table.live_tuples} rows`);
        });
      }
    }

    // Check for required extensions
    const extensions = await dataSource.query(`
      SELECT extname FROM pg_extension WHERE extname IN ('uuid-ossp', 'pg_trgm')
    `);
    console.log('\n🔧 Installed extensions:');
    extensions.forEach((ext: any) => {
      console.log(`   ✅ ${ext.extname}`);
    });

    // Test migration table
    const migrationTableExists = await DatabaseUtils.tableExists(dataSource, 'migrations');
    console.log(`\n📋 Migration table exists: ${migrationTableExists ? '✅' : '❌'}`);

    if (migrationTableExists) {
      const migrationCount = await DatabaseUtils.getTableRowCount(dataSource, 'migrations');
      console.log(`   Executed migrations: ${migrationCount}`);
    }

    // Test core tables
    const coreTables = ['users', 'observation_forms', 'observation_sessions', 'role_hierarchy_access'];
    console.log('\n🗃️  Core table status:');
    for (const table of coreTables) {
      const exists = await DatabaseUtils.tableExists(dataSource, table);
      if (exists) {
        const count = await DatabaseUtils.getTableRowCount(dataSource, table);
        console.log(`   ✅ ${table}: ${count} rows`);
      } else {
        console.log(`   ❌ ${table}: not found`);
      }
    }

    await dataSource.destroy();
    console.log('\n🔌 Connection closed');
    console.log('🎉 Database connection test completed successfully!');

  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    if (dataSource) {
      await dataSource.destroy();
    }
    
    console.log('\n🔧 Troubleshooting tips:');
    console.log('   1. Check if PostgreSQL is running');
    console.log('   2. Verify connection parameters in .env file');
    console.log('   3. Ensure database exists or run: npm run db:setup');
    console.log('   4. Check firewall and network connectivity');
    console.log('   5. Verify user permissions');
    
    process.exit(1);
  }
}

// Load environment variables
require('dotenv').config();

testDatabaseConnection();