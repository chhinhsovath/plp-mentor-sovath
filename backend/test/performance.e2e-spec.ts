import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObservationSession } from '../src/entities/observation-session.entity';
import { ObservationForm } from '../src/entities/observation-form.entity';
import { User } from '../src/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { performance } from 'perf_hooks';

describe('Performance Tests (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let sessionRepository: Repository<ObservationSession>;
  let formRepository: Repository<ObservationForm>;
  let userRepository: Repository<User>;
  let adminToken: string;
  let adminUser: User;
  let observationForm: ObservationForm;
  
  // Test data
  const testSessions: string[] = [];
  const batchSize = 10; // Number of sessions to create per batch
  const maxBatches = 5; // Maximum number of batches to test
  const maxResponseTime = 1000; // Maximum acceptable response time in ms

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
    formRepository = app.get<Repository<ObservationForm>>(
      getRepositoryToken(ObservationForm),
    );
    userRepository = app.get<Repository<User>>(
      getRepositoryToken(User),
    );

    // Create test admin user
    adminUser = await userRepository.save({
      username: `admin_perf_${Date.now()}`,
      email: `admin_perf_${Date.now()}@example.com`,
      fullName: 'Admin Performance User',
      password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // 'password'
      role: 'ADMIN',
      locationScope: 'NATIONAL',
      isActive: true,
    });

    // Generate JWT token
    adminToken = jwtService.sign({ 
      sub: adminUser.id, 
      username: adminUser.username,
      role: adminUser.role,
      locationScope: adminUser.locationScope
    });

    // Create test observation form
    observationForm = await formRepository.save({
      formCode: 'PERF-TEST',
      title: 'Performance Test Form',
      subject: 'Performance',
      gradeRange: '1-6',
      isActive: true,
      lessonPhases: [
        {
          name: 'Performance Phase',
          order: 1,
          indicators: [
            {
              code: 'P1.1',
              description: 'Performance Indicator 1',
              rubricType: 'scale',
              order: 1,
              scaleOptions: [
                { value: 1, label: 'Low' },
                { value: 2, label: 'Medium' },
                { value: 3, label: 'High' },
              ],
            },
            {
              code: 'P1.2',
              description: 'Performance Indicator 2',
              rubricType: 'scale',
              order: 2,
              scaleOptions: [
                { value: 1, label: 'Low' },
                { value: 2, label: 'Medium' },
                { value: 3, label: 'High' },
              ],
            },
          ],
        },
      ],
    });
  });

  afterAll(async () => {
    // Clean up test data
    for (const sessionId of testSessions) {
      await sessionRepository.delete({ id: sessionId });
    }
    
    await formRepository.delete({ id: observationForm.id });
    await userRepository.delete({ id: adminUser.id });
    
    await app.close();
  });

  describe('Session Creation Performance', () => {
    it('should maintain performance when creating multiple sessions in sequence', async () => {
      const responseTimes: number[] = [];
      
      // Create sessions in batches
      for (let batch = 0; batch < maxBatches; batch++) {
        console.log(`Creating batch ${batch + 1} of ${maxBatches} (${batchSize} sessions per batch)`);
        
        for (let i = 0; i < batchSize; i++) {
          const startTime = performance.now();
          
          const response = await request(app.getHttpServer())
            .post('/observation-sessions')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              formId: observationForm.id,
              schoolName: `Performance Test School ${batch * batchSize + i}`,
              teacherName: `Performance Test Teacher ${batch * batchSize + i}`,
              observerName: `Performance Test Observer ${batch * batchSize + i}`,
              subject: 'Performance',
              grade: '1',
              dateObserved: new Date().toISOString().split('T')[0],
              startTime: '09:00',
              endTime: '10:00',
            });
          
          const endTime = performance.now();
          const responseTime = endTime - startTime;
          
          expect(response.status).toBe(201);
          expect(response.body.id).toBeDefined();
          
          testSessions.push(response.body.id);
          responseTimes.push(responseTime);
          
          // Check if response time is within acceptable limits
          expect(responseTime).toBeLessThan(maxResponseTime);
        }
        
        // Calculate and log statistics for this batch
        const batchResponseTimes = responseTimes.slice(-batchSize);
        const avgResponseTime = batchResponseTimes.reduce((sum, time) => sum + time, 0) / batchSize;
        const maxBatchResponseTime = Math.max(...batchResponseTimes);
        
        console.log(`Batch ${batch + 1} stats: Avg response time: ${avgResponseTime.toFixed(2)}ms, Max: ${maxBatchResponseTime.toFixed(2)}ms`);
        
        // Verify performance doesn't degrade significantly as data grows
        if (batch > 0) {
          const prevBatchAvg = responseTimes.slice(-2 * batchSize, -batchSize).reduce((sum, time) => sum + time, 0) / batchSize;
          const degradationFactor = avgResponseTime / prevBatchAvg;
          
          console.log(`Performance change factor: ${degradationFactor.toFixed(2)}x compared to previous batch`);
          
          // Performance should not degrade by more than 50% per batch
          expect(degradationFactor).toBeLessThan(1.5);
        }
      }
      
      // Calculate overall statistics
      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      const maxResponseTimeRecorded = Math.max(...responseTimes);
      const minResponseTimeRecorded = Math.min(...responseTimes);
      
      console.log(`Overall stats: Avg response time: ${avgResponseTime.toFixed(2)}ms, Min: ${minResponseTimeRecorded.toFixed(2)}ms, Max: ${maxResponseTimeRecorded.toFixed(2)}ms`);
    });
  });

  describe('Query Performance', () => {
    it('should maintain performance when querying sessions with filters', async () => {
      // Create a large number of sessions first if not enough exist
      if (testSessions.length < 20) {
        const sessionsToCreate = 20 - testSessions.length;
        
        for (let i = 0; i < sessionsToCreate; i++) {
          const response = await request(app.getHttpServer())
            .post('/observation-sessions')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              formId: observationForm.id,
              schoolName: `Query Test School ${i}`,
              teacherName: `Query Test Teacher ${i}`,
              observerName: `Query Test Observer ${i}`,
              subject: 'Performance',
              grade: (i % 6 + 1).toString(), // Distribute across grades 1-6
              dateObserved: new Date().toISOString().split('T')[0],
              startTime: '09:00',
              endTime: '10:00',
            });
          
          testSessions.push(response.body.id);
        }
      }
      
      // Test query performance with different filters
      const queryTests = [
        { name: 'No filters', query: '' },
        { name: 'Filter by subject', query: 'subject=Performance' },
        { name: 'Filter by grade', query: 'grade=1' },
        { name: 'Filter by date range', query: `startDate=${new Date().toISOString().split('T')[0]}&endDate=${new Date(Date.now() + 86400000).toISOString().split('T')[0]}` },
        { name: 'Multiple filters', query: 'subject=Performance&grade=1&status=DRAFT' },
      ];
      
      for (const test of queryTests) {
        const startTime = performance.now();
        
        const response = await request(app.getHttpServer())
          .get(`/observation-sessions?${test.query}`)
          .set('Authorization', `Bearer ${adminToken}`);
        
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
        
        console.log(`Query test "${test.name}": Response time: ${responseTime.toFixed(2)}ms, Results: ${response.body.length}`);
        
        // Check if response time is within acceptable limits
        expect(responseTime).toBeLessThan(maxResponseTime);
      }
    });
  });

  describe('Analytics Performance', () => {
    it('should handle analytics calculations efficiently', async () => {
      // Add indicator responses to sessions for analytics
      for (let i = 0; i < Math.min(testSessions.length, 10); i++) {
        await request(app.getHttpServer())
          .post(`/observation-sessions/${testSessions[i]}/indicator-responses`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send([
            {
              indicatorId: observationForm.lessonPhases[0].indicators[0].id,
              selectedScore: Math.floor(Math.random() * 3) + 1, // Random score 1-3
              notes: 'Performance test note',
            },
            {
              indicatorId: observationForm.lessonPhases[0].indicators[1].id,
              selectedScore: Math.floor(Math.random() * 3) + 1, // Random score 1-3
              notes: 'Performance test note',
            },
          ]);
      }
      
      // Test analytics endpoints
      const analyticsTests = [
        { name: 'Observation Metrics', endpoint: '/analytics/observation-metrics' },
        { name: 'Indicator Performance', endpoint: '/analytics/indicator-performance' },
        { name: 'Performance Trends', endpoint: '/analytics/performance-trends' },
        { name: 'School Comparison', endpoint: '/analytics/school-comparison' },
      ];
      
      for (const test of analyticsTests) {
        const startTime = performance.now();
        
        const response = await request(app.getHttpServer())
          .get(test.endpoint)
          .set('Authorization', `Bearer ${adminToken}`)
          .query({
            startDate: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0], // 30 days ago
            endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0], // 30 days from now
          });
        
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        expect(response.status).toBe(200);
        
        console.log(`Analytics test "${test.name}": Response time: ${responseTime.toFixed(2)}ms`);
        
        // Analytics endpoints may be more complex, so allow higher response time
        expect(responseTime).toBeLessThan(maxResponseTime * 2);
      }
    });
  });

  describe('Concurrent Request Performance', () => {
    it('should handle multiple concurrent requests efficiently', async () => {
      const concurrentRequests = 10;
      const startTime = performance.now();
      
      // Make multiple requests in parallel
      const promises = Array(concurrentRequests).fill(0).map((_, i) => {
        return request(app.getHttpServer())
          .get('/observation-sessions')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ page: i % 3 + 1, limit: 10 });
      });
      
      const responses = await Promise.all(promises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
      });
      
      console.log(`Concurrent requests (${concurrentRequests}): Total time: ${totalTime.toFixed(2)}ms, Avg per request: ${(totalTime / concurrentRequests).toFixed(2)}ms`);
      
      // Average time per request should be reasonable
      expect(totalTime / concurrentRequests).toBeLessThan(maxResponseTime);
    });
  });

  describe('Memory Usage', () => {
    it('should not have memory leaks during repeated operations', async () => {
      // This is a basic test to ensure repeated operations don't cause obvious memory issues
      // For more comprehensive memory testing, use tools like clinic.js
      
      const iterations = 5;
      const operationsPerIteration = 10;
      
      for (let i = 0; i < iterations; i++) {
        console.log(`Memory test iteration ${i + 1}/${iterations}`);
        
        // Perform a series of operations
        for (let j = 0; j < operationsPerIteration; j++) {
          // Create a session
          const createResponse = await request(app.getHttpServer())
            .post('/observation-sessions')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              formId: observationForm.id,
              schoolName: `Memory Test School ${i}-${j}`,
              teacherName: `Memory Test Teacher ${i}-${j}`,
              observerName: `Memory Test Observer ${i}-${j}`,
              subject: 'Performance',
              grade: '1',
              dateObserved: new Date().toISOString().split('T')[0],
              startTime: '09:00',
              endTime: '10:00',
            });
          
          const sessionId = createResponse.body.id;
          testSessions.push(sessionId);
          
          // Add indicator responses
          await request(app.getHttpServer())
            .post(`/observation-sessions/${sessionId}/indicator-responses`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send([
              {
                indicatorId: observationForm.lessonPhases[0].indicators[0].id,
                selectedScore: 2,
                notes: 'Memory test note',
              },
            ]);
          
          // Query the session
          await request(app.getHttpServer())
            .get(`/observation-sessions/${sessionId}`)
            .set('Authorization', `Bearer ${adminToken}`);
          
          // Update the session
          await request(app.getHttpServer())
            .patch(`/observation-sessions/${sessionId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              reflectionSummary: `Memory test reflection ${i}-${j}`,
            });
        }
        
        // Force garbage collection if possible (Node.js with --expose-gc flag)
        if (global.gc) {
          global.gc();
        }
        
        // Check memory usage
        const memoryUsage = process.memoryUsage();
        console.log(`Memory usage: RSS: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB, Heap: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB / ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
      }
      
      // No specific assertion here, as memory usage depends on the environment
      // This test is mainly for logging memory usage patterns
    });
  });

  describe('Database Query Performance', () => {
    it('should execute complex queries efficiently', async () => {
      // Test a complex analytics query
      const startTime = performance.now();
      
      const response = await request(app.getHttpServer())
        .get('/analytics/observation-metrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: new Date(Date.now() - 365 * 86400000).toISOString().split('T')[0], // 1 year ago
          endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0], // 30 days from now
          subject: 'Performance',
          grade: '1',
          groupBy: 'school',
        });
      
      const endTime = performance.now();
      const queryTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      
      console.log(`Complex query execution time: ${queryTime.toFixed(2)}ms`);
      
      // Complex queries may take longer
      expect(queryTime).toBeLessThan(maxResponseTime * 3);
    });
  });
});