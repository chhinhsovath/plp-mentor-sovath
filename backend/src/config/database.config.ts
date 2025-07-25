import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
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
  UserSession,
  PasswordResetToken,
  Mission,
  MissionParticipant,
  MissionTracking,
  Survey,
  Question,
  SurveyResponse,
  Answer,
} from '../entities';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const sslEnabled = this.configService.get('DB_SSL', 'false') === 'true';

    return {
      type: 'postgres',
      host: this.configService.get('DB_HOST', 'localhost'),
      port: parseInt(this.configService.get('DB_PORT', '5432')),
      username: this.configService.get('DB_USERNAME', 'postgres'),
      password: this.configService.get('DB_PASSWORD', 'password'),
      database: this.configService.get('DB_NAME', 'mentoring_platform'),
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
        UserSession,
        PasswordResetToken,
        Mission,
        MissionParticipant,
        MissionTracking,
        Survey,
        Question,
        SurveyResponse,
        Answer,
      ],
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      synchronize: this.configService.get('NODE_ENV') === 'development',
      logging: this.configService.get('NODE_ENV') === 'development',
      ssl: sslEnabled ? { rejectUnauthorized: false } : false,
      // Connection pool settings
      extra: {
        max: 20, // maximum number of clients in the pool
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 60000,
      },
    };
  }
}

// Export DataSource for migrations
const config = new DatabaseConfig(new ConfigService());
export default new DataSource(config.createTypeOrmOptions() as DataSourceOptions);
