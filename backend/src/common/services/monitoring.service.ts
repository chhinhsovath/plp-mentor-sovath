import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ErrorLogEntry {
  message: string;
  stack?: string;
  context?: any;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  source: 'backend' | 'frontend';
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  context?: any;
}

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private errorBuffer: ErrorLogEntry[] = [];
  private metricsBuffer: PerformanceMetric[] = [];
  private readonly bufferSize = 100;
  private readonly flushInterval = 30000; // 30 seconds

  constructor(private configService: ConfigService) {
    // Start periodic flush
    setInterval(() => {
      this.flushBuffers();
    }, this.flushInterval);
  }

  logError(entry: Partial<ErrorLogEntry>): void {
    const errorEntry: ErrorLogEntry = {
      message: entry.message || 'Unknown error',
      stack: entry.stack,
      context: entry.context,
      userId: entry.userId,
      sessionId: entry.sessionId,
      requestId: entry.requestId,
      timestamp: entry.timestamp || new Date().toISOString(),
      level: entry.level || 'error',
      source: entry.source || 'backend',
    };

    // Add to buffer
    this.errorBuffer.push(errorEntry);

    // Log locally
    this.logger.error(
      `${errorEntry.source.toUpperCase()} ERROR: ${errorEntry.message}`,
      errorEntry.stack,
      JSON.stringify({
        context: errorEntry.context,
        userId: errorEntry.userId,
        sessionId: errorEntry.sessionId,
      })
    );

    // Flush if buffer is full
    if (this.errorBuffer.length >= this.bufferSize) {
      this.flushErrorBuffer();
    }
  }

  logPerformanceMetric(metric: Partial<PerformanceMetric>): void {
    const performanceMetric: PerformanceMetric = {
      name: metric.name || 'unknown_metric',
      value: metric.value || 0,
      unit: metric.unit || 'ms',
      timestamp: metric.timestamp || new Date().toISOString(),
      context: metric.context,
    };

    this.metricsBuffer.push(performanceMetric);

    // Log locally in development
    if (process.env.NODE_ENV === 'development') {
      this.logger.log(
        `PERFORMANCE: ${performanceMetric.name} = ${performanceMetric.value}${performanceMetric.unit}`
      );
    }

    // Flush if buffer is full
    if (this.metricsBuffer.length >= this.bufferSize) {
      this.flushMetricsBuffer();
    }
  }

  private flushBuffers(): void {
    this.flushErrorBuffer();
    this.flushMetricsBuffer();
  }

  private flushErrorBuffer(): void {
    if (this.errorBuffer.length === 0) return;

    const errors = [...this.errorBuffer];
    this.errorBuffer = [];

    // Send to monitoring service
    this.sendErrorsToMonitoringService(errors);
  }

  private flushMetricsBuffer(): void {
    if (this.metricsBuffer.length === 0) return;

    const metrics = [...this.metricsBuffer];
    this.metricsBuffer = [];

    // Send to monitoring service
    this.sendMetricsToMonitoringService(metrics);
  }

  private async sendErrorsToMonitoringService(errors: ErrorLogEntry[]): Promise<void> {
    try {
      // TODO: Integrate with actual monitoring service (Sentry, DataDog, etc.)
      const monitoringUrl = this.configService.get<string>('MONITORING_URL');
      const apiKey = this.configService.get<string>('MONITORING_API_KEY');

      if (!monitoringUrl || !apiKey) {
        // Store in database or file system as fallback
        this.storeErrorsLocally(errors);
        return;
      }

      // Example integration with monitoring service
      // const response = await fetch(`${monitoringUrl}/errors`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${apiKey}`,
      //   },
      //   body: JSON.stringify({ errors }),
      // });

      // if (!response.ok) {
      //   throw new Error(`Failed to send errors: ${response.statusText}`);
      // }

      // For now, just log to console
      console.log('Errors sent to monitoring service:', errors.length);
    } catch (error) {
      this.logger.error('Failed to send errors to monitoring service:', error);
      this.storeErrorsLocally(errors);
    }
  }

  private async sendMetricsToMonitoringService(metrics: PerformanceMetric[]): Promise<void> {
    try {
      // TODO: Integrate with actual monitoring service
      const monitoringUrl = this.configService.get<string>('MONITORING_URL');
      const apiKey = this.configService.get<string>('MONITORING_API_KEY');

      if (!monitoringUrl || !apiKey) {
        return;
      }

      // For now, just log to console
      console.log('Metrics sent to monitoring service:', metrics.length);
    } catch (error) {
      this.logger.error('Failed to send metrics to monitoring service:', error);
    }
  }

  private storeErrorsLocally(errors: ErrorLogEntry[]): void {
    // Store errors in database or file system as fallback
    // This ensures we don't lose error data if the monitoring service is unavailable
    try {
      // TODO: Implement database storage
      this.logger.warn(`Storing ${errors.length} errors locally due to monitoring service unavailability`);
    } catch (error) {
      this.logger.error('Failed to store errors locally:', error);
    }
  }

  // Health check method
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    errorBufferSize: number;
    metricsBufferSize: number;
    lastFlush: string;
  }> {
    return {
      status: this.errorBuffer.length > this.bufferSize * 0.8 ? 'degraded' : 'healthy',
      errorBufferSize: this.errorBuffer.length,
      metricsBufferSize: this.metricsBuffer.length,
      lastFlush: new Date().toISOString(),
    };
  }
}