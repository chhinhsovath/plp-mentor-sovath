import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { AnalyticsModule } from '../src/analytics/analytics.module';
import { AuthModule } from '../src/auth/auth.module';
import { User, UserRole } from '../src/entities/user.entity';
import { ObservationSession, SessionStatus } from '../src/entities/observation-session.entity';
import { ObservationForm } from '../src/entities/observation-form.entity';
import { IndicatorResponse } from '../src/entities/indicator-response.entity';
import { ImprovementPlan, PlanStatus } from '../src/entities/improvement-plan.entity';
import { AuthService } from '../src/auth/auth.service';

describe('Analytics (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let testUser: User;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT) || 5432,
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'password',
          database: process.env.DB_NAME || 'mentoring_test',
          entities: [User, ObservationSession, ObservationForm, IndicatorResponse, ImprovementPlan],
          synchronize: true,
          dropSchema: true,
        }),
        AuthModule,
        AnalyticsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    authService = app.get<AuthService>(AuthService);

    // Create test user
    testUser = await authService.register({
      username: 'analyticstest',
      password: 'Test@123',
      fullName: 'Analytics Test User',
      role: UserRole.PROVINCIAL,
      email: 'analytics@test.com',
      locationScope: 'Phnom Penh',
      phoneNumber: '012345678',
      assignedGrades: ['1', '2', '3'],
      assignedSubjects: ['Khmer', 'Mathematics'],
    });

    // Login to get access token
    const loginResponse = await authService.login({
      username: 'analyticstest',
      password: 'Test@123',
    });
    accessToken = loginResponse.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/analytics/overview (GET)', () => {
    it('should return overview metrics', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/overview')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          totalSessions: expect.any(Number),
          completedSessions: expect.any(Number),
          pendingSessions: expect.any(Number),
          averageScore: expect.any(Number),
          improvementPlansCreated: expect.any(Number),
          activeTeachers: expect.any(Number),
        }),
      );
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/analytics/overview')
        .expect(401);
    });
  });

  describe('/analytics/trends (GET)', () => {
    it('should return performance trends with date filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/trends')
        .query({
          startDate: '2025-01-01',
          endDate: '2025-07-31',
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toEqual(
          expect.objectContaining({
            month: expect.any(String),
            avg_score: expect.any(String),
            session_count: expect.any(String),
          }),
        );
      }
    });

    it('should return trends with subject filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/trends')
        .query({
          subject: 'Khmer',
          startDate: '2025-01-01',
          endDate: '2025-07-31',
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should validate date format', async () => {
      await request(app.getHttpServer())
        .get('/analytics/trends')
        .query({
          startDate: 'invalid-date',
          endDate: '2025-07-31',
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });
  });

  describe('/analytics/subjects (GET)', () => {
    it('should return subject performance data', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/subjects')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toEqual(
          expect.objectContaining({
            subject: expect.any(String),
            avg_score: expect.any(String),
            session_count: expect.any(String),
          }),
        );
      }
    });
  });

  describe('/analytics/grades (GET)', () => {
    it('should return grade performance data', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/grades')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toEqual(
          expect.objectContaining({
            grade: expect.any(String),
            avg_score: expect.any(String),
            session_count: expect.any(String),
          }),
        );
      }
    });
  });

  describe('/analytics/improvement-plans (GET)', () => {
    it('should return improvement plan metrics', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/improvement-plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          totalPlans: expect.any(Number),
          completedPlans: expect.any(Number),
          inProgressPlans: expect.any(Number),
          overdueActivities: expect.any(Number),
        }),
      );
    });
  });

  describe('/analytics/teachers/rankings (GET)', () => {
    it('should return teacher rankings with default limit', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/teachers/rankings')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/teachers/rankings')
        .query({ limit: 5 })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(5);
    });

    it('should validate limit parameter', async () => {
      await request(app.getHttpServer())
        .get('/analytics/teachers/rankings')
        .query({ limit: -1 })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });
  });

  describe('/analytics/schools/comparison (GET)', () => {
    it('should return school comparison data', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/schools/comparison')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toEqual(
          expect.objectContaining({
            school_name: expect.any(String),
            avg_score: expect.any(String),
            session_count: expect.any(String),
          }),
        );
      }
    });
  });

  describe('/analytics/dashboard (GET)', () => {
    it('should return comprehensive dashboard data', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/dashboard')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          overview: expect.any(Object),
          trends: expect.any(Array),
          recentSessions: expect.any(Array),
          upcomingActivities: expect.any(Array),
        }),
      );
    });
  });

  describe('/analytics/realtime (GET)', () => {
    it('should return realtime updates', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/realtime')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          lastUpdated: expect.any(String),
          newSessions: expect.any(Number),
          completedToday: expect.any(Number),
          overdueActivities: expect.any(Number),
        }),
      );
    });
  });

  describe('/analytics/export (POST)', () => {
    it('should export data in CSV format', async () => {
      const response = await request(app.getHttpServer())
        .post('/analytics/export')
        .send({
          format: 'csv',
          startDate: '2025-01-01',
          endDate: '2025-07-31',
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
    });

    it('should export data in Excel format', async () => {
      const response = await request(app.getHttpServer())
        .post('/analytics/export')
        .send({
          format: 'excel',
          startDate: '2025-01-01',
          endDate: '2025-07-31',
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('application/vnd.openxmlformats');
    });

    it('should export data in PDF format', async () => {
      const response = await request(app.getHttpServer())
        .post('/analytics/export')
        .send({
          format: 'pdf',
          startDate: '2025-01-01',
          endDate: '2025-07-31',
          includeCharts: true,
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('application/pdf');
    });

    it('should validate export format', async () => {
      await request(app.getHttpServer())
        .post('/analytics/export')
        .send({
          format: 'invalid',
          startDate: '2025-01-01',
          endDate: '2025-07-31',
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('should validate date range', async () => {
      await request(app.getHttpServer())
        .post('/analytics/export')
        .send({
          format: 'csv',
          startDate: '2025-07-31',
          endDate: '2025-01-01', // End date before start date
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });
  });

  describe('Role-based access control', () => {
    let teacherUser: User;
    let teacherToken: string;

    beforeAll(async () => {
      // Create teacher user with limited scope
      teacherUser = await authService.register({
        username: 'teacheranalytics',
        password: 'Test@123',
        fullName: 'Teacher Analytics User',
        role: UserRole.TEACHER,
        email: 'teacher.analytics@test.com',
        locationScope: 'Phnom Penh - School A',
        phoneNumber: '012345679',
        assignedGrades: ['1'],
        assignedSubjects: ['Khmer'],
      });

      const loginResponse = await authService.login({
        username: 'teacheranalytics',
        password: 'Test@123',
      });
      teacherToken = loginResponse.access_token;
    });

    it('should return limited data for teacher role', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/overview')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      // Teacher should see limited metrics compared to provincial user
      expect(response.body).toEqual(
        expect.objectContaining({
          totalSessions: expect.any(Number),
          completedSessions: expect.any(Number),
          pendingSessions: expect.any(Number),
          averageScore: expect.any(Number),
        }),
      );
    });

    it('should filter teacher rankings based on user scope', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/teachers/rankings')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Teacher should only see their own data or limited scope
    });
  });
});