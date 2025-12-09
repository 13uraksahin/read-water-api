// =============================================================================
// Customers Controller
// =============================================================================

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import type { PaginatedCustomers, CustomerData } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { JwtAuthGuard } from '../iam/auth/guards/jwt-auth.guard';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async getCustomers(
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
    });
  }

  @Get(':id')
  async getCustomer(@Param('id') id: string): Promise<CustomerData> {
    return this.customersService.getCustomer(id);
  }

  @Post()
  async createCustomer(@Body() dto: CreateCustomerDto): Promise<CustomerData> {
    return this.customersService.createCustomer(dto);
  }

  @Put(':id')
  async updateCustomer(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ): Promise<CustomerData> {
    return this.customersService.updateCustomer(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCustomer(@Param('id') id: string): Promise<void> {
    return this.customersService.deleteCustomer(id);
  }
}
