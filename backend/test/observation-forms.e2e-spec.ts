import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Observation Forms (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get auth token
    const loginResponse = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      username: 'admin',
      password: 'admin123',
    });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/observation-forms (GET)', () => {
    it('should return 401 without token', () => {
      return request(app.getHttpServer()).get('/api/v1/observation-forms').expect(401);
    });

    it('should return observation forms with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/observation-forms')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should filter forms by subject', () => {
      return request(app.getHttpServer())
        .get('/api/v1/observation-forms?subject=Khmer')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body.every((form: any) => form.subject === 'Khmer')).toBe(true);
          }
        });
    });

    it('should filter forms by grade', () => {
      return request(app.getHttpServer())
        .get('/api/v1/observation-forms?grade=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body.every((form: any) => form.gradeRange.includes('1'))).toBe(true);
          }
        });
    });
  });

  describe('/observation-forms/subjects (GET)', () => {
    it('should return available subjects', () => {
      return request(app.getHttpServer())
        .get('/api/v1/observation-forms/subjects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/observation-forms/grades (GET)', () => {
    it('should return available grades', () => {
      return request(app.getHttpServer())
        .get('/api/v1/observation-forms/grades')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/observation-forms/by-grade-subject (GET)', () => {
    it('should return forms by grade and subject', () => {
      return request(app.getHttpServer())
        .get('/api/v1/observation-forms/by-grade-subject?grade=1&subject=Khmer')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should return 400 without required parameters', () => {
      return request(app.getHttpServer())
        .get('/api/v1/observation-forms/by-grade-subject')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('/observation-forms/code/:formCode (GET)', () => {
    it('should return form by code if exists', async () => {
      // First, get available forms to find a valid form code
      const formsResponse = await request(app.getHttpServer())
        .get('/api/v1/observation-forms')
        .set('Authorization', `Bearer ${authToken}`);

      if (formsResponse.body.length > 0) {
        const formCode = formsResponse.body[0].formCode;

        return request(app.getHttpServer())
          .get(`/api/v1/observation-forms/code/${formCode}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('formCode', formCode);
            expect(res.body).toHaveProperty('title');
            expect(res.body).toHaveProperty('subject');
            expect(res.body).toHaveProperty('gradeRange');
          });
      }
    });

    it('should return 404 for non-existent form code', () => {
      return request(app.getHttpServer())
        .get('/api/v1/observation-forms/code/NON-EXISTENT')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/observation-forms (POST)', () => {
    const newFormDto = {
      formCode: 'TEST-FORM',
      title: 'Test Observation Form',
      subject: 'Test Subject',
      gradeRange: 'Test Grade',
      lessonPhases: [
        {
          title: 'Test Phase',
          sectionOrder: 1,
          indicators: [
            {
              indicatorNumber: '1.1',
              indicatorText: 'Test indicator',
              maxScore: 3,
              rubricType: 'scale',
              scales: [
                {
                  scaleLabel: '1',
                  scaleDescription: 'Poor',
                },
                {
                  scaleLabel: '2',
                  scaleDescription: 'Good',
                },
                {
                  scaleLabel: '3',
                  scaleDescription: 'Excellent',
                },
              ],
            },
          ],
        },
      ],
    };

    it('should create new observation form with admin role', () => {
      return request(app.getHttpServer())
        .post('/api/v1/observation-forms')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newFormDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('formCode', newFormDto.formCode);
          expect(res.body).toHaveProperty('title', newFormDto.title);
          expect(res.body).toHaveProperty('subject', newFormDto.subject);
          expect(res.body).toHaveProperty('gradeRange', newFormDto.gradeRange);
        });
    });

    it('should return 409 when creating form with duplicate code', () => {
      return request(app.getHttpServer())
        .post('/api/v1/observation-forms')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newFormDto)
        .expect(409);
    });

    it('should return 400 for invalid form data', () => {
      return request(app.getHttpServer())
        .post('/api/v1/observation-forms')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required fields
          title: 'Incomplete Form',
        })
        .expect(400);
    });
  });

  describe('/observation-forms/:id (GET)', () => {
    it('should return form by ID if exists', async () => {
      // First, get available forms to find a valid ID
      const formsResponse = await request(app.getHttpServer())
        .get('/api/v1/observation-forms')
        .set('Authorization', `Bearer ${authToken}`);

      if (formsResponse.body.length > 0) {
        const formId = formsResponse.body[0].id;

        return request(app.getHttpServer())
          .get(`/api/v1/observation-forms/${formId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('id', formId);
            expect(res.body).toHaveProperty('formCode');
            expect(res.body).toHaveProperty('title');
          });
      }
    });

    it('should return 404 for non-existent form ID', () => {
      return request(app.getHttpServer())
        .get('/api/v1/observation-forms/123e4567-e89b-12d3-a456-426614174000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
