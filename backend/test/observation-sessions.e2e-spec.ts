import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObservationSession } from '../src/entities/observation-session.entity';
import { User } from '../src/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

describe('ObservationSessionsController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let sessionRepository: Repository<ObservationSession>;
  let userRepository: Repository<User>;
  let adminToken: string;
  let teacherToken: string;
  let adminUser: User;
  let teacherUser: User;
  let testSessionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    jwtService = app.get<JwtService>(JwtService);
    sessionRepository = app.get<Repository<ObservationSession>>(
      getRepositoryToken(ObservationSession),
    );
    userRepository = app.get<Repository<User>>(getRepositoryToken(User));

    // Create test users
    adminUser = await userRepository.save({
      username: `admin_${Date.now()}`,
      email: `admin_${Date.now()}@example.com`,
      fullName: 'Admin User',
      password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // 'password'
      role: 'ADMIN',
      locationScope: 'NATIONAL',
      isActive: true,
    });

    teacherUser = await userRepository.save({
      username: `teacher_${Date.now()}`,
      email: `teacher_${Date.now()}@example.com`,
      fullName: 'Teacher User',
      password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // 'password'
      role: 'TEACHER',
      locationScope: 'SCHOOL',
      isActive: true,
    });

    // Generate JWT tokens
    adminToken = jwtService.sign({ 
      sub: adminUser.id, 
      username: adminUser.username,
      role: adminUser.role,
      locationScope: adminUser.locationScope
    });
    
    teacherToken = jwtService.sign({ 
      sub: teacherUser.id, 
      username: teacherUser.username,
      role: teacherUser.role,
      locationScope: teacherUser.locationScope
    });

    // Create a test session
    const testSession = await sessionRepository.save({
      schoolName: 'Test School',
      teacherName: 'Test Teacher',
      observerName: 'Test Observer',
      subject: 'Khmer',
      grade: '1',
      dateObserved: new Date(),
      startTime: '09:00',
      endTime: '10:00',
      status: 'DRAFT',
      createdBy: adminUser.id,
    });
    
    testSessionId = testSession.id;
  });

  afterAll(async () => {
    // Clean up test data
    await sessionRepository.delete({ id: testSessionId });
    await userRepository.delete({ id: adminUser.id });
    await userRepository.delete({ id: teacherUser.id });
    await app.close();
  });

  describe('GET /observation-sessions', () => {
    it('should return 401 if not authenticated', () => {
      return request(app.getHttpServer())
        .get('/observation-sessions')
        .expect(401);
    });

    it('should return sessions for admin user', () => {
      return request(app.getHttpServer())
        .get('/observation-sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .then(response => {
          expect(response.body).toBeDefined();
          expect(Array.isArray(response.body)).toBeTruthy();
        });
    });

    it('should filter sessions by query parameters', () => {
      return request(app.getHttpServer())
        .get('/observation-sessions?subject=Khmer&grade=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .then(response => {
          expect(response.body).toBeDefined();
          expect(Array.isArray(response.body)).toBeTruthy();
          response.body.forEach(session => {
            expect(session.subject).toBe('Khmer');
            expect(session.grade).toBe('1');
          });
        });
    });
  });

  describe('GET /observation-sessions/:id', () => {
    it('should return 401 if not authenticated', () => {
      return request(app.getHttpServer())
        .get(`/observation-sessions/${testSessionId}`)
        .expect(401);
    });

    it('should return 404 for non-existent session', () => {
      const nonExistentId = uuidv4();
      return request(app.getHttpServer())
        .get(`/observation-sessions/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return session by id for admin user', () => {
      return request(app.getHttpServer())
        .get(`/observation-sessions/${testSessionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .then(response => {
          expect(response.body).toBeDefined();
          expect(response.body.id).toBe(testSessionId);
          expect(response.body.schoolName).toBe('Test School');
          expect(response.body.subject).toBe('Khmer');
          expect(response.body.grade).toBe('1');
        });
    });
  });

  describe('POST /observation-sessions', () => {
    it('should return 401 if not authenticated', () => {
      return request(app.getHttpServer())
        .post('/observation-sessions')
        .send({
          schoolName: 'New School',
          teacherName: 'New Teacher',
          observerName: 'New Observer',
          subject: 'Math',
          grade: '2',
          dateObserved: new Date().toISOString().split('T')[0],
          startTime: '10:00',
          endTime: '11:00',
        })
        .expect(401);
    });

    it('should create a new session for admin user', () => {
      return request(app.getHttpServer())
        .post('/observation-sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schoolName: 'New School',
          teacherName: 'New Teacher',
          observerName: 'New Observer',
          subject: 'Math',
          grade: '2',
          dateObserved: new Date().toISOString().split('T')[0],
          startTime: '10:00',
          endTime: '11:00',
        })
        .expect(201)
        .then(response => {
          expect(response.body).toBeDefined();
          expect(response.body.id).toBeDefined();
          expect(response.body.schoolName).toBe('New School');
          expect(response.body.subject).toBe('Math');
          expect(response.body.grade).toBe('2');
          expect(response.body.status).toBe('DRAFT');
          
          // Clean up created session
          return sessionRepository.delete({ id: response.body.id });
        });
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/observation-sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          // Missing required fields
          subject: 'Math',
          grade: '2',
        })
        .expect(400)
        .then(response => {
          expect(response.body).toBeDefined();
          expect(response.body.message).toBeInstanceOf(Array);
          expect(response.body.message.length).toBeGreaterThan(0);
        });
    });
  });

  describe('PATCH /observation-sessions/:id', () => {
    it('should return 401 if not authenticated', () => {
      return request(app.getHttpServer())
        .patch(`/observation-sessions/${testSessionId}`)
        .send({
          schoolName: 'Updated School',
        })
        .expect(401);
    });

    it('should update session for admin user', () => {
      return request(app.getHttpServer())
        .patch(`/observation-sessions/${testSessionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schoolName: 'Updated School',
          teacherName: 'Updated Teacher',
        })
        .expect(200)
        .then(response => {
          expect(response.body).toBeDefined();
          expect(response.body.id).toBe(testSessionId);
          expect(response.body.schoolName).toBe('Updated School');
          expect(response.body.teacherName).toBe('Updated Teacher');
        });
    });

    it('should return 404 for non-existent session', () => {
      const nonExistentId = uuidv4();
      return request(app.getHttpServer())
        .patch(`/observation-sessions/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schoolName: 'Updated School',
        })
        .expect(404);
    });

    it('should enforce role-based permissions', () => {
      // Teacher should not be able to update sessions they don't own
      return request(app.getHttpServer())
        .patch(`/observation-sessions/${testSessionId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          schoolName: 'Teacher Updated School',
        })
        .expect(403);
    });
  });

  describe('DELETE /observation-sessions/:id', () => {
    let tempSessionId: string;

    beforeEach(async () => {
      // Create a temporary session for delete tests
      const tempSession = await sessionRepository.save({
        schoolName: 'Temp School',
        teacherName: 'Temp Teacher',
        observerName: 'Temp Observer',
        subject: 'Science',
        grade: '3',
        dateObserved: new Date(),
        startTime: '13:00',
        endTime: '14:00',
        status: 'DRAFT',
        createdBy: adminUser.id,
      });
      
      tempSessionId = tempSession.id;
    });

    it('should return 401 if not authenticated', () => {
      return request(app.getHttpServer())
        .delete(`/observation-sessions/${tempSessionId}`)
        .expect(401);
    });

    it('should delete session for admin user', () => {
      return request(app.getHttpServer())
        .delete(`/observation-sessions/${tempSessionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .then(async () => {
          // Verify session is deleted
          const deletedSession = await sessionRepository.findOne({ where: { id: tempSessionId } });
          expect(deletedSession).toBeNull();
        });
    });

    it('should return 404 for non-existent session', () => {
      const nonExistentId = uuidv4();
      return request(app.getHttpServer())
        .delete(`/observation-sessions/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should enforce role-based permissions', async () => {
      // Create another temp session
      const anotherTempSession = await sessionRepository.save({
        schoolName: 'Another Temp School',
        teacherName: 'Another Temp Teacher',
        observerName: 'Another Temp Observer',
        subject: 'Science',
        grade: '3',
        dateObserved: new Date(),
        startTime: '13:00',
        endTime: '14:00',
        status: 'DRAFT',
        createdBy: adminUser.id,
      });
      
      // Teacher should not be able to delete sessions they don't own
      return request(app.getHttpServer())
        .delete(`/observation-sessions/${anotherTempSession.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403)
        .then(async () => {
          // Clean up
          await sessionRepository.delete({ id: anotherTempSession.id });
        });
    });
  });

  describe('PATCH /observation-sessions/:id/status', () => {
    it('should update session status for admin user', () => {
      return request(app.getHttpServer())
        .patch(`/observation-sessions/${testSessionId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'IN_PROGRESS',
        })
        .expect(200)
        .then(response => {
          expect(response.body).toBeDefined();
          expect(response.body.id).toBe(testSessionId);
          expect(response.body.status).toBe('IN_PROGRESS');
        });
    });

    it('should validate status values', () => {
      return request(app.getHttpServer())
        .patch(`/observation-sessions/${testSessionId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'INVALID_STATUS',
        })
        .expect(400);
    });

    it('should enforce workflow rules', async () => {
      // First set to IN_PROGRESS
      await request(app.getHttpServer())
        .patch(`/observation-sessions/${testSessionId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'IN_PROGRESS',
        })
        .expect(200);
      
      // Then try to set back to DRAFT (which should fail)
      return request(app.getHttpServer())
        .patch(`/observation-sessions/${testSessionId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'DRAFT',
        })
        .expect(400);
    });
  });

  describe('POST /observation-sessions/:id/indicator-responses', () => {
    it('should add indicator responses to a session', () => {
      return request(app.getHttpServer())
        .post(`/observation-sessions/${testSessionId}/indicator-responses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send([
          {
            indicatorId: '1',
            selectedScore: 3,
            notes: 'Excellent performance',
          },
          {
            indicatorId: '2',
            selectedScore: 2,
            notes: 'Good performance',
          },
        ])
        .expect(201)
        .then(response => {
          expect(response.body).toBeDefined();
          expect(Array.isArray(response.body)).toBeTruthy();
          expect(response.body.length).toBe(2);
          expect(response.body[0].indicatorId).toBe('1');
          expect(response.body[0].selectedScore).toBe(3);
          expect(response.body[1].indicatorId).toBe('2');
          expect(response.body[1].selectedScore).toBe(2);
        });
    });

    it('should validate indicator response data', () => {
      return request(app.getHttpServer())
        .post(`/observation-sessions/${testSessionId}/indicator-responses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send([
          {
            // Missing indicatorId
            selectedScore: 3,
          },
        ])
        .expect(400);
    });
  });

  describe('GET /observation-sessions/:id/indicator-responses', () => {
    it('should get indicator responses for a session', () => {
      return request(app.getHttpServer())
        .get(`/observation-sessions/${testSessionId}/indicator-responses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .then(response => {
          expect(response.body).toBeDefined();
          expect(Array.isArray(response.body)).toBeTruthy();
          // Should have the responses we added in the previous test
          expect(response.body.length).toBeGreaterThanOrEqual(2);
        });
    });
  });
});