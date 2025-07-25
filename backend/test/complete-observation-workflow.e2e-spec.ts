import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObservationSession } from '../src/entities/observation-session.entity';
import { ObservationForm } from '../src/entities/observation-form.entity';
import { User } from '../src/entities/user.entity';
import { IndicatorResponse } from '../src/entities/indicator-response.entity';
import { ImprovementPlan } from '../src/entities/improvement-plan.entity';
import { Signature } from '../src/entities/signature.entity';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';

describe('Complete Observation Workflow (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let sessionRepository: Repository<ObservationSession>;
  let formRepository: Repository<ObservationForm>;
  let userRepository: Repository<User>;
  let indicatorResponseRepository: Repository<IndicatorResponse>;
  let improvementPlanRepository: Repository<ImprovementPlan>;
  let signatureRepository: Repository<Signature>;
  
  let adminToken: string;
  let teacherToken: string;
  let adminUser: User;
  let teacherUser: User;
  let observationForm: ObservationForm;
  
  // Test data
  let sessionId: string;
  let improvementPlanId: string;

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
    indicatorResponseRepository = app.get<Repository<IndicatorResponse>>(
      getRepositoryToken(IndicatorResponse),
    );
    improvementPlanRepository = app.get<Repository<ImprovementPlan>>(
      getRepositoryToken(ImprovementPlan),
    );
    signatureRepository = app.get<Repository<Signature>>(
      getRepositoryToken(Signature),
    );

    // Create test users
    adminUser = await userRepository.save({
      username: `admin_workflow_${Date.now()}`,
      email: `admin_workflow_${Date.now()}@example.com`,
      fullName: 'Admin Workflow User',
      password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // 'password'
      role: 'ADMIN',
      locationScope: 'NATIONAL',
      isActive: true,
    });

    teacherUser = await userRepository.save({
      username: `teacher_workflow_${Date.now()}`,
      email: `teacher_workflow_${Date.now()}@example.com`,
      fullName: 'Teacher Workflow User',
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

    // Create test observation form
    observationForm = await formRepository.save({
      formCode: 'G1-KH-TEST',
      title: 'Grade 1 Khmer Test Form',
      subject: 'Khmer',
      gradeRange: '1',
      isActive: true,
      lessonPhases: [
        {
          name: 'Introduction',
          order: 1,
          indicators: [
            {
              code: 'I1.1',
              description: 'Teacher greets students appropriately',
              rubricType: 'scale',
              order: 1,
              scaleOptions: [
                { value: 1, label: 'Needs Improvement' },
                { value: 2, label: 'Satisfactory' },
                { value: 3, label: 'Excellent' },
              ],
            },
            {
              code: 'I1.2',
              description: 'Teacher reviews previous lesson',
              rubricType: 'scale',
              order: 2,
              scaleOptions: [
                { value: 1, label: 'Needs Improvement' },
                { value: 2, label: 'Satisfactory' },
                { value: 3, label: 'Excellent' },
              ],
            },
          ],
        },
        {
          name: 'Main Activity',
          order: 2,
          indicators: [
            {
              code: 'I2.1',
              description: 'Teacher explains new concepts clearly',
              rubricType: 'scale',
              order: 1,
              scaleOptions: [
                { value: 1, label: 'Needs Improvement' },
                { value: 2, label: 'Satisfactory' },
                { value: 3, label: 'Excellent' },
              ],
            },
            {
              code: 'I2.2',
              description: 'Teacher uses appropriate teaching materials',
              rubricType: 'scale',
              order: 2,
              scaleOptions: [
                { value: 1, label: 'Needs Improvement' },
                { value: 2, label: 'Satisfactory' },
                { value: 3, label: 'Excellent' },
              ],
            },
          ],
        },
        {
          name: 'Conclusion',
          order: 3,
          indicators: [
            {
              code: 'I3.1',
              description: 'Teacher summarizes key points',
              rubricType: 'scale',
              order: 1,
              scaleOptions: [
                { value: 1, label: 'Needs Improvement' },
                { value: 2, label: 'Satisfactory' },
                { value: 3, label: 'Excellent' },
              ],
            },
            {
              code: 'I3.2',
              description: 'Teacher assigns appropriate homework',
              rubricType: 'checkbox',
              order: 2,
            },
          ],
        },
      ],
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (sessionId) {
      await indicatorResponseRepository.delete({ sessionId });
      await signatureRepository.delete({ sessionId });
      
      if (improvementPlanId) {
        await improvementPlanRepository.delete({ id: improvementPlanId });
      }
      
      await sessionRepository.delete({ id: sessionId });
    }
    
    await formRepository.delete({ id: observationForm.id });
    await userRepository.delete({ id: adminUser.id });
    await userRepository.delete({ id: teacherUser.id });
    
    await app.close();
  });

  it('should complete the entire observation workflow', async () => {
    // Step 1: Login as admin
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: adminUser.username,
        password: 'password',
      })
      .expect(200);

    expect(loginResponse.body.access_token).toBeDefined();
    const token = loginResponse.body.access_token;

    // Step 2: Get available observation forms
    const formsResponse = await request(app.getHttpServer())
      .get('/observation-forms')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(formsResponse.body).toBeDefined();
    expect(Array.isArray(formsResponse.body)).toBeTruthy();
    expect(formsResponse.body.length).toBeGreaterThan(0);

    // Step 3: Create a new observation session
    const createSessionResponse = await request(app.getHttpServer())
      .post('/observation-sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        formId: observationForm.id,
        schoolName: 'Workflow Test School',
        teacherName: 'Workflow Test Teacher',
        observerName: 'Workflow Test Observer',
        subject: 'Khmer',
        grade: '1',
        dateObserved: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '10:00',
      })
      .expect(201);

    expect(createSessionResponse.body).toBeDefined();
    expect(createSessionResponse.body.id).toBeDefined();
    expect(createSessionResponse.body.status).toBe('DRAFT');
    sessionId = createSessionResponse.body.id;

    // Step 4: Update session status to IN_PROGRESS
    await request(app.getHttpServer())
      .patch(`/observation-sessions/${sessionId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'IN_PROGRESS',
      })
      .expect(200);

    // Step 5: Add indicator responses
    const indicatorResponses = [
      {
        indicatorId: observationForm.lessonPhases[0].indicators[0].id,
        selectedScore: 2,
        notes: 'Teacher greeted students but could improve enthusiasm',
      },
      {
        indicatorId: observationForm.lessonPhases[0].indicators[1].id,
        selectedScore: 3,
        notes: 'Excellent review of previous lesson',
      },
      {
        indicatorId: observationForm.lessonPhases[1].indicators[0].id,
        selectedScore: 2,
        notes: 'Clear explanation but some students seemed confused',
      },
      {
        indicatorId: observationForm.lessonPhases[1].indicators[1].id,
        selectedScore: 3,
        notes: 'Very good use of teaching materials',
      },
      {
        indicatorId: observationForm.lessonPhases[2].indicators[0].id,
        selectedScore: 1,
        notes: 'Did not summarize key points effectively',
      },
      {
        indicatorId: observationForm.lessonPhases[2].indicators[1].id,
        selectedValue: true,
        notes: 'Appropriate homework assigned',
      },
    ];

    const addResponsesResponse = await request(app.getHttpServer())
      .post(`/observation-sessions/${sessionId}/indicator-responses`)
      .set('Authorization', `Bearer ${token}`)
      .send(indicatorResponses)
      .expect(201);

    expect(addResponsesResponse.body).toBeDefined();
    expect(Array.isArray(addResponsesResponse.body)).toBeTruthy();
    expect(addResponsesResponse.body.length).toBe(indicatorResponses.length);

    // Step 6: Add reflection comments
    await request(app.getHttpServer())
      .patch(`/observation-sessions/${sessionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        reflectionSummary: 'Overall good lesson with some areas for improvement.',
        strengths: 'Good use of teaching materials and excellent review of previous lesson.',
        challenges: 'Needs to improve on summarizing key points at the end of the lesson.',
        recommendations: 'Practice summarizing techniques and increase student engagement.',
      })
      .expect(200);

    // Step 7: Create improvement plan
    const createPlanResponse = await request(app.getHttpServer())
      .post('/improvement-plans')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sessionId: sessionId,
        goals: 'Improve lesson conclusion and summary techniques',
        timeline: '4 weeks',
        responsibleParty: 'Teacher and mentor',
        actions: [
          {
            description: 'Practice summarizing techniques',
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
            assignedTo: 'Teacher',
          },
          {
            description: 'Observe experienced teacher conducting lesson conclusions',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
            assignedTo: 'Teacher',
          },
        ],
      })
      .expect(201);

    expect(createPlanResponse.body).toBeDefined();
    expect(createPlanResponse.body.id).toBeDefined();
    expect(createPlanResponse.body.sessionId).toBe(sessionId);
    expect(Array.isArray(createPlanResponse.body.actions)).toBeTruthy();
    expect(createPlanResponse.body.actions.length).toBe(2);
    improvementPlanId = createPlanResponse.body.id;

    // Step 8: Add observer signature
    const addObserverSignatureResponse = await request(app.getHttpServer())
      .post('/signatures')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sessionId: sessionId,
        signerRole: 'observer',
        signerName: 'Workflow Test Observer',
        signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAACWCAYAAABkW7XSAAAAAXNSR0IArs4c6QAABGJJREFUeF7t1AEJAAAMAsHZv/RyPNwSyDncOQIECEQEFskpJgECBM5geQICBDICBitTlaAECBgsP0CAQEbAYGWqEpQAAYPlBwgQyAgYrExVghIgYLD8AAECGQGDlalKUAIEDJYfIEAgI2CwMlUJSoCAwfIDBAhkBAxWpipBCRAwWH6AAIGMgMHKVCUoAQIGyw8QIJARMFiZqgQlQMBg+QECBDICBitTlaAECBgsP0CAQEbAYGWqEpQAAYPlBwgQyAgYrExVghIgYLD8AAECGQGDlalKUAIEDJYfIEAgI2CwMlUJSoCAwfIDBAhkBAxWpipBCRAwWH6AAIGMgMHKVCUoAQIGyw8QIJARMFiZqgQlQMBg+QECBDICBitTlaAECBgsP0CAQEbAYGWqEpQAAYPlBwgQyAgYrExVghIgYLD8AAECGQGDlalKUAIEDJYfIEAgI2CwMlUJSoCAwfIDBAhkBAxWpipBCRAwWH6AAIGMgMHKVCUoAQIGyw8QIJARMFiZqgQlQMBg+QECBDICBitTlaAECBgsP0CAQEbAYGWqEpQAAYPlBwgQyAgYrExVghIgYLD8AAECGQGDlalKUAIEDJYfIEAgI2CwMlUJSoCAwfIDBAhkBAxWpipBCRAwWH6AAIGMgMHKVCUoAQIGyw8QIJARMFiZqgQlQMBg+QECBDICBitTlaAECBgsP0CAQEbAYGWqEpQAAYPlBwgQyAgYrExVghIgYLD8AAECGQGDlalKUAIEDJYfIEAgI2CwMlUJSoCAwfIDBAhkBAxWpipBCRAwWH6AAIGMgMHKVCUoAQIGyw8QIJARMFiZqgQlQMBg+QECBDICBitTlaAECBgsP0CAQEbAYGWqEpQAAYPlBwgQyAgYrExVghIgYLD8AAECGQGDlalKUAIEDJYfIEAgI2CwMlUJSoCAwfIDBAhkBAxWpipBCRAwWH6AAIGMgMHKVCUoAQIGyw8QIJARMFiZqgQlQMBg+QECBDICBitTlaAECBgsP0CAQEbAYGWqEpQAAYPlBwgQyAgYrExVghIgYLD8AAECGQGDlalKUAIEDJYfIEAgI2CwMlUJSoCAwfIDBAhkBAxWpipBCRAwWH6AAIGMgMHKVCUoAQIGyw8QIJARMFiZqgQlQMBg+QECBDICBitTlaAECBgsP0CAQEbAYGWqEpQAAYPlBwgQyAgYrExVghIgYLD8AAECGQGDlalKUAIEDJYfIEAgI2CwMlUJSoCAwfIDBAhkBAxWpipBCRAwWH6AAIGMgMHKVCUoAQIGyw8QIJARMFiZqgQlQMBg+QECBDICBitTlaAECBgsP0CAQEbAYGWqEpQAAYPlBwgQyAgYrExVghIgYLD8AAECGQGDlalKUAIEDJYfIEAgI2CwMlUJSoCAwfIDBAhkBAxWpipBCRAwWH6AAIGMgMHKVCUoAQIGyw8QIJARMFiZqgQlQMBg+QECBDICBitTlaAECBgsP0CAQEbAYGWqEpQAgQdWMQCX4yW9owAAAABJRU5ErkJggg==',
      })
      .expect(201);

    expect(addObserverSignatureResponse.body).toBeDefined();
    expect(addObserverSignatureResponse.body.id).toBeDefined();
    expect(addObserverSignatureResponse.body.signerRole).toBe('observer');
    expect(addObserverSignatureResponse.body.isValid).toBe(true);

    // Step 9: Add teacher signature
    const addTeacherSignatureResponse = await request(app.getHttpServer())
      .post('/signatures')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sessionId: sessionId,
        signerRole: 'teacher',
        signerName: 'Workflow Test Teacher',
        signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAACWCAYAAABkW7XSAAAAAXNSR0IArs4c6QAABGJJREFUeF7t1AEJAAAMAsHZv/RyPNwSyDncOQIECEQEFskpJgECBM5geQICBDICBitTlaAECBgsP0CAQEbAYGWqEpQAAYPlBwgQyAgYrExVghIgYLD8AAECGQGDlalKUAIEDJYfIEAgI2CwMlUJSoCAwfIDBAhkBAxWpipBCRAwWH6AAIGMgMHKVCUoAQIGyw8QIJARMFiZqgQlQMBg+QECBDICBitTlaAECBgsP0CAQEbAYGWqEpQAAYPlBwgQyAgYrExVghIgYLD8AAECGQGDlalKUAIEDJYfIEAgI2CwMlUJSoCAwfIDBAhkBAxWpipBCRAwWH6AAIGMgMHKVCUoAQIGyw8QIJARMFiZqgQlQMBg+QECBDICBitTlaAECBgsP0CAQEbAYGWqEpQAAYPlBwgQyAgYrExVghIgYLD8AAECGQGDlalKUAIEDJYfIEAgI2CwMlUJSoCAwfIDBAhkBAxWpipBCRAwWH6AAIGMgMHKVCUoAQIGyw8QIJARMFiZqgQlQMBg+QECBDICBitTlaAECBgsP0CAQEbAYGWqEpQAAYPlBwgQyAgYrExVghIgYLD8AAECGQGDlalKUAIEDJYfIEAgI2CwMlUJSoCAwfIDBAhkBAxWpipBCRAwWH6AAIGMgMHKVCUoAQIGyw8QIJARMFiZqgQlQMBg+QECBDICBitTlaAECBgsP0CAQEbAYGWqEpQAAYPlBwgQyAgYrExVghIgYLD8AAECGQGDlalKUAIEDJYfIEAgI2CwMlUJSoCAwfIDBAhkBAxWpipBCRAwWH6AAIGMgMHKVCUoAQIGyw8QIJARMFiZqgQlQMBg+QECBDICBitTlaAECBgsP0CAQEbAYGWqEpQAAYPlBwgQyAgYrExVghIgYLD8AAECGQGDlalKUAIEDJYfIEAgI2CwMlUJSoCAwfIDBAhkBAxWpipBCRAwWH6AAIGMgMHKVCUoAQIGyw8QIJARMFiZqgQlQMBg+QECBDICBitTlaAECBgsP0CAQEbAYGWqEpQAAYPlBwgQyAgYrExVghIgYLD8AAECGQGDlalKUAIEDJYfIEAgI2CwMlUJSoCAwfIDBAhkBAxWpipBCRAwWH6AAIGMgMHKVCUoAQIGyw8QIJARMFiZqgQlQMBg+QECBDICBitTlaAECBgsP0CAQEbAYGWqEpQAAYPlBwgQyAgYrExVghIgYLD8AAECGQGDlalKUAIEDJYfIEAgI2CwMlUJSoCAwfIDBAhkBAxWpipBCRAwWH6AAIGMgMHKVCUoAQIGyw8QIJARMFiZqgQlQMBg+QECBDICBitTlaAECBgsP0CAQEbAYGWqEpQAAYPlBwgQyAgYrExVghIgYLD8AAECGQGDlalKUAIEDJYfIEAgI2CwMlUJSoCAwfIDBAhkBAxWpipBCRAwWH6AAIGMgMHKVCUoAQIGyw8QIJARMFiZqgQlQMBg+QECBDICBitTlaAECBgsP0CAQEbAYGWqEpQAgQdWMQCX4yW9owAAAABJRU5ErkJggg==',
      })
      .expect(201);

    expect(addTeacherSignatureResponse.body).toBeDefined();
    expect(addTeacherSignatureResponse.body.id).toBeDefined();
    expect(addTeacherSignatureResponse.body.signerRole).toBe('teacher');
    expect(addTeacherSignatureResponse.body.isValid).toBe(true);

    // Step 10: Complete the session
    await request(app.getHttpServer())
      .patch(`/observation-sessions/${sessionId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'COMPLETED',
      })
      .expect(200);

    // Step 11: Verify session is completed
    const getSessionResponse = await request(app.getHttpServer())
      .get(`/observation-sessions/${sessionId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(getSessionResponse.body).toBeDefined();
    expect(getSessionResponse.body.id).toBe(sessionId);
    expect(getSessionResponse.body.status).toBe('COMPLETED');

    // Step 12: Update improvement plan action status
    const improvementPlanActions = createPlanResponse.body.actions;
    await request(app.getHttpServer())
      .patch(`/improvement-plans/${improvementPlanId}/actions/${improvementPlanActions[0].id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'IN_PROGRESS',
        notes: 'Started practicing summarizing techniques',
      })
      .expect(200);

    // Step 13: Generate analytics report
    const analyticsResponse = await request(app.getHttpServer())
      .get('/analytics/observation-metrics')
      .set('Authorization', `Bearer ${token}`)
      .query({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        subject: 'Khmer',
        grade: '1',
      })
      .expect(200);

    expect(analyticsResponse.body).toBeDefined();
    expect(analyticsResponse.body.totalObservations).toBeGreaterThanOrEqual(1);

    // Step 14: Export session data
    const exportResponse = await request(app.getHttpServer())
      .get(`/analytics/export-session/${sessionId}`)
      .set('Authorization', `Bearer ${token}`)
      .query({ format: 'json' })
      .expect(200);

    expect(exportResponse.body).toBeDefined();
    expect(exportResponse.body.id).toBe(sessionId);
    expect(exportResponse.body.schoolName).toBe('Workflow Test School');
    expect(exportResponse.body.teacherName).toBe('Workflow Test Teacher');
    expect(exportResponse.body.subject).toBe('Khmer');
    expect(exportResponse.body.grade).toBe('1');
    expect(exportResponse.body.status).toBe('COMPLETED');
    expect(exportResponse.body.indicatorResponses).toBeDefined();
    expect(Array.isArray(exportResponse.body.indicatorResponses)).toBeTruthy();
    expect(exportResponse.body.indicatorResponses.length).toBeGreaterThanOrEqual(6);
    expect(exportResponse.body.signatures).toBeDefined();
    expect(Array.isArray(exportResponse.body.signatures)).toBeTruthy();
    expect(exportResponse.body.signatures.length).toBe(2);
    expect(exportResponse.body.improvementPlan).toBeDefined();
    expect(exportResponse.body.improvementPlan.id).toBe(improvementPlanId);
  });
});