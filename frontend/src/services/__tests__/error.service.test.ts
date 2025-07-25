import { AxiosError } from 'axios';
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { ErrorService } from '../error.service';

// Mock translation function
const mockT = (key: string, options?: any) => {
  const translations: Record<string, string> = {
    'errors.network.badRequest': 'Invalid request',
    'errors.auth.invalidCredentials': 'Invalid credentials',
    'errors.network.forbidden': 'Access forbidden',
    'errors.network.notFound': 'Not found',
    'errors.network.conflict': 'Data conflict',
    'errors.network.tooManyRequests': 'Too many requests',
    'errors.network.serverError': 'Server error',
    'errors.network.offline': 'You are offline',
    'errors.network.timeout': 'Request timeout',
    'errors.generic.somethingWentWrong': 'Something went wrong',
    'errors.generic.unexpectedError': 'Unexpected error',
    'errors.validation.required': 'Field is required',
  };

  if (options && key.includes('{{')) {
    let result = translations[key] || key;
    Object.keys(options).forEach(optionKey => {
      result = result.replace(`{{${optionKey}}}`, options[optionKey]);
    });
    return result;
  }

  return translations[key] || key;
};

describe('ErrorService', () => {
  describe('parseError', () => {
    it('should parse Axios 400 error', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { message: 'Bad request data' },
        },
      } as AxiosError;

      const result = ErrorService.parseError(axiosError, mockT);

      expect(result).toEqual({
        message: 'Bad request data',
        code: 'BAD_REQUEST',
        statusCode: 400,
        details: { message: 'Bad request data' },
        isRetriable: false,
      });
    });

    it('should parse Axios 401 error', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 401,
          data: {},
        },
      } as AxiosError;

      const result = ErrorService.parseError(axiosError, mockT);

      expect(result).toEqual({
        message: 'Invalid credentials',
        code: 'UNAUTHORIZED',
        statusCode: 401,
        isRetriable: false,
      });
    });

    it('should parse Axios 500 error as retriable', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      } as AxiosError;

      const result = ErrorService.parseError(axiosError, mockT);

      expect(result).toEqual({
        message: 'Server error',
        code: 'SERVER_ERROR',
        statusCode: 500,
        isRetriable: true,
      });
    });

    it('should parse network error as retriable', () => {
      const axiosError = {
        isAxiosError: true,
        code: 'NETWORK_ERROR',
        message: 'Network Error',
        response: undefined,
      } as AxiosError;

      const result = ErrorService.parseError(axiosError, mockT);

      expect(result).toEqual({
        message: 'You are offline',
        code: 'NETWORK_ERROR',
        isRetriable: true,
      });
    });

    it('should parse timeout error as retriable', () => {
      const axiosError = {
        isAxiosError: true,
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
        response: undefined,
      } as AxiosError;

      const result = ErrorService.parseError(axiosError, mockT);

      expect(result).toEqual({
        message: 'Request timeout',
        code: 'TIMEOUT_ERROR',
        isRetriable: true,
      });
    });

    it('should parse JavaScript Error', () => {
      const jsError = new TypeError('Cannot read property of undefined');

      const result = ErrorService.parseError(jsError, mockT);

      expect(result).toEqual({
        message: 'Unexpected error',
        code: 'TYPE_ERROR',
        isRetriable: false,
      });
    });

    it('should parse string error', () => {
      const stringError = 'Something went wrong';

      const result = ErrorService.parseError(stringError, mockT);

      expect(result).toEqual({
        message: 'Something went wrong',
        code: 'UNKNOWN_ERROR',
        isRetriable: false,
      });
    });

    it('should parse unknown error', () => {
      const unknownError = { someProperty: 'value' };

      const result = ErrorService.parseError(unknownError, mockT);

      expect(result).toEqual({
        message: 'Unexpected error',
        code: 'UNKNOWN_ERROR',
        isRetriable: false,
      });
    });
  });

  describe('isRetriableError', () => {
    it('should return true for retriable errors', () => {
      const retriableError = {
        message: 'Network error',
        code: 'NETWORK_ERROR',
        isRetriable: true,
      };

      expect(ErrorService.isRetriableError(retriableError)).toBe(true);
    });

    it('should return false for non-retriable errors', () => {
      const nonRetriableError = {
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        isRetriable: false,
      };

      expect(ErrorService.isRetriableError(nonRetriableError)).toBe(false);
    });
  });

  describe('shouldShowRetryButton', () => {
    it('should return true for network errors', () => {
      const networkError = {
        message: 'Network error',
        code: 'NETWORK_ERROR',
      };

      expect(ErrorService.shouldShowRetryButton(networkError)).toBe(true);
    });

    it('should return true for timeout errors', () => {
      const timeoutError = {
        message: 'Timeout error',
        code: 'TIMEOUT_ERROR',
      };

      expect(ErrorService.shouldShowRetryButton(timeoutError)).toBe(true);
    });

    it('should return false for validation errors', () => {
      const validationError = {
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
      };

      expect(ErrorService.shouldShowRetryButton(validationError)).toBe(false);
    });
  });

  describe('getRetryDelay', () => {
    it('should return exponential backoff delays', () => {
      expect(ErrorService.getRetryDelay(0)).toBe(1000);
      expect(ErrorService.getRetryDelay(1)).toBe(2000);
      expect(ErrorService.getRetryDelay(2)).toBe(4000);
      expect(ErrorService.getRetryDelay(3)).toBe(8000);
    });

    it('should cap delay at 30 seconds', () => {
      expect(ErrorService.getRetryDelay(10)).toBe(30000);
    });
  });

  describe('logError', () => {
    const originalLocalStorage = global.localStorage;
    const mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };

    beforeEach(() => {
      Object.defineProperty(global, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      });
      vi.clearAllMocks();
    });

    afterAll(() => {
      Object.defineProperty(global, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
      });
    });

    it('should store error in localStorage in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      mockLocalStorage.getItem.mockReturnValue('[]');

      const error = {
        message: 'Test error',
        code: 'TEST_ERROR',
      };

      ErrorService.logError(error, { userId: '123' });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'app_errors',
        expect.stringContaining('Test error')
      );
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const error = {
        message: 'Test error',
        code: 'TEST_ERROR',
      };

      // Should not throw
      expect(() => {
        ErrorService.logError(error);
      }).not.toThrow();
    });
  });
});