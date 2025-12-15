// =============================================================================
// Customers Controller
// =============================================================================

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import type { PaginatedCustomers, CustomerData } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { JwtAuthGuard } from '../iam/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import type { AuthenticatedUser } from '../../common/interfaces';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async getCustomers(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('tenantId') tenantId?: string,
    @Query('customerType') customerType?: string,
    @Query('search') search?: string,
  ): Promise<PaginatedCustomers> {
    return this.customersService.getCustomers({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      tenantId,
      customerType,
      search,
    }, user);
  }

  @Get(':id')
  async getCustomer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CustomerData> {
    return this.customersService.getCustomer(id, user);
  }

  @Post()
  async createCustomer(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCustomerDto,
  ): Promise<CustomerData> {
    return this.customersService.createCustomer(dto, user);
  }

  @Put(':id')
  async updateCustomer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ): Promise<CustomerData> {
    return this.customersService.updateCustomer(id, dto, user);
  }

  @Patch(':id')
  async patchCustomer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ): Promise<CustomerData> {
    return this.customersService.updateCustomer(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCustomer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.customersService.deleteCustomer(id, user);
  }
}
