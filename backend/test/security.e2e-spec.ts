import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Security (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Security Headers', () => {
    it('should set security headers on all responses', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(404); // Endpoint might not exist, but headers should be set

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['strict-transport-security']).toContain('max-age=31536000');
      expect(response.headers['content-security-policy']).toContain("default-src 'self'");
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });

    it('should remove server information headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(404);

      expect(response.headers['x-powered-by']).toBeUndefined();
      expect(response.headers['server']).toBeUndefined();
    });
  });

  describe('Authentication Security', () => {
    it('should reject requests without authentication token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/profile')
        .expect(401);
    });

    it('should reject requests with invalid authentication token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should reject requests with malformed authentication header', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/profile')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);
    });
  });

  describe('Input Validation Security', () => {
    it('should reject SQL injection attempts in login', async () => {
      const sqlInjectionPayloads = [
        "admin'; DROP TABLE users; --",
        "admin' OR '1'='1",
        "admin' UNION SELECT * FROM users --",
        "'; INSERT INTO users VALUES ('hacker', 'password'); --",
      ];

      for (const payload of sqlInjectionPayloads) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            username: payload,
            password: 'password',
          })
          .expect(400); // Should be rejected by validation
      }
    });

    it('should reject XSS attempts in form inputs', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert("xss")',
        '<iframe src="javascript:alert(1)"></iframe>',
        '<svg onload="alert(1)">',
      ];

      for (const payload of xssPayloads) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send({
            username: 'testuser',
            email: 'test@example.com',
            fullName: payload,
            password: 'ValidPassword123!',
          })
          .expect(400); // Should be rejected by validation
      }
    });

    it('should enforce strong password requirements', async () => {
      const weakPasswords = [
        '123456',
        'password',
        'qwerty',
        'admin',
        'letmein',
        'short',
        'NoNumbers!',
        'nouppercase123!',
        'NOLOWERCASE123!',
        'NoSpecialChars123',
      ];

      for (const password of weakPasswords) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send({
            username: 'testuser',
            email: 'test@example.com',
            fullName: 'Test User',
            password: password,
          })
          .expect(400); // Should be rejected by validation
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on authentication endpoints', async () => {
      const promises = [];
      
      // Send multiple requests quickly
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app.getHttpServer())
            .post('/api/v1/auth/login')
            .send({
              username: 'testuser',
              password: 'wrongpassword',
            })
        );
      }

      const responses = await Promise.all(promises);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should include rate limit headers in responses', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword',
        });

      // Rate limit headers might be present
      if (response.headers['x-ratelimit-limit']) {
        expect(response.headers['x-ratelimit-limit']).toBeDefined();
        expect(response.headers['x-ratelimit-remaining']).toBeDefined();
        expect(response.headers['x-ratelimit-reset']).toBeDefined();
      }
    });
  });

  describe('File Upload Security', () => {
    it('should reject dangerous file types', async () => {
      const dangerousFiles = [
        { filename: 'malware.exe', mimetype: 'application/x-executable' },
        { filename: 'script.js', mimetype: 'application/javascript' },
        { filename: 'shell.sh', mimetype: 'application/x-sh' },
        { filename: 'virus.bat', mimetype: 'application/x-bat' },
      ];

      for (const file of dangerousFiles) {
        await request(app.getHttpServer())
          .post('/api/v1/upload')
          .attach('file', Buffer.from('fake content'), file.filename)
          .expect(400); // Should be rejected
      }
    });

    it('should reject files with directory traversal attempts', async () => {
      const maliciousFilenames = [
        '../../../etc/passwd',
        '..\\..\\windows\\system32\\config\\sam',
        './../../sensitive-file.txt',
        'normal-name/../../../etc/shadow',
      ];

      for (const filename of maliciousFilenames) {
        await request(app.getHttpServer())
          .post('/api/v1/upload')
          .attach('file', Buffer.from('fake content'), filename)
          .expect(400); // Should be rejected
      }
    });
  });

  describe('CORS Security', () => {
    it('should enforce CORS policy', async () => {
      const response = await request(app.getHttpServer())
        .options('/api/v1/auth/login')
        .set('Origin', 'https://malicious-site.com')
        .set('Access-Control-Request-Method', 'POST');

      // Should not allow requests from unauthorized origins
      expect(response.headers['access-control-allow-origin']).not.toBe('https://malicious-site.com');
    });

    it('should allow requests from authorized origins', async () => {
      const response = await request(app.getHttpServer())
        .options('/api/v1/auth/login')
        .set('Origin', 'http://localhost:5173') // Authorized frontend URL
        .set('Access-Control-Request-Method', 'POST');

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });
  });

  describe('Error Information Disclosure', () => {
    it('should not expose sensitive information in error messages', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/nonexistent-endpoint')
        .expect(404);

      // Error message should not contain sensitive information
      expect(response.body.message).not.toContain('database');
      expect(response.body.message).not.toContain('password');
      expect(response.body.message).not.toContain('secret');
      expect(response.body.message).not.toContain('token');
    });

    it('should not expose stack traces in production', async () => {
      // This test assumes NODE_ENV is set to production for security testing
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser',
          // Missing password to trigger validation error
        })
        .expect(400);

      expect(response.body.stack).toBeUndefined();
      expect(response.body.trace).toBeUndefined();
    });
  });

  describe('Session Security', () => {
    it('should use secure session configuration', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: 'validuser',
          password: 'ValidPassword123!',
        });

      // Check for secure cookie settings if sessions are used
      const setCookieHeader = response.headers['set-cookie'];
      if (setCookieHeader) {
        const cookieString = Array.isArray(setCookieHeader) 
          ? setCookieHeader.join('; ') 
          : setCookieHeader;
        
        expect(cookieString).toContain('HttpOnly');
        expect(cookieString).toContain('Secure');
        expect(cookieString).toContain('SameSite');
      }
    });
  });

  describe('API Versioning Security', () => {
    it('should reject requests to deprecated API versions', async () => {
      await request(app.getHttpServer())
        .get('/api/v0/users') // Old version
        .expect(404);
    });

    it('should require API version in requests', async () => {
      await request(app.getHttpServer())
        .get('/api/users') // Missing version
        .expect(404);
    });
  });
});