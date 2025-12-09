// =============================================================================
// Alarms Controller
// =============================================================================

import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AlarmsService } from './alarms.service';
import type { PaginatedAlarms, AlarmData } from './alarms.service';
import { JwtAuthGuard } from '../iam/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import type { AuthenticatedUser } from '../../common/interfaces';

@Controller('alarms')
@UseGuards(JwtAuthGuard)
export class AlarmsController {
  constructor(private readonly alarmsService: AlarmsService) {}

  @Get()
  async getAlarms(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('tenantId') tenantId?: string,
    @Query('meterId') meterId?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('severity') severity?: string,
  ): Promise<PaginatedAlarms> {
    return this.alarmsService.getAlarms({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      tenantId,
      meterId,
      status,
      type,
      severity: severity ? parseInt(severity, 10) : undefined,
    });
  }

  @Get(':id')
  async getAlarm(@Param('id', ParseUUIDPipe) id: string): Promise<AlarmData> {
    return this.alarmsService.getAlarm(id);
  }

  @Post(':id/acknowledge')
  async acknowledgeAlarm(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AlarmData> {
    return this.alarmsService.acknowledgeAlarm(id, user.id);
  }

  @Post(':id/resolve')
  async resolveAlarm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('resolution') resolution: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AlarmData> {
    return this.alarmsService.resolveAlarm(id, user.id, resolution);
  }
}
