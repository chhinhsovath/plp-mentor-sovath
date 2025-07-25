import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';
import { MonitoringService } from '../services/monitoring.service';

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly monitoringService: MonitoringService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request);
    
    // Log error details
    this.logError(exception, request, errorResponse);

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private buildErrorResponse(exception: unknown, request: Request) {
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let details: any = null;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const response = exception.getResponse();
      
      if (typeof response === 'string') {
        message = response;
        errorCode = exception.name;
      } else if (typeof response === 'object' && response !== null) {
        message = (response as any).message || exception.message;
        errorCode = (response as any).error || exception.name;
        details = (response as any).details;
      }
    } else if (exception instanceof QueryFailedError) {
      statusCode = HttpStatus.BAD_REQUEST;
      message = this.handleDatabaseError(exception);
      errorCode = 'DATABASE_ERROR';
    } else if (exception instanceof EntityNotFoundError) {
      statusCode = HttpStatus.NOT_FOUND;
      message = 'Resource not found';
      errorCode = 'ENTITY_NOT_FOUND';
    } else if (exception instanceof Error) {
      message = exception.message;
      errorCode = exception.name;
    }

    return {
      statusCode,
      message: this.translateErrorMessage(message, errorCode),
      errorCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && {
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    };
  }

  private handleDatabaseError(error: QueryFailedError): string {
    const message = error.message.toLowerCase();
    
    // Handle common database constraint violations
    if (message.includes('unique constraint') || message.includes('duplicate key')) {
      return 'A record with this information already exists';
    }
    
    if (message.includes('foreign key constraint') || message.includes('violates foreign key')) {
      return 'Referenced record does not exist';
    }
    
    if (message.includes('not null constraint') || message.includes('violates not-null')) {
      return 'Required field is missing';
    }
    
    if (message.includes('check constraint')) {
      return 'Invalid data format or value';
    }

    return 'Database operation failed';
  }

  private translateErrorMessage(message: string, errorCode: string): string {
    // In test environment, return original message for predictable testing
    if (process.env.NODE_ENV === 'test') {
      return message;
    }

    // Error message translations for Khmer support
    const translations: Record<string, { en: string; km: string }> = {
      'UNAUTHORIZED': {
        en: 'Access denied. Please log in.',
        km: 'ការចូលប្រើត្រូវបានបដិសេធ។ សូមចូលប្រើប្រាស់។'
      },
      'FORBIDDEN': {
        en: 'You do not have permission to access this resource.',
        km: 'អ្នកមិនមានសិទ្ធិចូលប្រើធនធាននេះទេ។'
      },
      'NOT_FOUND': {
        en: 'The requested resource was not found.',
        km: 'រកមិនឃើញធនធានដែលបានស្នើសុំ។'
      },
      'BAD_REQUEST': {
        en: 'Invalid request data.',
        km: 'ទិន្នន័យស្នើសុំមិនត្រឹមត្រូវ។'
      },
      'VALIDATION_ERROR': {
        en: 'Validation failed.',
        km: 'ការផ្ទៀងផ្ទាត់បរាជ័យ។'
      },
      'DATABASE_ERROR': {
        en: 'Database operation failed.',
        km: 'ប្រតិបត្តិការមូលដ្ឋានទិន្នន័យបរាជ័យ។'
      },
      'NETWORK_ERROR': {
        en: 'Network connection failed.',
        km: 'ការតភ្ជាប់បណ្តាញបរាជ័យ។'
      },
      'TIMEOUT_ERROR': {
        en: 'Request timeout.',
        km: 'ការស្នើសុំអស់ពេល។'
      },
      'RATE_LIMIT_EXCEEDED': {
        en: 'Too many requests. Please try again later.',
        km: 'ការស្នើសុំច្រើនពេក។ សូមព្យាយាមម្តងទៀតក្រោយមួយរំពេច។'
      },
      'SESSION_EXPIRED': {
        en: 'Your session has expired. Please log in again.',
        km: 'សម័យចូលប្រើប្រាស់បានផុតកំណត់។ សូមចូលប្រើម្តងទៀត។'
      },
      'INTERNAL_SERVER_ERROR': {
        en: 'Internal server error. Please try again later.',
        km: 'កំហុសម៉ាស៊ីនមេ។ សូមព្យាយាមម្តងទៀតក្រោយមួយរំពេច។'
      }
    };

    // For now, return English message. In production, determine language from request headers
    const translation = translations[errorCode];
    return translation ? translation.en : message;
  }

  private logError(exception: unknown, request: Request, errorResponse: any): void {
    const { statusCode, message, errorCode } = errorResponse;
    const { method, url, ip, headers } = request;

    const logContext = {
      statusCode,
      message,
      errorCode,
      method,
      url,
      ip,
      userAgent: headers['user-agent'],
      timestamp: new Date().toISOString(),
    };

    if (statusCode >= 500) {
      this.logger.error(
        `${method} ${url} - ${statusCode} - ${message}`,
        exception instanceof Error ? exception.stack : JSON.stringify(exception),
        JSON.stringify(logContext)
      );
    } else if (statusCode >= 400) {
      this.logger.warn(
        `${method} ${url} - ${statusCode} - ${message}`,
        JSON.stringify(logContext)
      );
    }

    // Send to external monitoring service
    this.sendToMonitoringService(exception, logContext);
  }

  private sendToMonitoringService(exception: unknown, context: any): void {
    this.monitoringService.logError({
      message: exception instanceof Error ? exception.message : 'Unknown error',
      stack: exception instanceof Error ? exception.stack : undefined,
      context,
      userId: context.userId,
      sessionId: context.sessionId,
      level: 'error',
      source: 'backend',
    });
  }
}