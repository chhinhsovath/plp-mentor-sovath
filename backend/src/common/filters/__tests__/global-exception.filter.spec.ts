import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { GlobalExceptionFilter } from '../global-exception.filter';
import { MonitoringService } from '../../services/monitoring.service';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let monitoringService: jest.Mocked<MonitoringService>;

  const mockRequest = {
    url: '/api/test',
    method: 'GET',
    ip: '127.0.0.1',
    headers: {
      'user-agent': 'test-agent',
    },
  };

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  const mockHost = {
    switchToHttp: () => ({
      getRequest: () => mockRequest,
      getResponse: () => mockResponse,
    }),
  };

  beforeEach(async () => {
    const mockMonitoringService = {
      logError: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GlobalExceptionFilter,
        {
          provide: MonitoringService,
          useValue: mockMonitoringService,
        },
      ],
    }).compile();

    filter = module.get<GlobalExceptionFilter>(GlobalExceptionFilter);
    monitoringService = module.get(MonitoringService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should handle HttpException', () => {
    const exception = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockHost as any);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'Bad Request',
        errorCode: 'HttpException',
        timestamp: expect.any(String),
        path: '/api/test',
        method: 'GET',
      })
    );
  });

  it('should handle QueryFailedError', () => {
    const exception = new QueryFailedError(
      'SELECT * FROM users',
      [],
      new Error('unique constraint violation')
    );

    filter.catch(exception, mockHost as any);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'A record with this information already exists',
        errorCode: 'DATABASE_ERROR',
      })
    );
  });

  it('should handle EntityNotFoundError', () => {
    const exception = new EntityNotFoundError('User', { id: 1 });

    filter.catch(exception, mockHost as any);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: 'Resource not found',
        errorCode: 'ENTITY_NOT_FOUND',
      })
    );
  });

  it('should handle generic Error', () => {
    const exception = new Error('Something went wrong');

    filter.catch(exception, mockHost as any);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Something went wrong',
        errorCode: 'Error',
      })
    );
  });

  it('should handle unknown exception', () => {
    const exception = 'string error';

    filter.catch(exception, mockHost as any);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Internal server error',
        errorCode: 'INTERNAL_SERVER_ERROR',
      })
    );
  });

  it('should log error to monitoring service', () => {
    const exception = new Error('Test error');

    filter.catch(exception, mockHost as any);

    expect(monitoringService.logError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Test error',
        stack: expect.any(String),
        level: 'error',
        source: 'backend',
      })
    );
  });

  it('should include stack trace in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const exception = new Error('Test error');

    filter.catch(exception, mockHost as any);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        stack: expect.any(String),
      })
    );

    process.env.NODE_ENV = originalEnv;
  });

  it('should not include stack trace in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const exception = new Error('Test error');

    filter.catch(exception, mockHost as any);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.not.objectContaining({
        stack: expect.any(String),
      })
    );

    process.env.NODE_ENV = originalEnv;
  });

  describe('database error handling', () => {
    it('should handle unique constraint violation', () => {
      const exception = new QueryFailedError(
        'INSERT INTO users',
        [],
        new Error('duplicate key value violates unique constraint')
      );

      filter.catch(exception, mockHost as any);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'A record with this information already exists',
        })
      );
    });

    it('should handle foreign key constraint violation', () => {
      const exception = new QueryFailedError(
        'INSERT INTO posts',
        [],
        new Error('violates foreign key constraint')
      );

      filter.catch(exception, mockHost as any);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Referenced record does not exist',
        })
      );
    });

    it('should handle not null constraint violation', () => {
      const exception = new QueryFailedError(
        'INSERT INTO users',
        [],
        new Error('null value in column violates not-null constraint')
      );

      filter.catch(exception, mockHost as any);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Required field is missing',
        })
      );
    });
  });
});