// =============================================================================
// Users Service
// =============================================================================

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, AssignTenantDto, UserQueryDto } from './dto/user.dto';
import { AuthenticatedUser, PaginatedResult } from '../../../common/interfaces';
import { PAGINATION, SYSTEM_ROLES } from '../../../common/constants';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new user
   */
  async create(dto: CreateUserDto, currentUser: AuthenticatedUser): Promise<User> {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // Validate tenant assignments
    if (dto.tenants && dto.tenants.length > 0) {
      for (const assignment of dto.tenants) {
        // Verify tenant exists and user has access
        const tenant = await this.prisma.tenant.findUnique({
          where: { id: assignment.tenantId },
        });

        if (!tenant) {
          throw new BadRequestException(`Tenant ${assignment.tenantId} not found`);
        }

        // Non-platform admins can only assign to their tenant or descendants
        if (currentUser.role !== SYSTEM_ROLES.PLATFORM_ADMIN) {
          if (!tenant.path.startsWith(currentUser.tenantPath)) {
            throw new ForbiddenException('You can only assign users to your tenant or descendants');
          }
        }
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        tcIdNo: dto.tcIdNo,
        passwordHash,
        language: dto.language || 'en',
        timezone: dto.timezone || 'UTC',
        tenants: dto.tenants
          ? {
              create: dto.tenants.map((t) => ({
                tenantId: t.tenantId,
                role: t.role,
                permissions: t.permissions || [],
              })),
            }
          : undefined,
      },
      include: {
        tenants: {
          include: {
            tenant: {
              select: { id: true, name: true, path: true },
            },
          },
        },
      },
    });

    this.logger.log(`Created user: ${user.email}`);

    // Remove passwordHash from response
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword as unknown as User;
  }

  /**
   * Get all users with pagination and filtering
   */
  async findAll(
    query: UserQueryDto,
    currentUser: AuthenticatedUser,
  ): Promise<PaginatedResult<any>> {
    const page = query.page || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(query.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};

    // Filter by accessible tenants (non-platform admins)
    if (currentUser.role !== SYSTEM_ROLES.PLATFORM_ADMIN) {
      whereClause.tenants = {
        some: {
          tenant: {
            path: {
              startsWith: currentUser.tenantPath,
            },
          },
        },
      };
    }

    if (query.search) {
      whereClause.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.isActive !== undefined) {
      whereClause.isActive = query.isActive;
    }

    if (query.tenantId) {
      whereClause.tenants = {
        ...whereClause.tenants,
        some: {
          ...whereClause.tenants?.some,
          tenantId: query.tenantId,
        },
      };
    }

    if (query.role) {
      whereClause.tenants = {
        ...whereClause.tenants,
        some: {
          ...whereClause.tenants?.some,
          role: query.role,
        },
      };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: {
          [query.sortBy || 'lastName']: query.sortOrder || 'asc',
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          tenants: {
            include: {
              tenant: {
                select: { id: true, name: true, path: true },
              },
            },
          },
        },
      }),
      this.prisma.user.count({ where: whereClause }),
    ]);

    return {
      data: users,
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
   * Get single user by ID
   */
  async findOne(id: string, currentUser: AuthenticatedUser): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        tcIdNo: true,
        isActive: true,
        language: true,
        timezone: true,
        avatarUrl: true,
        lastLoginAt: true,
        lastLoginIp: true,
        createdAt: true,
        updatedAt: true,
        tenants: {
          include: {
            tenant: {
              select: { id: true, name: true, path: true },
            },
          },
        },
        activityLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            action: true,
            resource: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check access
    if (currentUser.role !== SYSTEM_ROLES.PLATFORM_ADMIN) {
      const hasAccess = user.tenants.some((t) =>
        t.tenant.path.startsWith(currentUser.tenantPath),
      );
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this user');
      }
    }

    return user;
  }

  /**
   * Update user
   */
  async update(
    id: string,
    dto: UpdateUserDto,
    currentUser: AuthenticatedUser,
  ): Promise<any> {
    // Verify user exists and access
    await this.findOne(id, currentUser);

    // Check email uniqueness if updating email
    if (dto.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: dto.email,
          NOT: { id },
        },
      });

      if (existingUser) {
        throw new BadRequestException('Email already in use');
      }
    }

    // Validate tenant assignments if provided
    if (dto.tenants && dto.tenants.length > 0) {
      for (const assignment of dto.tenants) {
        // Verify tenant exists and user has access
        const tenant = await this.prisma.tenant.findUnique({
          where: { id: assignment.tenantId },
        });

        if (!tenant) {
          throw new BadRequestException(`Tenant ${assignment.tenantId} not found`);
        }

        // Non-platform admins can only assign to their tenant or descendants
        if (currentUser.role !== SYSTEM_ROLES.PLATFORM_ADMIN) {
          if (!tenant.path.startsWith(currentUser.tenantPath)) {
            throw new ForbiddenException('You can only assign users to your tenant or descendants');
          }
        }
      }
    }

    // Update user basic info
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        tcIdNo: dto.tcIdNo,
        isActive: dto.isActive,
        language: dto.language,
        timezone: dto.timezone,
        avatarUrl: dto.avatarUrl,
      },
    });

    // Update tenant assignments if provided
    if (dto.tenants !== undefined) {
      // Delete existing assignments
      await this.prisma.userTenant.deleteMany({
        where: { userId: id },
      });

      // Create new assignments
      if (dto.tenants.length > 0) {
        await this.prisma.userTenant.createMany({
          data: dto.tenants.map((t) => ({
            userId: id,
            tenantId: t.tenantId,
            role: t.role,
            permissions: t.permissions || [],
          })),
        });
      }
    }

    // Fetch updated user with tenants
    const result = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        tcIdNo: true,
        isActive: true,
        language: true,
        timezone: true,
        avatarUrl: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        tenants: {
          include: {
            tenant: {
              select: { id: true, name: true, path: true },
            },
          },
        },
      },
    });

    this.logger.log(`Updated user: ${updated.email}`);
    return result;
  }

  /**
   * Delete user
   */
  async delete(id: string, currentUser: AuthenticatedUser): Promise<void> {
    // Verify user exists and access
    const user = await this.findOne(id, currentUser);

    // Cannot delete yourself
    if (id === currentUser.id) {
      throw new BadRequestException('Cannot delete your own account');
    }

    // Delete user tenant assignments first
    await this.prisma.userTenant.deleteMany({
      where: { userId: id },
    });

    // Delete activity logs
    await this.prisma.activityLog.deleteMany({
      where: { userId: id },
    });

    // Delete refresh tokens
    await this.prisma.refreshToken.deleteMany({
      where: { userId: id },
    });

    // Delete user
    await this.prisma.user.delete({
      where: { id },
    });

    this.logger.log(`Deleted user: ${user.email}`);
  }

  /**
   * Assign user to tenant with role
   */
  async assignTenant(
    userId: string,
    dto: AssignTenantDto,
    currentUser: AuthenticatedUser,
  ): Promise<any> {
    // Verify user exists
    await this.findOne(userId, currentUser);

    // Verify tenant exists and access
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: dto.tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (currentUser.role !== SYSTEM_ROLES.PLATFORM_ADMIN) {
      if (!tenant.path.startsWith(currentUser.tenantPath)) {
        throw new ForbiddenException('You can only assign users to your tenant or descendants');
      }
    }

    // Upsert assignment
    const assignment = await this.prisma.userTenant.upsert({
      where: {
        userId_tenantId: {
          userId,
          tenantId: dto.tenantId,
        },
      },
      update: {
        role: dto.role,
        permissions: dto.permissions || [],
      },
      create: {
        userId,
        tenantId: dto.tenantId,
        role: dto.role,
        permissions: dto.permissions || [],
      },
      include: {
        tenant: {
          select: { id: true, name: true, path: true },
        },
      },
    });

    this.logger.log(`Assigned user ${userId} to tenant ${dto.tenantId} with role ${dto.role}`);
    return assignment;
  }

  /**
   * Remove user from tenant
   */
  async removeTenant(
    userId: string,
    tenantId: string,
    currentUser: AuthenticatedUser,
  ): Promise<void> {
    // Verify user exists
    await this.findOne(userId, currentUser);

    // Verify tenant and access
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (currentUser.role !== SYSTEM_ROLES.PLATFORM_ADMIN) {
      if (!tenant.path.startsWith(currentUser.tenantPath)) {
        throw new ForbiddenException('You can only manage users in your tenant or descendants');
      }
    }

    // Check if this is the user's last tenant
    const userTenants = await this.prisma.userTenant.count({
      where: { userId },
    });

    if (userTenants <= 1) {
      throw new BadRequestException('User must have at least one tenant assignment');
    }

    await this.prisma.userTenant.delete({
      where: {
        userId_tenantId: {
          userId,
          tenantId,
        },
      },
    });

    this.logger.log(`Removed user ${userId} from tenant ${tenantId}`);
  }
}

