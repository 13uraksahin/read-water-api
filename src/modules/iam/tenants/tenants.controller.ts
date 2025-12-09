// =============================================================================
// Tenants Controller
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
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto, TenantQueryDto } from './dto/tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser, Roles, RequirePermissions } from '../../../common/decorators';
import type { AuthenticatedUser } from '../../../common/interfaces';
import { SYSTEM_ROLES, PERMISSIONS } from '../../../common/constants';

@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.TENANT_CREATE)
  async create(
    @Body() dto: CreateTenantDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tenantsService.create(dto, user);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.TENANT_READ)
  async findAll(
    @Query() query: TenantQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tenantsService.findAll(query, user);
  }

  @Get('tree')
  @RequirePermissions(PERMISSIONS.TENANT_READ)
  async getTree(@CurrentUser() user: AuthenticatedUser) {
    return this.tenantsService.getTree(user);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.TENANT_READ)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tenantsService.findOne(id, user);
  }

  @Get(':id/stats')
  @RequirePermissions(PERMISSIONS.TENANT_READ)
  async getStats(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tenantsService.getStats(id, user);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.TENANT_UPDATE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tenantsService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(SYSTEM_ROLES.PLATFORM_ADMIN)
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tenantsService.delete(id, user);
  }
}

