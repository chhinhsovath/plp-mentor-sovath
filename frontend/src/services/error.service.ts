import { AxiosError } from 'axios';
import { TFunction } from 'i18next';

export interface ErrorInfo {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
  isRetriable?: boolean;
}

export class ErrorService {
  static parseError(error: unknown, t: TFunction): ErrorInfo {
    // Handle Axios errors (API responses)
    if (this.isAxiosError(error)) {
      return this.parseAxiosError(error, t);
    }

    // Handle JavaScript errors
    if (error instanceof Error) {
      return this.parseJavaScriptError(error, t);
    }

    // Handle string errors
    if (typeof error === 'string') {
      return {
        message: error,
        code: 'UNKNOWN_ERROR',
        isRetriable: false,
      };
    }

    // Handle unknown error types
    return {
      message: t('errors.generic.unexpectedError'),
      code: 'UNKNOWN_ERROR',
      isRetriable: false,
    };
  }

  private static isAxiosError(error: unknown): error is AxiosError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'isAxiosError' in error &&
      (error as any).isAxiosError === true
    );
  }

  private static parseAxiosError(error: AxiosError, t: TFunction): ErrorInfo {
    const response = error.response;
    const statusCode = response?.status;

    // Handle specific HTTP status codes
    switch (statusCode) {
      case 400:
        return {
          message: this.getErrorMessage(response?.data, t('errors.network.badRequest')),
          code: 'BAD_REQUEST',
          statusCode,
          details: response?.data,
          isRetriable: false,
        };

      case 401:
        return {
          message: t('errors.auth.invalidCredentials'),
          code: 'UNAUTHORIZED',
          statusCode,
          isRetriable: false,
        };

      case 403:
        return {
          message: t('errors.network.forbidden'),
          code: 'FORBIDDEN',
          statusCode,
          isRetriable: false,
        };

      case 404:
        return {
          message: t('errors.network.notFound'),
          code: 'NOT_FOUND',
          statusCode,
          isRetriable: false,
        };

      case 409:
        return {
          message: t('errors.network.conflict'),
          code: 'CONFLICT',
          statusCode,
          isRetriable: false,
        };

      case 422:
        return {
          message: this.getValidationErrorMessage(response?.data, t),
          code: 'VALIDATION_ERROR',
          statusCode,
          details: response?.data,
          isRetriable: false,
        };

      case 429:
        return {
          message: t('errors.network.tooManyRequests'),
          code: 'RATE_LIMIT_EXCEEDED',
          statusCode,
          isRetriable: true,
        };

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          message: t('errors.network.serverError'),
          code: 'SERVER_ERROR',
          statusCode,
          isRetriable: true,
        };

      default:
        // Handle network errors (no response)
        if (!response) {
          if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
            return {
              message: t('errors.network.offline'),
              code: 'NETWORK_ERROR',
              isRetriable: true,
            };
          }

          if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            return {
              message: t('errors.network.timeout'),
              code: 'TIMEOUT_ERROR',
              isRetriable: true,
            };
          }
        }

        return {
          message: this.getErrorMessage(response?.data, t('errors.generic.somethingWentWrong')),
          code: 'UNKNOWN_ERROR',
          statusCode,
          isRetriable: true,
        };
    }
  }

  private static parseJavaScriptError(error: Error, t: TFunction): ErrorInfo {
    // Handle specific JavaScript error types
    if (error.name === 'TypeError') {
      return {
        message: t('errors.generic.unexpectedError'),
        code: 'TYPE_ERROR',
        isRetriable: false,
      };
    }

    if (error.name === 'ReferenceError') {
      return {
        message: t('errors.generic.unexpectedError'),
        code: 'REFERENCE_ERROR',
        isRetriable: false,
      };
    }

    return {
      message: error.message || t('errors.generic.somethingWentWrong'),
      code: error.name || 'JAVASCRIPT_ERROR',
      isRetriable: false,
    };
  }

  private static getErrorMessage(responseData: any, fallback: string): string {
    if (typeof responseData === 'string') {
      return responseData;
    }

    if (typeof responseData === 'object' && responseData !== null) {
      return responseData.message || responseData.error || fallback;
    }

    return fallback;
  }

  private static getValidationErrorMessage(responseData: any, t: TFunction): string {
    if (responseData?.details && Array.isArray(responseData.details)) {
      // Handle validation error details
      const firstError = responseData.details[0];
      if (firstError?.message) {
        return firstError.message;
      }
    }

    if (responseData?.message) {
      return responseData.message;
    }

    return t('errors.validation.required');
  }

  static isRetriableError(error: ErrorInfo): boolean {
    return error.isRetriable === true;
  }

  static shouldShowRetryButton(error: ErrorInfo): boolean {
    const retriableCodes = [
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
      'SERVER_ERROR',
      'RATE_LIMIT_EXCEEDED',
    ];

    return retriableCodes.includes(error.code || '');
  }

  static getRetryDelay(attemptCount: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
    return Math.min(1000 * Math.pow(2, attemptCount), 30000);
  }

  static logError(error: ErrorInfo, context?: any): void {
    const logData = {
      ...error,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error logged:', logData);
    }

    // Send to monitoring service in production
    if (import.meta.env.PROD) {
      this.sendToMonitoringService(logData);
    }
  }

  private static sendToMonitoringService(errorData: any): void {
    // TODO: Integrate with monitoring service (e.g., Sentry, LogRocket)
    // For now, just store in localStorage for debugging
    try {
      const errors = JSON.parse(localStorage.getItem('app_errors') || '[]');
      errors.push(errorData);
      
      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50);
      }
      
      localStorage.setItem('app_errors', JSON.stringify(errors));
    } catch (e) {
      console.warn('Failed to store error in localStorage:', e);
    }
  }
}