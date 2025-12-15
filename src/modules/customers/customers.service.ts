// =============================================================================
// Customers Service
// =============================================================================

import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { AuthenticatedUser } from '../../common/interfaces';
import { SYSTEM_ROLES } from '../../common/constants';

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
  tenant?: {
    id: string;
    name: string;
    path: string;
  };
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
   * Get the effective tenant path for filtering
   * - If tenantId is provided, use that tenant's path (after access check)
   * - Otherwise, use user's tenant path (platform admin gets null = no filter)
   */
  private async getEffectiveTenantPath(user: AuthenticatedUser, tenantId?: string): Promise<string | null> {
    // If specific tenant selected, look up its path
    if (tenantId) {
      const selectedTenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { path: true },
      });

      if (!selectedTenant) {
        return user.tenantPath; // Fallback to user's tenant
      }

      // For non-admin users, verify they have access to the selected tenant
      if (user.role !== SYSTEM_ROLES.PLATFORM_ADMIN) {
        if (!selectedTenant.path.startsWith(user.tenantPath)) {
          return user.tenantPath; // No access, fallback to user's tenant
        }
      }

      return selectedTenant.path;
    }

    // No tenant selected - Platform admin sees all, others see their hierarchy
    if (user.role === SYSTEM_ROLES.PLATFORM_ADMIN) {
      return null; // No filter for platform admin without tenant selection
    }

    return user.tenantPath;
  }

  /**
   * Get paginated customers with tenant filtering
   */
  async getCustomers(params: CustomersQueryParams, user: AuthenticatedUser): Promise<PaginatedCustomers> {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 30, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {};

    // Get effective tenant path for filtering
    const effectivePath = await this.getEffectiveTenantPath(user, params.tenantId);
    
    // Apply tenant filter based on effective path
    if (effectivePath) {
      where.tenant = {
        path: {
          startsWith: effectivePath,
        },
      };
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
          tenant: {
            select: {
              id: true,
              name: true,
              path: true,
            },
          },
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
   * Get a single customer by ID with tenant access check
   */
  async getCustomer(id: string, user: AuthenticatedUser): Promise<CustomerData> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            path: true,
          },
        },
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

    // CRITICAL: Check tenant access
    if (user.role !== SYSTEM_ROLES.PLATFORM_ADMIN) {
      if (!customer.tenant.path.startsWith(user.tenantPath)) {
        throw new ForbiddenException('You do not have access to this customer');
      }
    }

    return this.mapCustomer(customer);
  }

  /**
   * Create a new customer with tenant access check
   */
  async createCustomer(dto: CreateCustomerDto, user: AuthenticatedUser): Promise<CustomerData> {
    // Verify tenant access
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: dto.tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // CRITICAL: Check tenant access for creation
    if (user.role !== SYSTEM_ROLES.PLATFORM_ADMIN) {
      if (!tenant.path.startsWith(user.tenantPath)) {
        throw new ForbiddenException('You do not have access to create customers in this tenant');
      }
    }

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
        tenant: {
          select: {
            id: true,
            name: true,
            path: true,
          },
        },
        meters: {
          select: {
            id: true,
            serialNumber: true,
            status: true,
          },
        },
      },
    });

    this.logger.log(`Created customer in tenant ${tenant.name}`);
    return this.mapCustomer(customer);
  }

  /**
   * Update a customer with tenant access check
   */
  async updateCustomer(id: string, dto: UpdateCustomerDto, user: AuthenticatedUser): Promise<CustomerData> {
    const existing = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        tenant: {
          select: { id: true, name: true, path: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    // CRITICAL: Check tenant access for update
    if (user.role !== SYSTEM_ROLES.PLATFORM_ADMIN) {
      if (!existing.tenant.path.startsWith(user.tenantPath)) {
        throw new ForbiddenException('You do not have access to update this customer');
      }
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
        tenant: {
          select: {
            id: true,
            name: true,
            path: true,
          },
        },
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
   * Delete a customer with tenant access check
   */
  async deleteCustomer(id: string, user: AuthenticatedUser): Promise<void> {
    const existing = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        tenant: {
          select: { id: true, name: true, path: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    // CRITICAL: Check tenant access for delete
    if (user.role !== SYSTEM_ROLES.PLATFORM_ADMIN) {
      if (!existing.tenant.path.startsWith(user.tenantPath)) {
        throw new ForbiddenException('You do not have access to delete this customer');
      }
    }

    await this.prisma.customer.delete({ where: { id } });
    this.logger.log(`Deleted customer ${id} from tenant ${existing.tenant.name}`);
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
      tenant: customer.tenant,
      meters: customer.meters,
    };
  }
}
