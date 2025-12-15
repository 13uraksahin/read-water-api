// =============================================================================
// Dashboard Controller
// =============================================================================
// Endpoints for dashboard statistics, map data, alarms, and consumption charts
// =============================================================================

import { Controller, Get, Query, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import {
  DashboardService,
  DashboardStats,
  MeterMapData,
  DashboardAlarm,
  ConsumptionDataPoint,
} from './dashboard.service';
import { JwtAuthGuard } from '../iam/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import type { AuthenticatedUser } from '../../common/interfaces';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /dashboard/stats
   * Returns dashboard statistics (counts, totals)
   * Filtered by user's tenant access
   */
  @Get('stats')
  async getStats(
    @CurrentUser() user: AuthenticatedUser,
    @Query('tenantId') tenantId?: string,
  ): Promise<DashboardStats> {
    return this.dashboardService.getStats(user, tenantId);
  }

  /**
   * GET /dashboard/map
   * Returns all meters with location for map display
   * Includes device info (battery, signal) and alarm status
   * Filtered by user's tenant access
   */
  @Get('map')
  async getMapData(
    @CurrentUser() user: AuthenticatedUser,
    @Query('tenantId') tenantId?: string,
  ): Promise<MeterMapData[]> {
    return this.dashboardService.getMapData(user, tenantId);
  }

  /**
   * GET /dashboard/alarms
   * Returns active alarms for the alarm panel
   * Filtered by user's tenant access
   */
  @Get('alarms')
  async getAlarms(
    @CurrentUser() user: AuthenticatedUser,
    @Query('tenantId') tenantId?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ): Promise<DashboardAlarm[]> {
    return this.dashboardService.getAlarms(user, tenantId, limit);
  }

  /**
   * GET /dashboard/consumption
   * Returns daily consumption data for charts
   * Filtered by user's tenant access
   */
  @Get('consumption')
  async getConsumptionChart(
    @CurrentUser() user: AuthenticatedUser,
    @Query('tenantId') tenantId?: string,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days?: number,
  ): Promise<ConsumptionDataPoint[]> {
    return this.dashboardService.getConsumptionChart(user, tenantId, days);
  }
}
