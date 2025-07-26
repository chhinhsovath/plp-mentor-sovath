import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseConfig } from './config/database.config';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ObservationFormsModule } from './observation-forms/observation-forms.module';
import { ObservationSessionsModule } from './observation-sessions/observation-sessions.module';
import { ImprovementPlansModule } from './improvement-plans/improvement-plans.module';
import { SignaturesModule } from './signatures/signatures.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { HierarchyModule } from './hierarchy/hierarchy.module';
import { MissionsModule } from './missions/missions.module';
import { SurveysModule } from './surveys/surveys.module';
import { ObservationKhmerModule } from './modules/observation-khmer/observation-khmer.module';
import { ImpactAssessmentsModule } from './impact-assessments/impact-assessments.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ErrorLoggingInterceptor } from './common/interceptors/error-logging.interceptor';
import { MonitoringService } from './common/services/monitoring.service';

// Security imports
import { SecurityConfig } from './config/security.config';
import { SecurityMiddleware } from './common/middleware/security.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),
    ScheduleModule.forRoot(),
    SharedModule,
    AuthModule,
    UsersModule,
    ObservationFormsModule,
    ObservationSessionsModule,
    ImprovementPlansModule,
    SignaturesModule,
    AnalyticsModule,
    HierarchyModule,
    MissionsModule,
    SurveysModule,
    ObservationKhmerModule,
    ImpactAssessmentsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    MonitoringService,
    SecurityConfig,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorLoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityMiddleware)
      .forRoutes('*');
  }
}
