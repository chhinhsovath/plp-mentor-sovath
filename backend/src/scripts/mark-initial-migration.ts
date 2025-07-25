import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

async function markInitialMigration() {
  const configService = new ConfigService();
  let dataSource: DataSource | null = null;

  try {
    console.log('🔄 Marking initial migration as executed...');

    const dataSourceConfig = {
      type: 'postgres' as const,
      host: configService.get('DB_HOST', 'localhost'),
      port: parseInt(configService.get('DB_PORT', '5432')),
      username: configService.get('DB_USERNAME', 'postgres'),
      password: configService.get('DB_PASSWORD', 'password'),
      database: configService.get('DB_NAME', 'mentoring_platform'),
      ssl: configService.get('DB_SSL', 'false') === 'true' ? { rejectUnauthorized: false } : false,
      connectTimeoutMS: 60000,
    };

    dataSource = new DataSource(dataSourceConfig);
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Check if migrations table exists
    const migrationTableExists = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migrations'
      )
    `);

    if (!migrationTableExists[0].exists) {
      // Create migrations table
      await dataSource.query(`
        CREATE TABLE "migrations" (
          "id" SERIAL NOT NULL,
          "timestamp" bigint NOT NULL,
          "name" character varying NOT NULL,
          CONSTRAINT "PK_migrations_id" PRIMARY KEY ("id")
        )
      `);
      console.log('✅ Created migrations table');
    }

    // Check if initial migration is already recorded
    const existingMigration = await dataSource.query(`
      SELECT * FROM migrations WHERE name = 'InitialSchema1700000000000'
    `);

    if (existingMigration.length === 0) {
      // Insert the initial migration record
      await dataSource.query(`
        INSERT INTO migrations (timestamp, name) 
        VALUES (1700000000000, 'InitialSchema1700000000000')
      `);
      console.log('✅ Marked InitialSchema1700000000000 as executed');
    } else {
      console.log('ℹ️  InitialSchema1700000000000 already marked as executed');
    }

    // Show current migration status
    const allMigrations = await dataSource.query(`
      SELECT * FROM migrations ORDER BY timestamp
    `);
    console.log('📊 Current migrations:');
    allMigrations.forEach((migration: any) => {
      console.log(`   - ${migration.name} (${new Date(parseInt(migration.timestamp)).toISOString()})`);
    });

    await dataSource.destroy();
    console.log('🔌 Database connection closed');
    console.log('🎉 Initial migration marking completed!');

  } catch (error) {
    console.error('❌ Failed to mark initial migration:', error.message);
    if (dataSource) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

// Load environment variables
require('dotenv').config();

markInitialMigration();