import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ErrorLoggingInterceptor } from './common/interceptors/error-logging.interceptor';
import { SecurityConfig } from './config/security.config';

async function bootstrap() {
  // Get HTTPS options for production
  const securityConfig = new SecurityConfig({
    get: (key: string) => process.env[key],
  } as any);
  
  const httpsOptions = securityConfig.getHttpsOptions();
  
  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });

  // Security middleware
  app.use(helmet.default({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "data:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
    },
  }));

  // Compression middleware
  app.use(compression());

  // Enable CORS with security configuration
  app.enableCors(securityConfig.getCorsOptions());

  // Global validation pipe with security enhancements
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Changed to false to fix CurrentUser decorator issues
      transform: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
      validateCustomDecorators: true,
    }),
  );

  // Global error handling - will be configured in app.module.ts with proper DI

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation (only in development)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Mentoring Platform API')
      .setDescription('API for Nationwide Mentoring Platform - MoEYS Cambodia')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  const protocol = httpsOptions ? 'https' : 'http';
  console.log(`🚀 Application is running on: ${protocol}://localhost:${port}`);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📚 API Documentation: ${protocol}://localhost:${port}/api/docs`);
  }
  
  console.log(`🔒 Security measures enabled: HTTPS=${!!httpsOptions}, Helmet=true, CORS=configured`);
}

bootstrap();
