// =============================================================================
// Meters Controller - Refactored for Asset/Device Split
// =============================================================================
// Added: Link/Unlink device endpoints
// =============================================================================

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MetersService } from './meters.service';
import {
  CreateMeterDto,
  UpdateMeterDto,
  MeterQueryDto,
  ControlValveDto,
  LinkDeviceDto,
  UnlinkDeviceDto,
  LinkSubscriptionDto,
} from './dto/meter.dto';
import { JwtAuthGuard } from '../../iam/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../iam/auth/guards/permissions.guard';
import { CurrentUser, RequirePermissions } from '../../../common/decorators';
import type { AuthenticatedUser } from '../../../common/interfaces';
import { PERMISSIONS } from '../../../common/constants';

@Controller('meters')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MetersController {
  constructor(private readonly metersService: MetersService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.METER_CREATE)
  async create(
    @Body() dto: CreateMeterDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.metersService.create(dto, user);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.METER_READ)
  async findAll(
    @Query() query: MeterQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.metersService.findAll(query, user);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.METER_READ)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.metersService.findOne(id, user);
  }

  @Get(':id/readings')
  @RequirePermissions(PERMISSIONS.READING_READ)
  async getReadingHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('days') days: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.metersService.getReadingHistory(id, user, days || 30);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.METER_UPDATE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMeterDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.metersService.update(id, dto, user);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.METER_UPDATE)
  async patch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMeterDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.metersService.update(id, dto, user);
  }

  // ==========================================================================
  // SUBSCRIPTION LINK/UNLINK ENDPOINTS
  // ==========================================================================

  /**
   * Link a meter to a subscription
   */
  @Post(':id/link-subscription')
  @RequirePermissions(PERMISSIONS.METER_UPDATE)
  async linkSubscription(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LinkSubscriptionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.metersService.linkSubscription(id, dto, user);
  }

  /**
   * Unlink a meter from its subscription
   */
  @Post(':id/unlink-subscription')
  @RequirePermissions(PERMISSIONS.METER_UPDATE)
  async unlinkSubscription(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.metersService.unlinkSubscription(id, user);
  }

  // ==========================================================================
  // DEVICE LINK/UNLINK ENDPOINTS
  // ==========================================================================

  /**
   * Link a device to a meter
   * Device must be in WAREHOUSE status
   */
  @Post(':id/link-device')
  @RequirePermissions(PERMISSIONS.METER_UPDATE)
  async linkDevice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LinkDeviceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.metersService.linkDevice(id, dto, user);
  }

  /**
   * Unlink a device from a meter
   * Device status will be set to WAREHOUSE or MAINTENANCE
   */
  @Post(':id/unlink-device')
  @RequirePermissions(PERMISSIONS.METER_UPDATE)
  async unlinkDevice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UnlinkDeviceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.metersService.unlinkDevice(id, dto, user);
  }

  // ==========================================================================
  // VALVE CONTROL
  // ==========================================================================

  @Post(':id/valve')
  @RequirePermissions(PERMISSIONS.VALVE_CONTROL)
  async controlValve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ControlValveDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.metersService.controlValve(id, dto, user);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.METER_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.metersService.delete(id, user);
  }
}
