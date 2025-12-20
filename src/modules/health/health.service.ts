// =============================================================================
// Health Service - Health Check Logic
// =============================================================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { RedisService } from '../../core/redis/redis.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Basic health check
   */
  async check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  /**
   * Detailed health check including dependencies
   */
  async checkReady() {
    const checks = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: await this.checkDatabase(),
        redis: await this.checkRedis(),
      },
    };

    // Set overall status based on service health
    const allHealthy = Object.values(checks.services).every(
      (service) => service.status === 'ok',
    );

    if (!allHealthy) {
      checks.status = 'degraded';
    }

    return checks;
  }

  /**
   * Check database connectivity
   */
  private async checkDatabase(): Promise<{ status: string; latency?: number; error?: string }> {
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;
      return { status: 'ok', latency };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check Redis connectivity
   */
  private async checkRedis(): Promise<{ status: string; latency?: number; error?: string }> {
    try {
      const start = Date.now();
      await this.redis.getClient().ping();
      const latency = Date.now() - start;
      return { status: 'ok', latency };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

