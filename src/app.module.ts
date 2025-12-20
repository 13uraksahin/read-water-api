// =============================================================================
// App Module - Root Module
// =============================================================================

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Core Module
import { CoreModule } from './core/core.module';

// Feature Modules
import { IamModule } from './modules/iam/iam.module';
import { DeviceModule } from './modules/device/device.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { WorkerModule } from './modules/worker/worker.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReadingsModule } from './modules/readings/readings.module';
import { CustomersModule } from './modules/customers/customers.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AlarmsModule } from './modules/alarms/alarms.module';
import { HealthModule } from './modules/health/health.module';
// Note: DecodersModule removed - decoder logic merged into DeviceProfilesModule

// Guards
import { JwtAuthGuard } from './modules/iam/auth/guards/jwt-auth.guard';

@Module({
  imports: [
    // Core infrastructure
    CoreModule,

    // BullMQ configuration
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6380),
          password: configService.get<string>('REDIS_PASSWORD', ''),
          maxRetriesPerRequest: null,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: {
            age: 3600, // 1 hour
            count: 1000,
          },
          removeOnFail: {
            age: 86400, // 24 hours
          },
        },
      }),
    }),

    // Health checks (public, no auth)
    HealthModule,

    // Feature modules
    IamModule,
    DeviceModule,
    IngestionModule,
    WorkerModule,
    RealtimeModule,
    DashboardModule,
    ReadingsModule,
    CustomersModule,
    SettingsModule,
    AlarmsModule,
  ],
  providers: [
    // Global JWT Auth Guard
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
