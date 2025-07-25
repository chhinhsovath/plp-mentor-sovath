import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class ErrorLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ErrorLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        // Log successful requests
        const duration = Date.now() - startTime;
        this.logger.log(
          `${request.method} ${request.url} - 200 - ${duration}ms`
        );
      }),
      catchError((error) => {
        // Log error details
        const duration = Date.now() - startTime;
        const errorContext = {
          method: request.method,
          url: request.url,
          duration: `${duration}ms`,
          userAgent: request.headers['user-agent'],
          ip: request.ip,
          userId: (request as any).user?.id,
          timestamp: new Date().toISOString(),
        };

        this.logger.error(
          `${request.method} ${request.url} - Error: ${error.message}`,
          error.stack,
          JSON.stringify(errorContext)
        );

        // Re-throw the error to be handled by the global exception filter
        return throwError(() => error);
      })
    );
  }
}