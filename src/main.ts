// =============================================================================
// Read Water - API Entry Point
// =============================================================================

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create NestJS application
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Get config service
  const configService = app.get(ConfigService);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Parse CORS origins from environment
  const corsOriginsStr = configService.get<string>(
    'CORS_ORIGINS',
    'http://localhost:3000,https://read-water-app.portall.com.tr',
  );
  const corsOrigins = corsOriginsStr.split(',').map((origin) => origin.trim());

  logger.log(`📡 CORS enabled for origins: ${corsOrigins.join(', ')}`);

  // Enable CORS
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Page-Size'],
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip non-whitelisted properties
      transform: true, // Transform payloads to DTO instances
      forbidNonWhitelisted: true, // Throw error on non-whitelisted properties
      transformOptions: {
        enableImplicitConversion: true, // Enable implicit type conversion
      },
      validationError: {
        target: false, // Don't expose target object in errors
        value: false, // Don't expose values in errors
      },
    }),
  );

  // Global Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Get port from config
  const port = configService.get<number>('API_PORT', 4000);

  // Start server
  await app.listen(port);

  logger.log(`🚀 Read Water API is running on: http://localhost:${port}/api/v1`);
  logger.log(`📚 Environment: ${configService.get<string>('NODE_ENV', 'development')}`);
}

bootstrap();
