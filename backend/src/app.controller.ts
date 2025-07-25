import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decorator';

@ApiTags('Health Check')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check endpoint' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Application health status' })
  async getHealth() {
    let dbStatus = 'disconnected';
    let dbInfo = null;

    try {
      if (this.dataSource.isInitialized) {
        const result = await this.dataSource.query('SELECT NOW() as current_time');
        dbStatus = 'connected';
        dbInfo = result[0];
      }
    } catch (error) {
      dbStatus = 'error';
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Mentoring Platform API',
      version: '1.0.0',
      database: {
        status: dbStatus,
        info: dbInfo,
      },
    };
  }
}
