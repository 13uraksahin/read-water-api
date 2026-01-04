// =============================================================================
// Module Profiles Controller
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
import { ModuleProfilesService, DecoderData } from './module-profiles.service';
import {
  CreateModuleProfileDto,
  UpdateModuleProfileDto,
  ModuleProfileQueryDto,
} from './dto/module-profile.dto';
import { JwtAuthGuard } from '../../iam/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../iam/auth/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators';
import { PERMISSIONS } from '../../../common/constants';

@Controller('module-profiles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ModuleProfilesController {
  constructor(private readonly moduleProfilesService: ModuleProfilesService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.PROFILE_CREATE)
  async create(@Body() dto: CreateModuleProfileDto) {
    return this.moduleProfilesService.create(dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.PROFILE_READ)
  async findAll(@Query() query: ModuleProfileQueryDto) {
    return this.moduleProfilesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PROFILE_READ)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.moduleProfilesService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.PROFILE_UPDATE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateModuleProfileDto,
  ) {
    return this.moduleProfilesService.update(id, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.PROFILE_UPDATE)
  async patch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateModuleProfileDto,
  ) {
    return this.moduleProfilesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.PROFILE_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.moduleProfilesService.delete(id);
  }

  @Post(':id/test-decoder')
  @RequirePermissions(PERMISSIONS.PROFILE_UPDATE)
  async testDecoder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('payload') payload?: string,
  ) {
    return this.moduleProfilesService.testDecoder(id, payload);
  }
}

// =============================================================================
// Decoders Controller (Read-Only)
// Merged from legacy decoders module - provides a read-only view of decoders
// that are stored in ModuleProfile entities
// =============================================================================

@Controller('decoders')
@UseGuards(JwtAuthGuard)
export class DecodersController {
  constructor(private readonly moduleProfilesService: ModuleProfilesService) {}

  @Get()
  async getDecoders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('technology') technology?: string,
    @Query('brand') brand?: string,
  ) {
    return this.moduleProfilesService.getDecoders({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      technology,
      brand,
    });
  }

  @Get(':id')
  async getDecoder(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DecoderData | null> {
    return this.moduleProfilesService.getDecoder(id);
  }
}

// Export as DeviceProfilesController for backward compatibility
export { ModuleProfilesController as DeviceProfilesController };
