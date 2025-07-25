import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { runSeeds } from '../seeds';
import { DatabaseUtils } from '../config/database.utils';
import {
  User,
  RoleHierarchyAccess,
  ObservationForm,
  LessonPhase,
  CompetencyDomain,
  Indicator,
  IndicatorScale,
  ObservationSession,
  IndicatorResponse,
  GroupReflectionComment,
  ImprovementPlan,
  ImprovementAction,
  FollowUpActivity,
  Signature,
} from '../entities';

async function setupDatabase() {
  const configService = new ConfigService();
  let dataSource: DataSource | null = null;

  try {
    // Create database if it doesn't exist
    const databaseName = configService.get('DB_NAME', 'mentoring_platform');
    await DatabaseUtils.createDatabaseIfNotExists(configService, databaseName);

    // Create connection with retry logic and entities
    const dataSourceConfig = {
      type: 'postgres' as const,
      host: configService.get('DB_HOST', 'localhost'),
      port: parseInt(configService.get('DB_PORT', '5432')),
      username: configService.get('DB_USERNAME', 'postgres'),
      password: configService.get('DB_PASSWORD', 'password'),
      database: configService.get('DB_NAME', 'mentoring_platform'),
      ssl: configService.get('DB_SSL', 'false') === 'true' ? { rejectUnauthorized: false } : false,
      entities: [
        User,
        RoleHierarchyAccess,
        ObservationForm,
        LessonPhase,
        CompetencyDomain,
        Indicator,
        IndicatorScale,
        ObservationSession,
        IndicatorResponse,
        GroupReflectionComment,
        ImprovementPlan,
        ImprovementAction,
        FollowUpActivity,
        Signature,
      ],
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      synchronize: false,
      logging: false,
      connectTimeoutMS: 60000,
      extra: {
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 60000,
      },
    };

    dataSource = new DataSource(dataSourceConfig);
    await dataSource.initialize();

    // Test connection
    const connectionTest = await DatabaseUtils.testConnection(dataSource);
    if (!connectionTest) {
      throw new Error('Database connection test failed');
    }

    // Check migration status
    const migrationStatus = await DatabaseUtils.getMigrationStatus(dataSource);
    console.log(`📊 Found ${migrationStatus.length} executed migrations`);

    // Run migrations
    await DatabaseUtils.runMigrations(dataSource);

    // Get database statistics before seeding
    const statsBefore = await DatabaseUtils.getDatabaseStats(dataSource);
    console.log('📊 Database statistics before seeding:', statsBefore);

    // Run seeds
    console.log('🔄 Running seeds...');
    await runSeeds(dataSource);
    console.log('✅ Seeds completed!');

    // Get database statistics after seeding
    const statsAfter = await DatabaseUtils.getDatabaseStats(dataSource);
    console.log('📊 Database statistics after seeding:', statsAfter);

    // Optimize database
    await DatabaseUtils.optimizeDatabase(dataSource);

    // Display table counts
    const tables = ['users', 'observation_forms', 'lesson_phases', 'indicators', 'role_hierarchy_access'];
    console.log('\n📋 Table row counts:');
    for (const table of tables) {
      const count = await DatabaseUtils.getTableRowCount(dataSource, table);
      console.log(`   ${table}: ${count} rows`);
    }

    await dataSource.destroy();
    console.log('🔌 Database connection closed');

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Start the backend server: npm run start:dev');
    console.log('   2. Access API docs: http://localhost:3000/api/docs');
    console.log('   3. Login with admin/admin123');
    console.log('\n💡 Useful commands:');
    console.log('   - Test connection: npm run db:test');
    console.log('   - Run migrations: npm run migration:run');
    console.log('   - Generate migration: npm run migration:generate -- src/migrations/MigrationName');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    if (dataSource) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

// Load environment variables
require('dotenv').config();

setupDatabase();
