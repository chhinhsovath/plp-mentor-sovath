import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
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

async function runMigrations() {
  const configService = new ConfigService();
  let dataSource: DataSource | null = null;

  try {
    console.log('🔄 Running database migrations...');

    // Create connection with entities
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
      logging: true,
      connectTimeoutMS: 60000,
      extra: {
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 60000,
      },
    };

    dataSource = new DataSource(dataSourceConfig);
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Check migration status
    const migrationStatus = await DatabaseUtils.getMigrationStatus(dataSource);
    console.log(`📊 Found ${migrationStatus.length} executed migrations`);

    // Run pending migrations
    const pendingMigrations = await dataSource.showMigrations();
    console.log(`📋 Pending migrations: ${pendingMigrations ? 'Yes' : 'No'}`);

    if (pendingMigrations) {
      await dataSource.runMigrations();
      console.log('✅ Migrations completed successfully');
    } else {
      console.log('ℹ️  No pending migrations to run');
    }

    // Show final migration status
    const finalStatus = await DatabaseUtils.getMigrationStatus(dataSource);
    console.log(`📊 Total executed migrations: ${finalStatus.length}`);

    await dataSource.destroy();
    console.log('🔌 Database connection closed');
    console.log('🎉 Migration process completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (dataSource) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

// Load environment variables
require('dotenv').config();

runMigrations();