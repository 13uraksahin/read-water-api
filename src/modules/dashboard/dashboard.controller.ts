// =============================================================================
// Dashboard Controller
// =============================================================================

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService, DashboardStats } from './dashboard.service';
import { JwtAuthGuard } from '../iam/auth/guards/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(@Query('tenantId') tenantId?: string): Promise<DashboardStats> {
    return this.dashboardService.getStats(tenantId);
  }
}
