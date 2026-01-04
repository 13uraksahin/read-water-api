// =============================================================================
// Modules Controller - Communication Modules Management
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
import { ModulesService } from './modules.service';
import {
  CreateModuleDto,
  UpdateModuleDto,
  ModuleQueryDto,
  BulkCreateModuleDto,
  BulkImportModulesDto,
  ExportModulesQueryDto,
} from './dto/module.dto';
import { JwtAuthGuard } from '../../iam/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../iam/auth/guards/permissions.guard';
import { CurrentUser, RequirePermissions } from '../../../common/decorators';
import type { AuthenticatedUser } from '../../../common/interfaces';
import { PERMISSIONS } from '../../../common/constants';

@Controller('modules')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.MODULE_CREATE)
  async create(
    @Body() dto: CreateModuleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.modulesService.create(dto, user);
  }

  @Post('bulk')
  @RequirePermissions(PERMISSIONS.MODULE_CREATE)
  async bulkCreate(
    @Body() dto: BulkCreateModuleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.modulesService.bulkCreate(dto, user);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.MODULE_READ)
  async findAll(
    @Query() query: ModuleQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.modulesService.findAll(query, user);
  }

  /**
   * Get available modules for linking to a specific meter profile
   */
  @Get('available')
  @RequirePermissions(PERMISSIONS.MODULE_READ)
  async findAvailable(
    @Query('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('meterProfileId', ParseUUIDPipe) meterProfileId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.modulesService.findAvailable(tenantId, meterProfileId, user);
  }

  // ==========================================================================
  // BULK OPERATIONS (must be before :id routes)
  // ==========================================================================

  /**
   * Export modules with current filters (limited to 10,000 rows)
   */
  @Get('export')
  @RequirePermissions(PERMISSIONS.MODULE_READ)
  async exportModules(
    @Query() query: ExportModulesQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.modulesService.exportModules(query, user);
  }

  /**
   * Bulk import modules from CSV data
   */
  @Post('bulk-import')
  @RequirePermissions(PERMISSIONS.MODULE_CREATE)
  async bulkImport(
    @Body() dto: BulkImportModulesDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.modulesService.bulkImport(dto, user);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.MODULE_READ)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.modulesService.findOne(id, user);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.MODULE_UPDATE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateModuleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.modulesService.update(id, dto, user);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.MODULE_UPDATE)
  async patch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateModuleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.modulesService.update(id, dto, user);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.MODULE_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.modulesService.delete(id, user);
  }
}

// Export as DevicesController for backward compatibility
export { ModulesController as DevicesController };
