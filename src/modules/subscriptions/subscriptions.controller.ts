// =============================================================================
// Subscriptions Controller
// =============================================================================

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto, UpdateSubscriptionDto, SubscriptionQueryDto, BulkImportSubscriptionsDto, ExportSubscriptionsQueryDto } from './dto/subscription.dto';
import { CurrentUser } from '../../common/decorators';
import type { AuthenticatedUser } from '../../common/interfaces';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  async findAll(@Query() query: SubscriptionQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionsService.findAll(query, user);
  }

  // ==========================================================================
  // BULK OPERATIONS (must be before :id routes)
  // ==========================================================================

  /**
   * Export subscriptions with current filters (limited to 10,000 rows)
   */
  @Get('export')
  async exportSubscriptions(
    @Query() query: ExportSubscriptionsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.subscriptionsService.exportSubscriptions(query, user);
  }

  /**
   * Bulk import subscriptions from CSV data
   */
  @Post('bulk-import')
  async bulkImport(
    @Body() dto: BulkImportSubscriptionsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.subscriptionsService.bulkImport(dto, user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionsService.findOne(id, user);
  }

  @Post()
  async create(@Body() dto: CreateSubscriptionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionsService.create(dto, user);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.subscriptionsService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionsService.delete(id, user);
  }

  @Post(':id/link-meter/:meterId')
  async linkMeter(
    @Param('id') id: string,
    @Param('meterId') meterId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.subscriptionsService.linkMeter(id, meterId, user);
  }

  @Post(':id/unlink-meter/:meterId')
  async unlinkMeter(
    @Param('id') id: string,
    @Param('meterId') meterId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.subscriptionsService.unlinkMeter(id, meterId, user);
  }
}

