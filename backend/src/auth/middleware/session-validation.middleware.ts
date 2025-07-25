import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class SessionValidationMiddleware implements NestMiddleware {
  constructor(private authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const isValid = await this.authService.validateSession(token);
      if (!isValid) {
        return res.status(401).json({ message: 'Session expired or invalid' });
      }
    }
    
    next();
  }
}