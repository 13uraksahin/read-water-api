// =============================================================================
// Customers Service
// =============================================================================

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

export interface CustomerData {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
  customerType: string;
  consumptionType: string;
  details: Record<string, unknown>;
  address: Record<string, unknown>;
  addressCode: string | null;
  latitude: number | null;
  longitude: number | null;
  metadata: Record<string, unknown> | null;
  meters?: Array<{
    id: string;
    serialNumber: string;
    status: string;
  }>;
}

export interface PaginatedCustomers {
  data: CustomerData[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CustomersQueryParams {
  page?: number;
  limit?: number;
  tenantId?: string;
  customerType?: string;
  search?: string;
}

export { CreateCustomerDto, UpdateCustomerDto };

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get paginated customers
   */
  async getCustomers(params: CustomersQueryParams): Promise<PaginatedCustomers> {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 30, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {};

    if (params.tenantId) {
      where.tenantId = params.tenantId;
    }

    if (params.customerType) {
      where.customerType = params.customerType as any;
    }

    // Search in details JSON field
    if (params.search) {
      where.OR = [
        {
          details: {
            path: ['firstName'],
            string_contains: params.search,
          },
        },
        {
          details: {
            path: ['lastName'],
            string_contains: params.search,
          },
        },
        {
          details: {
            path: ['organizationName'],
            string_contains: params.search,
          },
        },
      ];
    }

    const [total, customers] = await Promise.all([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          meters: {
            select: {
              id: true,
              serialNumber: true,
              status: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: customers.map((c) => this.mapCustomer(c)),
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get a single customer by ID
   */
  async getCustomer(id: string): Promise<CustomerData> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        meters: {
          select: {
            id: true,
            serialNumber: true,
            status: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return this.mapCustomer(customer);
  }

  /**
   * Create a new customer
   */
  async createCustomer(dto: CreateCustomerDto): Promise<CustomerData> {
    const customer = await this.prisma.customer.create({
      data: {
        tenantId: dto.tenantId,
        customerType: dto.customerType as any,
        consumptionType: (dto.consumptionType || 'NORMAL') as any,
        details: dto.details as any,
        address: dto.address as any,
        addressCode: dto.addressCode,
        latitude: dto.latitude,
        longitude: dto.longitude,
        metadata: dto.metadata as any,
      },
      include: {
        meters: {
          select: {
            id: true,
            serialNumber: true,
            status: true,
          },
        },
      },
    });

    return this.mapCustomer(customer);
  }

  /**
   * Update a customer
   */
  async updateCustomer(id: string, dto: UpdateCustomerDto): Promise<CustomerData> {
    const existing = await this.prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        ...(dto.customerType && { customerType: dto.customerType as any }),
        ...(dto.consumptionType && { consumptionType: dto.consumptionType as any }),
        ...(dto.details && { details: dto.details as any }),
        ...(dto.address && { address: dto.address as any }),
        ...(dto.addressCode !== undefined && { addressCode: dto.addressCode }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
        ...(dto.metadata !== undefined && { metadata: dto.metadata as any }),
      },
      include: {
        meters: {
          select: {
            id: true,
            serialNumber: true,
            status: true,
          },
        },
      },
    });

    return this.mapCustomer(customer);
  }

  /**
   * Delete a customer
   */
  async deleteCustomer(id: string): Promise<void> {
    const existing = await this.prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    await this.prisma.customer.delete({ where: { id } });
  }

  private mapCustomer(customer: any): CustomerData {
    return {
      id: customer.id,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      tenantId: customer.tenantId,
      customerType: customer.customerType,
      consumptionType: customer.consumptionType,
      details: customer.details as Record<string, unknown>,
      address: customer.address as Record<string, unknown>,
      addressCode: customer.addressCode,
      latitude: customer.latitude ? Number(customer.latitude) : null,
      longitude: customer.longitude ? Number(customer.longitude) : null,
      metadata: customer.metadata as Record<string, unknown> | null,
      meters: customer.meters,
    };
  }
}
