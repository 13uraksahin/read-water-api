// =============================================================================
// Subscriptions Service
// =============================================================================
// The Subscription is the CENTRAL linking entity between Customer and Meter.
// Address is stored on Subscription, not on Customer or Meter.
// =============================================================================

import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { Prisma, Subscription } from '@prisma/client';
import { CreateSubscriptionDto, UpdateSubscriptionDto, SubscriptionQueryDto } from './dto/subscription.dto';
import { AuthenticatedUser, PaginatedResult } from '../../common/interfaces';
import { PAGINATION, SYSTEM_ROLES } from '../../common/constants';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

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
   * Get paginated subscriptions with tenant filtering
   */
  async findAll(query: SubscriptionQueryDto, user: AuthenticatedUser): Promise<PaginatedResult<Subscription>> {
    const page = query.page || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(query.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;

    const where: Prisma.SubscriptionWhereInput = {};

    // Get effective tenant path for filtering
    const effectivePath = await this.getEffectiveTenantPath(user, query.tenantId);
    
    if (effectivePath) {
      where.tenant = {
        path: {
          startsWith: effectivePath,
        },
      };
    }

    if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.subscriptionType) {
      where.subscriptionType = query.subscriptionType as any;
    }

    if (query.subscriptionGroup) {
      where.subscriptionGroup = query.subscriptionGroup as any;
    }

    // Search in address JSON field
    if (query.search) {
      where.OR = [
        {
          address: {
            path: ['city'],
            string_contains: query.search,
          },
        },
        {
          address: {
            path: ['district'],
            string_contains: query.search,
          },
        },
        {
          address: {
            path: ['neighborhood'],
            string_contains: query.search,
          },
        },
        {
          addressCode: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [total, subscriptions] = await Promise.all([
      this.prisma.subscription.count({ where }),
      this.prisma.subscription.findMany({
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
          customer: {
            select: {
              id: true,
              customerType: true,
              details: true,
            },
          },
          meters: {
            select: {
              id: true,
              serialNumber: true,
              status: true,
              lastReadingValue: true,
              lastReadingTime: true,
              activeDevice: {
                select: {
                  id: true,
                  serialNumber: true,
                  status: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: subscriptions,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Get a single subscription by ID with tenant access check
   */
  async findOne(id: string, user: AuthenticatedUser): Promise<Subscription> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            path: true,
          },
        },
        customer: true,
        meters: {
          include: {
            meterProfile: {
              select: {
                id: true,
                brand: true,
                modelCode: true,
                meterType: true,
              },
            },
            activeDevice: {
              include: {
                deviceProfile: {
                  select: {
                    id: true,
                    brand: true,
                    modelCode: true,
                    communicationTechnology: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    // CRITICAL: Check tenant access (hierarchical OR direct assignment)
    const hasAccess = await this.hasUserAccessToTenant(user, (subscription as any).tenant.path, subscription.tenantId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this subscription');
    }

    return subscription;
  }

  /**
   * Generate a unique subscription number for a tenant
   */
  private async generateSubscriptionNumber(tenantId: string): Promise<string> {
    const count = await this.prisma.subscription.count({
      where: { tenantId },
    });
    const timestamp = Date.now().toString(36).toUpperCase();
    return `S-${(count + 1).toString().padStart(6, '0')}-${timestamp}`;
  }

  /**
   * Create a new subscription with tenant access check
   */
  async create(dto: CreateSubscriptionDto, user: AuthenticatedUser): Promise<Subscription> {
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
      throw new ForbiddenException('You do not have access to create subscriptions in this tenant');
    }

    // Verify customer exists and belongs to tenant
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: dto.customerId,
        tenantId: dto.tenantId,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found or does not belong to this tenant');
    }

    // Generate unique subscription number
    const subscriptionNumber = dto.subscriptionNumber || await this.generateSubscriptionNumber(dto.tenantId);

    const subscription = await this.prisma.subscription.create({
      data: {
        tenantId: dto.tenantId,
        customerId: dto.customerId,
        subscriptionNumber,
        subscriptionType: dto.subscriptionType as any,
        subscriptionGroup: (dto.subscriptionGroup || 'NORMAL_CONSUMPTION') as any,
        address: dto.address as any,
        addressCode: dto.addressCode,
        latitude: dto.latitude,
        longitude: dto.longitude,
        isActive: dto.isActive ?? true,
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
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
        customer: {
          select: {
            id: true,
            customerType: true,
            details: true,
          },
        },
      },
    });

    this.logger.log(`Created subscription in tenant ${tenant.name}`);
    return subscription;
  }

  /**
   * Update a subscription with tenant access check
   */
  async update(id: string, dto: UpdateSubscriptionDto, user: AuthenticatedUser): Promise<Subscription> {
    const existing = await this.findOne(id, user);

    const subscription = await this.prisma.subscription.update({
      where: { id },
      data: {
        ...(dto.subscriptionType && { subscriptionType: dto.subscriptionType as any }),
        ...(dto.subscriptionGroup && { subscriptionGroup: dto.subscriptionGroup as any }),
        ...(dto.address && { address: dto.address as any }),
        ...(dto.addressCode !== undefined && { addressCode: dto.addressCode }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.endDate !== undefined && { endDate: dto.endDate ? new Date(dto.endDate) : null }),
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
        customer: {
          select: {
            id: true,
            customerType: true,
            details: true,
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

    return subscription;
  }

  /**
   * Delete a subscription with tenant access check
   */
  async delete(id: string, user: AuthenticatedUser): Promise<void> {
    const existing = await this.findOne(id, user);

    // Check if subscription has active meters
    const meterCount = await this.prisma.meter.count({
      where: { subscriptionId: id },
    });

    if (meterCount > 0) {
      throw new ForbiddenException(
        `Cannot delete subscription with ${meterCount} linked meters. Unlink meters first.`
      );
    }

    await this.prisma.subscription.delete({ where: { id } });
    this.logger.log(`Deleted subscription ${id}`);
  }

  /**
   * Link a meter to a subscription
   */
  async linkMeter(subscriptionId: string, meterId: string, user: AuthenticatedUser): Promise<Subscription> {
    const subscription = await this.findOne(subscriptionId, user);

    // Verify meter exists and belongs to same tenant
    const meter = await this.prisma.meter.findFirst({
      where: {
        id: meterId,
        tenantId: subscription.tenantId,
      },
    });

    if (!meter) {
      throw new NotFoundException('Meter not found or does not belong to this tenant');
    }

    // Check if meter is already linked to another subscription
    if (meter.subscriptionId && meter.subscriptionId !== subscriptionId) {
      throw new ForbiddenException('Meter is already linked to another subscription');
    }

    await this.prisma.meter.update({
      where: { id: meterId },
      data: { subscriptionId },
    });

    return this.findOne(subscriptionId, user);
  }

  /**
   * Unlink a meter from a subscription
   */
  async unlinkMeter(subscriptionId: string, meterId: string, user: AuthenticatedUser): Promise<Subscription> {
    const subscription = await this.findOne(subscriptionId, user);

    // Verify meter belongs to this subscription
    const meter = await this.prisma.meter.findFirst({
      where: {
        id: meterId,
        subscriptionId,
      },
    });

    if (!meter) {
      throw new NotFoundException('Meter not found or not linked to this subscription');
    }

    await this.prisma.meter.update({
      where: { id: meterId },
      data: { subscriptionId: null },
    });

    return this.findOne(subscriptionId, user);
  }
}

