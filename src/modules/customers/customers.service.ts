// =============================================================================
// Customers Service - Updated for Subscription Model
// =============================================================================
// Address is now on Subscription, not Customer
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
  details: Record<string, unknown>;
  metadata: Record<string, unknown> | null;
  tenant?: {
    id: string;
    name: string;
    path: string;
  };
  subscriptions?: Array<{
    id: string;
    subscriptionType: string;
    subscriptionGroup: string;
    address: Record<string, unknown>;
    isActive: boolean;
  }>;
  _count?: {
    subscriptions: number;
  };
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
   * Check if user has access to a specific tenant
   * Supports both hierarchical access AND direct tenant assignments for multi-tenant users
   */
  private async hasUserAccessToTenant(user: AuthenticatedUser, tenantPath: string, tenantId: string): Promise<boolean> {
    // Platform admin can access everything
    if (user.role === SYSTEM_ROLES.PLATFORM_ADMIN) {
      return true;
    }

    // Check hierarchical access (tenant is descendant or ancestor)
    if (tenantPath.startsWith(user.tenantPath) || user.tenantPath.startsWith(tenantPath)) {
      return true;
    }

    // Check for direct tenant assignment
    const directAssignment = await this.prisma.userTenant.findFirst({
      where: {
        userId: user.id,
        tenantId: tenantId,
      },
    });

    return !!directAssignment;
  }

  /**
   * Get the effective tenant path for filtering
   * Supports both hierarchical access AND direct tenant assignments for multi-tenant users
   */
  private async getEffectiveTenantPath(user: AuthenticatedUser, tenantId?: string): Promise<string | null> {
    // Platform admin can see everything
    if (user.role === SYSTEM_ROLES.PLATFORM_ADMIN) {
      if (tenantId) {
        const selectedTenant = await this.prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { path: true },
        });
        return selectedTenant?.path || null;
      }
      return null;
    }

    if (tenantId) {
      // Check if user has direct assignment to the requested tenant
      const userTenantAssignment = await this.prisma.userTenant.findFirst({
        where: {
          userId: user.id,
          tenantId: tenantId,
        },
        include: {
          tenant: {
            select: { path: true },
          },
        },
      });

      if (userTenantAssignment) {
        // User has direct assignment to this tenant - allow access
        return userTenantAssignment.tenant.path;
      }

      // Check hierarchical access (user's tenant path contains selected tenant)
      const selectedTenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { path: true },
      });

      if (selectedTenant && selectedTenant.path.startsWith(user.tenantPath)) {
        return selectedTenant.path;
      }

      // No access to requested tenant - fall back to user's primary tenant
      return user.tenantPath;
    }

    // No tenantId specified - use user's primary tenant path
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

    const effectivePath = await this.getEffectiveTenantPath(user, params.tenantId);
    
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
        {
          details: {
            path: ['tcIdNo'],
            string_contains: params.search,
          },
        },
        {
          details: {
            path: ['taxId'],
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
          subscriptions: {
            select: {
              id: true,
              subscriptionType: true,
              subscriptionGroup: true,
              address: true,
              isActive: true,
            },
          },
          _count: {
            select: {
              subscriptions: true,
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
        subscriptions: {
          include: {
            meters: {
              select: {
                id: true,
                serialNumber: true,
                status: true,
                lastReadingValue: true,
                lastReadingTime: true,
              },
            },
          },
        },
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    // CRITICAL: Check tenant access (hierarchical OR direct assignment)
    const hasAccess = await this.hasUserAccessToTenant(user, customer.tenant.path, customer.tenantId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this customer');
    }

    return this.mapCustomer(customer);
  }

  /**
   * Generate a unique customer number for a tenant
   */
  private async generateCustomerNumber(tenantId: string): Promise<string> {
    const count = await this.prisma.customer.count({
      where: { tenantId },
    });
    const timestamp = Date.now().toString(36).toUpperCase();
    return `C-${(count + 1).toString().padStart(6, '0')}-${timestamp}`;
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

    // CRITICAL: Check tenant access for creation (hierarchical OR direct assignment)
    const hasAccess = await this.hasUserAccessToTenant(user, tenant.path, tenant.id);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to create customers in this tenant');
    }

    // Generate unique customer number
    const customerNumber = dto.customerNumber || await this.generateCustomerNumber(dto.tenantId);

    const customer = await this.prisma.customer.create({
      data: {
        tenantId: dto.tenantId,
        customerNumber,
        customerType: dto.customerType as any,
        details: dto.details as any,
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
        subscriptions: {
          select: {
            id: true,
            subscriptionType: true,
            subscriptionGroup: true,
            address: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            subscriptions: true,
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

    // CRITICAL: Check tenant access for update (hierarchical OR direct assignment)
    const hasAccess = await this.hasUserAccessToTenant(user, existing.tenant.path, existing.tenantId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to update this customer');
    }

    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        ...(dto.customerType && { customerType: dto.customerType as any }),
        ...(dto.details && { details: dto.details as any }),
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
        subscriptions: {
          select: {
            id: true,
            subscriptionType: true,
            subscriptionGroup: true,
            address: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            subscriptions: true,
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
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    // CRITICAL: Check tenant access for delete (hierarchical OR direct assignment)
    const hasAccess = await this.hasUserAccessToTenant(user, existing.tenant.path, existing.tenantId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to delete this customer');
    }

    // Check for subscriptions
    if (existing._count.subscriptions > 0) {
      throw new ForbiddenException(
        `Cannot delete customer with ${existing._count.subscriptions} subscriptions. Delete subscriptions first.`
      );
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
      details: customer.details as Record<string, unknown>,
      metadata: customer.metadata as Record<string, unknown> | null,
      tenant: customer.tenant,
      subscriptions: customer.subscriptions,
      _count: customer._count,
    };
  }
}
