import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Mentoring Platform API - MoEYS Cambodia 🇰🇭';
  }
}
