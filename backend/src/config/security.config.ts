import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SecurityConfig {
  constructor(private configService: ConfigService) {}

  getHttpsOptions() {
    const nodeEnv = this.configService.get('NODE_ENV');
    
    if (nodeEnv === 'production') {
      const certPath = this.configService.get('SSL_CERT_PATH');
      const keyPath = this.configService.get('SSL_KEY_PATH');
      
      if (certPath && keyPath) {
        return {
          key: fs.readFileSync(path.resolve(keyPath)),
          cert: fs.readFileSync(path.resolve(certPath)),
        };
      }
    }
    
    return null;
  }

  getCorsOptions() {
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
    const nodeEnv = this.configService.get('NODE_ENV');
    
    const allowedOrigins = nodeEnv === 'production' 
      ? [
          frontendUrl,
          'https://mentoring.openpip.com',
          'https://www.mentoring.openpip.com'
        ] 
      : [
          frontendUrl, 
          'http://localhost:3000', 
          'http://localhost:5173', 
          'http://localhost:5174'
        ];
    
    return {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    };
  }

  getSecurityHeaders() {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    };
  }
}