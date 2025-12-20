// =============================================================================
// Health Controller - Health Check Endpoints for Docker/Kubernetes
// =============================================================================

import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Basic health check - returns 200 if the service is running
   * Used by Docker HEALTHCHECK and load balancers
   */
  @Public()
  @Get()
  async check() {
    return this.healthService.check();
  }

  /**
   * Detailed health check - includes database and Redis status
   * Used for debugging and monitoring dashboards
   */
  @Public()
  @Get('ready')
  async ready() {
    return this.healthService.checkReady();
  }

  /**
   * Liveness probe - simple check if the process is alive
   * Used by Kubernetes liveness probes
   */
  @Public()
  @Get('live')
  async live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}

