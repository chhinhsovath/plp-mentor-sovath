import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuditService } from '../../common/services/audit.service';
import { AuditAction, AuditEntityType } from '../../entities/audit-log.entity';

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private auditService: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rateLimitConfig = this.reflector.get<RateLimitConfig>('rateLimit', context.getHandler());
    
    if (!rateLimitConfig) {
      return true; // No rate limiting configured
    }

    const request = context.switchToHttp().getRequest<Request>();
    const key = this.generateKey(request);
    const now = Date.now();

    // Clean up expired entries
    this.cleanupExpiredEntries(now);

    const entry = rateLimitStore.get(key);
    
    if (!entry || now > entry.resetTime) {
      // First request or window expired
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + rateLimitConfig.windowMs,
      });
      return true;
    }

    if (entry.count >= rateLimitConfig.max) {
      // Rate limit exceeded
      await this.logRateLimitViolation(request, rateLimitConfig);
      
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: rateLimitConfig.message || 'Too many requests',
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment counter
    entry.count++;
    return true;
  }

  private generateKey(request: Request): string {
    const ip = this.getClientIp(request);
    const userId = request.user?.['id'] || 'anonymous';
    const endpoint = `${request.method}:${request.route?.path || request.path}`;
    
    return `${ip}:${userId}:${endpoint}`;
  }

  private getClientIp(request: Request): string {
    return (
      request.headers['x-forwarded-for'] as string ||
      request.headers['x-real-ip'] as string ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }

  private cleanupExpiredEntries(now: number): void {
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }

  private async logRateLimitViolation(request: Request, config: RateLimitConfig): Promise<void> {
    const user = request.user as any;
    
    await this.auditService.log({
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role,
      action: AuditAction.READ, // Generic action for rate limit violations
      entityType: AuditEntityType.SYSTEM,
      description: `Rate limit exceeded: ${config.max} requests per ${config.windowMs}ms`,
      riskLevel: 'HIGH',
      success: false,
      errorMessage: 'Rate limit exceeded',
      metadata: {
        endpoint: `${request.method} ${request.path}`,
        limit: config.max,
        windowMs: config.windowMs,
      },
    }, request);
  }
}