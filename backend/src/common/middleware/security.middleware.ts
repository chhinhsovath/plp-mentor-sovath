import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SecurityConfig } from '../../config/security.config';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  constructor(private securityConfig: SecurityConfig) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Set security headers
    const headers = this.securityConfig.getSecurityHeaders();
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Remove server information
    res.removeHeader('X-Powered-By');
    
    // Force HTTPS in production - DISABLED for now
    // if (process.env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
    //   return res.redirect(`https://${req.header('host')}${req.url}`);
    // }

    next();
  }
}