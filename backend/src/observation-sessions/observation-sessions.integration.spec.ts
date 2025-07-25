import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObservationSessionsModule } from './observation-sessions.module';
import { AuthModule } from '../auth/auth.module';
import { ObservationFormsModule } from '../observation-forms/observation-forms.module';
import { ObservationSessionsService } from './observation-sessions.service';
import { IndicatorResponsesService } from './indicator-responses.service';
import { SessionWorkflowService } from './session-workflow.service';
import { ObservationFormsService } from '../observation-forms/observation-forms.service';
import { AuthService } from '../auth/auth.service';
import { User, UserRole } from '../entities/user.entity';
import { ObservationSession, SessionStatus } from '../entities/observation-session.entity';
import { CreateObservationSessionDto } from './dto/create-observation-session.dto';
import { CreateObservationFormDto } from '../observation-forms/dto/create-observation-form.dto';
import { RubricType } from '../entities/indicator.entity';

describe('ObservationSessions Integration Tests', () => {
  let app: INestApplication;
  let observationSessionsService: ObservationSessionsService;
  let indicatorResponsesService: IndicatorResponsesService;
  let sessionWorkflowService: SessionWorkflowService;
  let observationFormsService: ObservationFormsService;
  let authService: AuthService;
  let testUser: User;
  let testForm: any;
  let testSession: ObservationSession;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          synchronize: true,
        }),
        ObservationSessionsModule,
        AuthModule,
        ObservationFormsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    observationSessionsService = app.get<ObservationSessionsService>(ObservationSessionsService);
    indicatorResponsesService = app.get<IndicatorResponsesService>(IndicatorResponsesService);
    sessionWorkflowService = app.get<SessionWorkflowService>(SessionWorkflowService);
    observationFormsService = app.get<ObservationFormsService>(ObservationFormsService);
    authService = app.get<AuthService>(AuthService);

    // Create test user
    testUser = await authService.register({
      username: 'testteacher',
      password: 'Test@123',
      fullName: 'Test Teacher',
      role: UserRole.TEACHER,
      email: 'teacher@test.com',
      phoneNumber: '012345678',
      assignedGrades: ['1', '2'],
      assignedSubjects: ['Khmer', 'Mathematics'],
    });

    // Create test observation form
    const createFormDto: CreateObservationFormDto = {
      formCode: 'G1-KH-TEST',
      title: 'Test Grade 1 Khmer Form',
      subject: 'Khmer',
      gradeRange: '1',
      lessonPhases: [
        {
          title: 'Introduction Phase',
          sectionOrder: 1,
          indicators: [
            {
              indicatorNumber: '1.1',
              indicatorText: 'Teacher introduces lesson objectives clearly',
              maxScore: 3,
              rubricType: RubricType.SCALE,
              scales: [
                { scaleLabel: '1', scaleDescription: 'Needs improvement' },
                { scaleLabel: '2', scaleDescription: 'Satisfactory' },
                { scaleLabel: '3', scaleDescription: 'Excellent' },
              ],
            },
            {
              indicatorNumber: '1.2',
              indicatorText: 'Students are engaged and attentive',
              maxScore: 1,
              rubricType: RubricType.CHECKBOX,
            },
          ],
        },
        {
          title: 'Main Activity Phase',
          sectionOrder: 2,
          indicators: [
            {
              indicatorNumber: '2.1',
              indicatorText: 'Teaching methods are appropriate for the lesson',
              maxScore: 3,
              rubricType: RubricType.SCALE,
              scales: [
                { scaleLabel: '1', scaleDescription: 'Poor' },
                { scaleLabel: '2', scaleDescription: 'Good' },
                { scaleLabel: '3', scaleDescription: 'Outstanding' },
              ],
            },
          ],
        },
      ],
    };

    testForm = await observationFormsService.create(createFormDto);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    // Clean up created sessions
    if (testSession) {
      try {
        await observationSessionsService.remove(testSession.id, testUser);
      } catch (error) {
        // Session might already be deleted or in a non-deletable state
      }
    }
  });

  describe('Complete Observation Session Workflow', () => {
    it('should complete a full observation session workflow', async () => {
      // Step 1: Create a new observation session
      const createSessionDto: CreateObservationSessionDto = {
        formId: testForm.id,
        schoolName: 'Test Primary School',
        teacherName: 'Ms. Sophea',
        observerName: testUser.fullName,
        subject: 'Khmer',
        grade: '1',
        dateObserved: new Date().toISOString().split('T')[0],
        startTime: '07:30',
        endTime: '08:15',
        classificationLevel: 'Level 2',
      };

      testSession = await observationSessionsService.create(createSessionDto, testUser);

      expect(testSession).toBeDefined();
      expect(testSession.status).toBe(SessionStatus.DRAFT);
      expect(testSession.formId).toBe(testForm.id);

      // Step 2: Check initial workflow state
      let workflowState = await sessionWorkflowService.getWorkflowState(testSession.id, testUser);

      expect(workflowState.currentStatus).toBe(SessionStatus.DRAFT);
      expect(workflowState.canEdit).toBe(true);
      expect(workflowState.canDelete).toBe(true);
      expect(workflowState.availableTransitions).toHaveLength(2); // To IN_PROGRESS and COMPLETED

      // Step 3: Transition to IN_PROGRESS
      testSession = await sessionWorkflowService.transitionStatus(
        testSession.id,
        SessionStatus.IN_PROGRESS,
        testUser,
      );

      expect(testSession.status).toBe(SessionStatus.IN_PROGRESS);

      // Step 4: Add indicator responses
      const indicatorResponses = [
        {
          indicatorId: testForm.lessonPhases[0].indicators[0].id, // Scale indicator 1.1
          selectedScore: 2,
          notes: 'Teacher explained objectives but could be clearer',
        },
        {
          indicatorId: testForm.lessonPhases[0].indicators[1].id, // Checkbox indicator 1.2
          selectedLevel: 'checked',
          selectedScore: 1,
          notes: 'Most students were engaged',
        },
        {
          indicatorId: testForm.lessonPhases[1].indicators[0].id, // Scale indicator 2.1
          selectedScore: 3,
          notes: 'Excellent use of interactive teaching methods',
        },
      ];

      await indicatorResponsesService.createMultiple(testSession.id, indicatorResponses);

      // Step 5: Check progress
      const progress = await indicatorResponsesService.getSessionProgress(testSession.id);

      expect(progress.totalIndicators).toBe(3);
      expect(progress.completedResponses).toBe(3);
      expect(progress.completionPercentage).toBe(100);
      expect(progress.missingIndicators).toHaveLength(0);

      // Step 6: Update session with reflection
      testSession = await observationSessionsService.update(
        testSession.id,
        {
          reflectionSummary: 'Overall, the lesson was well-delivered with good student engagement.',
        },
        testUser,
      );

      // Step 7: Validate session for completion
      const validationResult = await sessionWorkflowService.validateSessionForCompletion(
        testSession.id,
      );

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);

      // Step 8: Get session progress
      const sessionProgress = await sessionWorkflowService.getSessionProgress(testSession.id);

      expect(sessionProgress.progressPercentage).toBe(100);
      expect(sessionProgress.completedSteps).toContain('Basic information completed');
      expect(sessionProgress.completedSteps).toContain('Observation details completed');
      expect(sessionProgress.completedSteps).toContain('All indicators completed');
      expect(sessionProgress.completedSteps).toContain('Reflection summary completed');
      expect(sessionProgress.remainingSteps).toHaveLength(0);
      expect(sessionProgress.canProceedToNext).toBe(true);

      // Step 9: Transition to COMPLETED
      testSession = await sessionWorkflowService.transitionStatus(
        testSession.id,
        SessionStatus.COMPLETED,
        testUser,
      );

      expect(testSession.status).toBe(SessionStatus.COMPLETED);

      // Step 10: Verify final workflow state
      workflowState = await sessionWorkflowService.getWorkflowState(testSession.id, testUser);

      expect(workflowState.currentStatus).toBe(SessionStatus.COMPLETED);
      expect(workflowState.canEdit).toBe(false);
      expect(workflowState.canDelete).toBe(false);
      expect(workflowState.availableTransitions).toHaveLength(0); // Regular users can't approve
    });

    it('should handle auto-save functionality', async () => {
      // Create a draft session
      const createSessionDto: CreateObservationSessionDto = {
        formId: testForm.id,
        schoolName: 'Auto-save Test School',
        teacherName: 'Mr. Dara',
        observerName: testUser.fullName,
        subject: 'Khmer',
        grade: '1',
        dateObserved: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '09:45',
      };

      testSession = await observationSessionsService.create(createSessionDto, testUser);

      // Auto-save partial data
      await observationSessionsService.autoSave(
        testSession.id,
        {
          classificationLevel: 'Level 3',
          reflectionSummary: 'Partial reflection...',
        },
        testUser,
      );

      // Retrieve session to verify auto-saved data
      const updatedSession = await observationSessionsService.findOne(testSession.id, testUser);

      expect(updatedSession.classificationLevel).toBe('Level 3');
      expect(updatedSession.reflectionSummary).toBe('Partial reflection...');
      expect(updatedSession.status).toBe(SessionStatus.DRAFT); // Status should remain DRAFT
    });

    it('should prevent invalid status transitions', async () => {
      // Create and complete a session
      const createSessionDto: CreateObservationSessionDto = {
        formId: testForm.id,
        schoolName: 'Transition Test School',
        teacherName: 'Ms. Sreymom',
        observerName: testUser.fullName,
        subject: 'Khmer',
        grade: '1',
        dateObserved: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '10:45',
        classificationLevel: 'Level 1',
      };

      testSession = await observationSessionsService.create(createSessionDto, testUser);

      // Try to transition directly to APPROVED (should fail)
      await expect(
        sessionWorkflowService.transitionStatus(testSession.id, SessionStatus.APPROVED, testUser),
      ).rejects.toThrow();

      // Try to transition to COMPLETED without completing requirements (should fail)
      await expect(
        sessionWorkflowService.transitionStatus(testSession.id, SessionStatus.COMPLETED, testUser),
      ).rejects.toThrow();
    });

    it('should handle indicator response validation', async () => {
      // Create a session
      const createSessionDto: CreateObservationSessionDto = {
        formId: testForm.id,
        schoolName: 'Validation Test School',
        teacherName: 'Mr. Sokha',
        observerName: testUser.fullName,
        subject: 'Khmer',
        grade: '1',
        dateObserved: new Date().toISOString().split('T')[0],
        startTime: '11:00',
        endTime: '11:45',
      };

      testSession = await observationSessionsService.create(createSessionDto, testUser);

      // Try to add invalid indicator response (score out of range)
      await expect(
        indicatorResponsesService.create(testSession.id, {
          indicatorId: testForm.lessonPhases[0].indicators[0].id,
          selectedScore: 5, // Max score is 3
        }),
      ).rejects.toThrow();

      // Try to add checkbox indicator without level
      await expect(
        indicatorResponsesService.create(testSession.id, {
          indicatorId: testForm.lessonPhases[0].indicators[1].id,
          // Missing selectedLevel for checkbox
        }),
      ).rejects.toThrow();

      // Add valid responses
      await indicatorResponsesService.create(testSession.id, {
        indicatorId: testForm.lessonPhases[0].indicators[0].id,
        selectedScore: 2,
      });

      await indicatorResponsesService.create(testSession.id, {
        indicatorId: testForm.lessonPhases[0].indicators[1].id,
        selectedLevel: 'checked',
        selectedScore: 1,
      });

      // Validate all responses
      const validationResult = await indicatorResponsesService.validateAllResponses(testSession.id);

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);
    });

    it('should track session statistics correctly', async () => {
      // Get initial statistics
      const initialStats = await observationSessionsService.getSessionStatistics(testUser);
      const initialTotal = initialStats.total;

      // Create multiple sessions in different states
      const sessions: ObservationSession[] = [];

      // Draft session
      const draftSession = await observationSessionsService.create(
        {
          formId: testForm.id,
          schoolName: 'Stats Test School 1',
          teacherName: 'Teacher 1',
          observerName: testUser.fullName,
          subject: 'Khmer',
          grade: '1',
          dateObserved: new Date().toISOString().split('T')[0],
          startTime: '07:30',
          endTime: '08:15',
        },
        testUser,
      );
      sessions.push(draftSession);

      // In-progress session
      const inProgressSession = await observationSessionsService.create(
        {
          formId: testForm.id,
          schoolName: 'Stats Test School 2',
          teacherName: 'Teacher 2',
          observerName: testUser.fullName,
          subject: 'Khmer',
          grade: '1',
          dateObserved: new Date().toISOString().split('T')[0],
          startTime: '09:00',
          endTime: '09:45',
        },
        testUser,
      );

      await sessionWorkflowService.transitionStatus(
        inProgressSession.id,
        SessionStatus.IN_PROGRESS,
        testUser,
      );
      sessions.push(inProgressSession);

      // Get updated statistics
      const updatedStats = await observationSessionsService.getSessionStatistics(testUser);

      expect(updatedStats.total).toBe(initialTotal + 2);
      expect(updatedStats.draft).toBeGreaterThanOrEqual(1);
      expect(updatedStats.inProgress).toBeGreaterThanOrEqual(1);

      // Clean up
      for (const session of sessions) {
        try {
          await observationSessionsService.remove(session.id, testUser);
        } catch (error) {
          // Some sessions might not be deletable
        }
      }
    });
  });
});