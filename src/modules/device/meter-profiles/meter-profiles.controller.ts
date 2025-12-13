// =============================================================================
// Meter Profiles Controller
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
import { MeterProfilesService } from './meter-profiles.service';
import { CreateMeterProfileDto, UpdateMeterProfileDto, MeterProfileQueryDto } from './dto/meter-profile.dto';
import { JwtAuthGuard } from '../../iam/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../iam/auth/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators';
import { PERMISSIONS } from '../../../common/constants';

@Controller('profiles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MeterProfilesController {
  constructor(private readonly meterProfilesService: MeterProfilesService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.PROFILE_CREATE)
  async create(@Body() dto: CreateMeterProfileDto) {
    return this.meterProfilesService.create(dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.PROFILE_READ)
  async findAll(@Query() query: MeterProfileQueryDto) {
    return this.meterProfilesService.findAll(query);
  }

  @Get('communication-tech-fields')
  @RequirePermissions(PERMISSIONS.PROFILE_READ)
  async getCommunicationTechFields() {
    return this.meterProfilesService.getCommunicationTechFields();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PROFILE_READ)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.meterProfilesService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.PROFILE_UPDATE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMeterProfileDto,
  ) {
    return this.meterProfilesService.update(id, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.PROFILE_UPDATE)
  async patch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMeterProfileDto,
  ) {
    return this.meterProfilesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.PROFILE_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.meterProfilesService.delete(id);
  }
}

