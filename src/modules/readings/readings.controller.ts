// =============================================================================
// Readings Controller
// =============================================================================

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReadingsService, PaginatedReadings } from './readings.service';
import { JwtAuthGuard } from '../iam/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import type { AuthenticatedUser } from '../../common/interfaces';

@Controller('readings')
@UseGuards(JwtAuthGuard)
export class ReadingsController {
  constructor(private readonly readingsService: ReadingsService) {}

  @Get()
  async getReadings(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('meterId') meterId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('sourceDeviceId') sourceDeviceId?: string,
  ): Promise<PaginatedReadings> {
    return this.readingsService.getReadings({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      meterId,
      tenantId,
      sourceDeviceId,
    }, user);
  }
}
