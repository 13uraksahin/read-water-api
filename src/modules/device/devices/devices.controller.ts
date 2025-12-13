// =============================================================================
// Devices Controller - Inventory Management for Communication Units
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
import { DevicesService } from './devices.service';
import {
  CreateDeviceDto,
  UpdateDeviceDto,
  DeviceQueryDto,
  BulkCreateDeviceDto,
} from './dto/device.dto';
import { JwtAuthGuard } from '../../iam/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../iam/auth/guards/permissions.guard';
import { CurrentUser, RequirePermissions } from '../../../common/decorators';
import type { AuthenticatedUser } from '../../../common/interfaces';
import { PERMISSIONS } from '../../../common/constants';

@Controller('devices')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.DEVICE_CREATE)
  async create(
    @Body() dto: CreateDeviceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.devicesService.create(dto, user);
  }

  @Post('bulk')
  @RequirePermissions(PERMISSIONS.DEVICE_CREATE)
  async bulkCreate(
    @Body() dto: BulkCreateDeviceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.devicesService.bulkCreate(dto, user);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.DEVICE_READ)
  async findAll(
    @Query() query: DeviceQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.devicesService.findAll(query, user);
  }

  /**
   * Get available devices for linking to a specific meter profile
   */
  @Get('available')
  @RequirePermissions(PERMISSIONS.DEVICE_READ)
  async findAvailable(
    @Query('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('meterProfileId', ParseUUIDPipe) meterProfileId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.devicesService.findAvailable(tenantId, meterProfileId, user);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.DEVICE_READ)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.devicesService.findOne(id, user);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.DEVICE_UPDATE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDeviceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.devicesService.update(id, dto, user);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.DEVICE_UPDATE)
  async patch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDeviceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.devicesService.update(id, dto, user);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.DEVICE_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.devicesService.delete(id, user);
  }
}
