// =============================================================================
// Device Profiles Controller
// =============================================================================

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DeviceProfilesService } from './device-profiles.service';
import {
  CreateDeviceProfileDto,
  UpdateDeviceProfileDto,
  DeviceProfileQueryDto,
} from './dto/device-profile.dto';
import { JwtAuthGuard } from '../../iam/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../iam/auth/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators';
import { PERMISSIONS } from '../../../common/constants';

@Controller('device-profiles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DeviceProfilesController {
  constructor(private readonly deviceProfilesService: DeviceProfilesService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.PROFILE_CREATE)
  async create(@Body() dto: CreateDeviceProfileDto) {
    return this.deviceProfilesService.create(dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.PROFILE_READ)
  async findAll(@Query() query: DeviceProfileQueryDto) {
    return this.deviceProfilesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PROFILE_READ)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.deviceProfilesService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.PROFILE_UPDATE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDeviceProfileDto,
  ) {
    return this.deviceProfilesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.PROFILE_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.deviceProfilesService.delete(id);
  }

  @Post(':id/test-decoder')
  @RequirePermissions(PERMISSIONS.PROFILE_UPDATE)
  async testDecoder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('payload') payload?: string,
  ) {
    return this.deviceProfilesService.testDecoder(id, payload);
  }
}
