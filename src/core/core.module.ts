// =============================================================================
// Core Module - Central Infrastructure Services
// =============================================================================

import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { KyselyModule } from './kysely/kysely.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    RedisModule,
    KyselyModule,
  ],
  exports: [ConfigModule, PrismaModule, RedisModule, KyselyModule],
})
export class CoreModule {}

