// =============================================================================
// Users Controller
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
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, AssignTenantDto, UserQueryDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser, RequirePermissions } from '../../../common/decorators';
import type { AuthenticatedUser } from '../../../common/interfaces';
import { PERMISSIONS } from '../../../common/constants';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.USER_CREATE)
  async create(
    @Body() dto: CreateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.create(dto, user);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.USER_READ)
  async findAll(
    @Query() query: UserQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.findAll(query, user);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.USER_READ)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.findOne(id, user);
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.USER_UPDATE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.update(id, dto, user);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.USER_UPDATE)
  async patch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.update(id, dto, user);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.USER_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.usersService.delete(id, user);
  }

  @Post(':id/tenants')
  @RequirePermissions(PERMISSIONS.USER_UPDATE)
  async assignTenant(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() dto: AssignTenantDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.assignTenant(userId, dto, user);
  }

  @Delete(':id/tenants/:tenantId')
  @RequirePermissions(PERMISSIONS.USER_UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeTenant(
    @Param('id', ParseUUIDPipe) userId: string,
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.usersService.removeTenant(userId, tenantId, user);
  }
}

