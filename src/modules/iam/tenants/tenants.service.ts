// =============================================================================
// Tenants Service - Hierarchical Multi-Tenancy with ltree
// =============================================================================

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { KyselyService } from '../../../core/kysely/kysely.service';
import { CreateTenantDto, UpdateTenantDto, TenantQueryDto } from './dto/tenant.dto';
import { AuthenticatedUser, PaginatedResult } from '../../../common/interfaces';
import { PAGINATION, SYSTEM_ROLES } from '../../../common/constants';
import { Tenant } from '@prisma/client';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kysely: KyselyService,
  ) {}

  /**
   * Create a new tenant with ltree path
   */
  async create(dto: CreateTenantDto, user: AuthenticatedUser): Promise<Tenant> {
    // Only Platform Admin can create root-level tenants
    if (!dto.parentId && user.role !== SYSTEM_ROLES.PLATFORM_ADMIN) {
      throw new ForbiddenException('Only Platform Admin can create root-level tenants');
    }

    let parentPath = '';

    if (dto.parentId) {
      // Verify parent tenant exists and user has access
      const parent = await this.prisma.tenant.findUnique({
        where: { id: dto.parentId },
      });

      if (!parent) {
        throw new NotFoundException('Parent tenant not found');
      }

      // Check if user has access to parent tenant
      const hasAccess = await this.hasAccessToTenant(user, parent.path, parent.id);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this parent tenant');
      }

      parentPath = parent.path;
    }

    // Generate path: sanitize name for ltree compatibility
    const sanitizedName = this.sanitizeForLtree(dto.name);
    const path = parentPath ? `${parentPath}.${sanitizedName}` : sanitizedName;

    // Check if path already exists
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { path },
    });

    if (existingTenant) {
      throw new BadRequestException('A tenant with this name already exists at this level');
    }

    // Create tenant
    const tenant = await this.prisma.tenant.create({
      data: {
        path,
        name: dto.name,
        parentId: dto.parentId,
        contactFirstName: dto.contactFirstName,
        contactLastName: dto.contactLastName,
        contactPhone: dto.contactPhone,
        contactEmail: dto.contactEmail,
        taxId: dto.taxId,
        taxOffice: dto.taxOffice,
        address: dto.address as any,
        latitude: dto.latitude,
        longitude: dto.longitude,
        tenantSubscriptionStatus: dto.tenantSubscriptionStatus,
        subscriptionPlan: dto.subscriptionPlan,
        settings: dto.settings as any,
        allowedProfiles: dto.allowedProfileIds
          ? {
              connect: dto.allowedProfileIds.map((id) => ({ id })),
            }
          : undefined,
        allowedDeviceProfiles: dto.allowedDeviceProfileIds
          ? {
              connect: dto.allowedDeviceProfileIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        parent: true,
        allowedProfiles: true,
        allowedDeviceProfiles: true,
        _count: {
          select: {
            users: true,
            meters: true,
            children: true,
          },
        },
      },
    });

    this.logger.log(`Created tenant: ${tenant.name} (${tenant.path})`);
    return tenant;
  }

  /**
   * Get all tenants (with ltree-based filtering)
   * Supports both hierarchical access AND direct tenant assignments for multi-tenant users
   */
  async findAll(
    query: TenantQueryDto,
    user: AuthenticatedUser,
  ): Promise<PaginatedResult<Tenant>> {
    const page = query.page || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(query.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;

    // Build where clause based on user's tenant access
    let whereClause: any = {};

    // Non-platform admins can see their tenant hierarchy AND direct assignments
    if (user.role !== SYSTEM_ROLES.PLATFORM_ADMIN) {
      // Get all tenant IDs the user has direct assignments to
      const userTenantAssignments = await this.prisma.userTenant.findMany({
        where: { userId: user.id },
        select: { tenantId: true, tenant: { select: { path: true } } },
      });

      // Get all paths from user assignments
      const assignedTenantIds = userTenantAssignments.map(ut => ut.tenantId);
      const assignedPaths = userTenantAssignments.map(ut => ut.tenant.path);

      // User can see:
      // 1. Tenants they have direct assignment to
      // 2. Descendants of their primary tenant (hierarchical access)
      whereClause.OR = [
        // Direct tenant assignments
        { id: { in: assignedTenantIds } },
        // Hierarchical access (descendants of primary tenant)
        { path: { startsWith: user.tenantPath } },
        // Children of directly assigned tenants
        ...assignedPaths.map(path => ({ path: { startsWith: path } })),
      ];
    }

    // Apply additional filters
    const additionalFilters: any = {};

    if (query.search) {
      additionalFilters.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { contactEmail: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.tenantSubscriptionStatus) {
      additionalFilters.tenantSubscriptionStatus = query.tenantSubscriptionStatus;
    }

    if (query.parentId) {
      additionalFilters.parentId = query.parentId;
    }

    // Combine base access filter with additional filters
    const finalWhereClause = whereClause.OR 
      ? { AND: [whereClause, additionalFilters] }
      : { ...whereClause, ...additionalFilters };

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where: finalWhereClause,
        skip,
        take: limit,
        orderBy: {
          [query.sortBy || 'name']: query.sortOrder || 'asc',
        },
        include: {
          parent: {
            select: { id: true, name: true, path: true },
          },
          _count: {
            select: {
              users: true,
              meters: true,
              children: true,
              customers: true,
            },
          },
        },
      }),
      this.prisma.tenant.count({ where: finalWhereClause }),
    ]);

    return {
      data: tenants,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Get tenant tree structure
   */
  async getTree(user: AuthenticatedUser): Promise<any[]> {
    const basePath = user.role === SYSTEM_ROLES.PLATFORM_ADMIN ? '' : user.tenantPath;

    // Use Kysely for ltree query
    const descendants = await this.kysely.getDescendantTenants(basePath || 'Root');

    // Build tree structure
    const tenantMap = new Map<string, any>();
    const roots: any[] = [];

    // First pass: create all nodes
    for (const tenant of descendants) {
      tenantMap.set(tenant.path, {
        ...tenant,
        children: [],
      });
    }

    // Second pass: build tree
    for (const tenant of descendants) {
      const node = tenantMap.get(tenant.path);
      const pathParts = tenant.path.split('.');
      
      if (pathParts.length === 1 || (basePath && tenant.path === basePath)) {
        roots.push(node);
      } else {
        const parentPath = pathParts.slice(0, -1).join('.');
        const parent = tenantMap.get(parentPath);
        if (parent) {
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      }
    }

    return roots;
  }

  /**
   * Get single tenant by ID
   */
  async findOne(id: string, user: AuthenticatedUser): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        parent: {
          select: { id: true, name: true, path: true },
        },
        children: {
          select: { id: true, name: true, path: true },
        },
        allowedProfiles: true,
        allowedDeviceProfiles: true,
        users: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            meters: true,
            customers: true,
            alarms: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check access (hierarchical OR direct assignment)
    const hasAccess = await this.hasAccessToTenant(user, tenant.path, tenant.id);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this tenant');
    }

    return tenant;
  }

  /**
   * Update tenant
   */
  async update(
    id: string,
    dto: UpdateTenantDto,
    user: AuthenticatedUser,
  ): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check access (hierarchical OR direct assignment)
    const hasAccess = await this.hasAccessToTenant(user, tenant.path, tenant.id);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this tenant');
    }

    // Update tenant
    const updated = await this.prisma.tenant.update({
      where: { id },
      data: {
        name: dto.name,
        contactFirstName: dto.contactFirstName,
        contactLastName: dto.contactLastName,
        contactPhone: dto.contactPhone,
        contactEmail: dto.contactEmail,
        taxId: dto.taxId,
        taxOffice: dto.taxOffice,
        address: dto.address as any,
        latitude: dto.latitude,
        longitude: dto.longitude,
        tenantSubscriptionStatus: dto.tenantSubscriptionStatus,
        subscriptionPlan: dto.subscriptionPlan,
        settings: dto.settings as any,
        allowedProfiles: dto.allowedProfileIds
          ? {
              set: dto.allowedProfileIds.map((profileId) => ({ id: profileId })),
            }
          : undefined,
        allowedDeviceProfiles: dto.allowedDeviceProfileIds
          ? {
              set: dto.allowedDeviceProfileIds.map((profileId) => ({ id: profileId })),
            }
          : undefined,
      },
      include: {
        parent: true,
        allowedProfiles: true,
        allowedDeviceProfiles: true,
        _count: {
          select: {
            users: true,
            meters: true,
            children: true,
          },
        },
      },
    });

    this.logger.log(`Updated tenant: ${updated.name} (${updated.path})`);
    return updated;
  }

  /**
   * Delete tenant (only if no children or data)
   */
  async delete(id: string, user: AuthenticatedUser): Promise<void> {
    // Only Platform Admin can delete tenants
    if (user.role !== SYSTEM_ROLES.PLATFORM_ADMIN) {
      throw new ForbiddenException('Only Platform Admin can delete tenants');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            children: true,
            meters: true,
            customers: true,
            users: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Cannot delete if has children or data
    if (
      tenant._count.children > 0 ||
      tenant._count.meters > 0 ||
      tenant._count.customers > 0
    ) {
      throw new BadRequestException(
        'Cannot delete tenant with child tenants, meters, or customers. Please remove them first.',
      );
    }

    // Delete user assignments first
    await this.prisma.userTenant.deleteMany({
      where: { tenantId: id },
    });

    // Delete tenant
    await this.prisma.tenant.delete({
      where: { id },
    });

    this.logger.log(`Deleted tenant: ${tenant.name} (${tenant.path})`);
  }

  /**
   * Get tenant statistics
   */
  async getStats(id: string, user: AuthenticatedUser) {
    const tenant = await this.findOne(id, user);

    // Get stats using Kysely for descendant aggregation
    const descendants = await this.kysely.getDescendantTenants(tenant.path);
    const tenantIds = descendants.map((t) => t.id);

    const [meterCount, customerCount, activeAlarms, readingStats] = await Promise.all([
      this.prisma.meter.count({
        where: { tenantId: { in: tenantIds } },
      }),
      this.prisma.customer.count({
        where: { tenantId: { in: tenantIds } },
      }),
      this.prisma.alarm.count({
        where: {
          tenantId: { in: tenantIds },
          status: 'ACTIVE',
        },
      }),
      this.kysely.getConsumptionStats(
        tenant.id,
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        new Date(),
      ),
    ]);

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        path: tenant.path,
      },
      stats: {
        totalMeters: meterCount,
        totalCustomers: customerCount,
        activeAlarms,
        childTenants: descendants.length - 1, // Exclude self
        ...readingStats,
      },
    };
  }

  /**
   * Check if user has access to a tenant based on ltree path or direct assignment
   */
  private async hasAccessToTenant(user: AuthenticatedUser, tenantPath: string, tenantId?: string): Promise<boolean> {
    if (user.role === SYSTEM_ROLES.PLATFORM_ADMIN) {
      return true;
    }

    // User can access tenant if:
    // 1. Tenant path starts with user's tenant path (descendant)
    // 2. User's tenant path starts with tenant path (ancestor)
    if (tenantPath.startsWith(user.tenantPath) || user.tenantPath.startsWith(tenantPath)) {
      return true;
    }

    // 3. User has direct assignment to the tenant
    if (tenantId) {
      const directAssignment = await this.prisma.userTenant.findFirst({
        where: {
          userId: user.id,
          tenantId: tenantId,
        },
      });
      return !!directAssignment;
    }

    return false;
  }

  /**
   * Sanitize string for ltree path compatibility
   */
  private sanitizeForLtree(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9_]/g, '_') // Replace non-alphanumeric with underscore
      .replace(/^_+|_+$/g, '') // Trim underscores
      .replace(/_+/g, '_'); // Collapse multiple underscores
  }
}

