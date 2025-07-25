import { SetMetadata } from '@nestjs/common';

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export const RateLimit = (options: RateLimitOptions) => SetMetadata('rateLimit', options);

// Common rate limit configurations
export const RateLimits = {
  // Authentication endpoints - stricter limits
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts, please try again later',
  },
  
  // API endpoints - moderate limits
  API: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: 'Too many API requests, please slow down',
  },
  
  // Export endpoints - stricter limits due to resource intensity
  EXPORT: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 exports per 5 minutes
    message: 'Too many export requests, please wait before trying again',
  },
  
  // File upload endpoints
  UPLOAD: {
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 uploads per minute
    message: 'Too many file uploads, please wait',
  },
  
  // Password reset endpoints
  PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 password reset attempts per hour
    message: 'Too many password reset attempts, please try again later',
  },
};