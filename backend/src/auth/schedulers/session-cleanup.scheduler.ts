import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuthService } from '../auth.service';

@Injectable()
export class SessionCleanupScheduler {
  constructor(private authService: AuthService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleSessionCleanup() {
    await this.authService.cleanupExpiredSessions();
  }
}