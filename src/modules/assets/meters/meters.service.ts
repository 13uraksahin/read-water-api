// =============================================================================
// Meters Service - Updated for Subscription Model
// =============================================================================
// Meters are linked to Subscriptions, not directly to Customers
// Address is inherited from Subscription
// =============================================================================

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { KyselyService } from '../../../core/kysely/kysely.service';
import {
  CreateMeterDto,
  UpdateMeterDto,
  MeterQueryDto,
  ControlValveDto,
  LinkDeviceDto,
  UnlinkDeviceDto,
  LinkSubscriptionDto,
} from './dto/meter.dto';
import { AuthenticatedUser, PaginatedResult } from '../../../common/interfaces';
import { PAGINATION, SYSTEM_ROLES } from '../../../common/constants';
import { Meter, ValveStatus, DeviceStatus, MeterStatus } from '@prisma/client';

@Injectable()
export class MetersService {
  private readonly logger = new Logger(MetersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kysely: KyselyService,
  ) {}

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
   * Create a new meter (linked to subscription, not customer)
   */
  async create(dto: CreateMeterDto, user: AuthenticatedUser): Promise<Meter> {
    // Verify tenant access
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: dto.tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check tenant access (hierarchical OR direct assignment)
    const hasAccess = await this.hasUserAccessToTenant(user, tenant.path, tenant.id);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this tenant');
    }

    // Verify meter profile exists
    const profile = await this.prisma.meterProfile.findUnique({
      where: { id: dto.meterProfileId },
    });

    if (!profile) {
      throw new NotFoundException('Meter profile not found');
    }

    // Check serial number uniqueness
    const existingMeter = await this.prisma.meter.findUnique({
      where: { serialNumber: dto.serialNumber },
    });

    if (existingMeter) {
      throw new BadRequestException(`Meter with serial number ${dto.serialNumber} already exists`);
    }

    // If subscription is provided, verify it exists and belongs to tenant
    if (dto.subscriptionId) {
      const subscription = await this.prisma.subscription.findFirst({
        where: {
          id: dto.subscriptionId,
          tenantId: dto.tenantId,
        },
      });

      if (!subscription) {
        throw new NotFoundException('Subscription not found or does not belong to this tenant');
      }
    }

    const meter = await this.prisma.meter.create({
      data: {
        tenantId: dto.tenantId,
        subscriptionId: dto.subscriptionId || null,
        meterProfileId: dto.meterProfileId,
        serialNumber: dto.serialNumber,
        initialIndex: dto.initialIndex || 0,
        installationDate: new Date(dto.installationDate),
        status: dto.status || MeterStatus.WAREHOUSE,
        metadata: dto.metadata as any,
      },
      include: {
        tenant: {
          select: { id: true, name: true, path: true },
        },
        subscription: {
          include: {
            customer: {
              select: { id: true, details: true, customerType: true },
            },
          },
        },
        meterProfile: {
          select: { id: true, brand: true, modelCode: true, meterType: true },
        },
        activeDevice: {
          select: { id: true, serialNumber: true, status: true },
        },
      },
    });

    this.logger.log(`Created meter: ${meter.serialNumber}`);
    return meter;
  }

  /**
   * Get the effective tenant path for filtering
   */
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
   * Get all meters with pagination and filtering
   */
  async findAll(
    query: MeterQueryDto,
    user: AuthenticatedUser,
  ): Promise<PaginatedResult<Meter>> {
    const page = query.page || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(query.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    // Get effective tenant path for filtering
    const effectivePath = await this.getEffectiveTenantPath(user, query.tenantId);
    
    if (effectivePath) {
      whereClause.tenant = {
        path: {
          startsWith: effectivePath,
        },
      };
    }

    if (query.subscriptionId) {
      whereClause.subscriptionId = query.subscriptionId;
    }

    if (query.status) {
      whereClause.status = query.status;
    }

    if (query.brand) {
      whereClause.meterProfile = {
        brand: query.brand,
      };
    }

    if (query.search) {
      whereClause.OR = [
        { serialNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [meters, total] = await Promise.all([
      this.prisma.meter.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: {
          [query.sortBy || 'createdAt']: query.sortOrder || 'desc',
        },
        include: {
          tenant: {
            select: { id: true, name: true },
          },
          subscription: {
            include: {
              customer: {
                select: { id: true, details: true, customerType: true },
              },
            },
          },
          meterProfile: {
            select: { id: true, brand: true, modelCode: true, meterType: true },
          },
          activeDevice: {
            select: {
              id: true,
              serialNumber: true,
              status: true,
              lastSignalStrength: true,
              lastBatteryLevel: true,
              deviceProfile: {
                select: { brand: true, modelCode: true, communicationTechnology: true },
              },
            },
          },
        },
      }),
      this.prisma.meter.count({ where: whereClause }),
    ]);

    return {
      data: meters,
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
   * Get meter by ID
   */
  async findOne(id: string, user: AuthenticatedUser): Promise<Meter> {
    const meter = await this.prisma.meter.findUnique({
      where: { id },
      include: {
        tenant: {
          select: { id: true, name: true, path: true },
        },
        subscription: {
          include: {
            customer: true,
          },
        },
        meterProfile: true,
        activeDevice: {
          include: {
            deviceProfile: true,
          },
        },
        alarms: {
          where: { status: 'ACTIVE' },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        readings: {
          take: 10,
          orderBy: { time: 'desc' },
        },
      },
    });

    if (!meter) {
      throw new NotFoundException('Meter not found');
    }

    // Check access (hierarchical OR direct assignment)
    const hasAccess = await this.hasUserAccessToTenant(user, meter.tenant.path, meter.tenantId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this meter');
    }

    return meter;
  }

  /**
   * Update meter
   */
  async update(
    id: string,
    dto: UpdateMeterDto,
    user: AuthenticatedUser,
  ): Promise<Meter> {
    const meter = await this.findOne(id, user);

    // Check serial number uniqueness if changed
    if (dto.serialNumber && dto.serialNumber !== meter.serialNumber) {
      const existingMeter = await this.prisma.meter.findUnique({
        where: { serialNumber: dto.serialNumber },
      });

      if (existingMeter) {
        throw new BadRequestException(`Meter with serial number ${dto.serialNumber} already exists`);
      }
    }

    // If subscription is being changed, verify it belongs to same tenant
    if (dto.subscriptionId) {
      const subscription = await this.prisma.subscription.findFirst({
        where: {
          id: dto.subscriptionId,
          tenantId: meter.tenantId,
        },
      });

      if (!subscription) {
        throw new NotFoundException('Subscription not found or does not belong to this tenant');
      }
    }

    const updated = await this.prisma.meter.update({
      where: { id },
      data: {
        subscriptionId: dto.subscriptionId,
        meterProfileId: dto.meterProfileId,
        serialNumber: dto.serialNumber,
        status: dto.status,
        valveStatus: dto.valveStatus,
        metadata: dto.metadata as any,
      },
      include: {
        tenant: {
          select: { id: true, name: true },
        },
        subscription: {
          include: {
            customer: {
              select: { id: true, details: true },
            },
          },
        },
        meterProfile: {
          select: { id: true, brand: true, modelCode: true },
        },
        activeDevice: {
          select: { id: true, serialNumber: true, status: true },
        },
      },
    });

    this.logger.log(`Updated meter: ${updated.serialNumber}`);
    return updated;
  }

  /**
   * Delete meter
   */
  async delete(id: string, user: AuthenticatedUser): Promise<void> {
    const meter = await this.findOne(id, user);

    // Check if meter has readings
    const readingCount = await this.prisma.reading.count({
      where: { meterId: id },
    });

    if (readingCount > 0) {
      throw new BadRequestException(
        `Cannot delete meter with ${readingCount} readings. Consider changing status to PASSIVE instead.`,
      );
    }

    // Unlink device if any
    if (meter.activeDeviceId) {
      await this.prisma.device.update({
        where: { id: meter.activeDeviceId },
        data: { status: DeviceStatus.WAREHOUSE },
      });
    }

    await this.prisma.meter.delete({
      where: { id },
    });

    this.logger.log(`Deleted meter: ${meter.serialNumber}`);
  }

  /**
   * Link a meter to a subscription
   */
  async linkSubscription(
    meterId: string,
    dto: LinkSubscriptionDto,
    user: AuthenticatedUser,
  ): Promise<Meter> {
    const meter = await this.findOne(meterId, user);

    // Verify subscription exists and belongs to same tenant
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        id: dto.subscriptionId,
        tenantId: meter.tenantId,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found or does not belong to this tenant');
    }

    const updated = await this.prisma.meter.update({
      where: { id: meterId },
      data: { subscriptionId: dto.subscriptionId },
      include: {
        tenant: { select: { id: true, name: true } },
        subscription: {
          include: {
            customer: { select: { id: true, details: true } },
          },
        },
        meterProfile: { select: { id: true, brand: true, modelCode: true } },
        activeDevice: { select: { id: true, serialNumber: true, status: true } },
      },
    });

    this.logger.log(`Linked meter ${meter.serialNumber} to subscription ${dto.subscriptionId}`);
    return updated;
  }

  /**
   * Unlink a meter from its subscription
   */
  async unlinkSubscription(
    meterId: string,
    user: AuthenticatedUser,
  ): Promise<Meter> {
    const meter = await this.findOne(meterId, user);

    if (!meter.subscriptionId) {
      throw new BadRequestException('Meter is not linked to any subscription');
    }

    const updated = await this.prisma.meter.update({
      where: { id: meterId },
      data: { subscriptionId: null },
      include: {
        tenant: { select: { id: true, name: true } },
        meterProfile: { select: { id: true, brand: true, modelCode: true } },
        activeDevice: { select: { id: true, serialNumber: true, status: true } },
      },
    });

    this.logger.log(`Unlinked meter ${meter.serialNumber} from subscription`);
    return updated;
  }

  /**
   * Link a device to a meter
   */
  async linkDevice(
    meterId: string,
    dto: LinkDeviceDto,
    user: AuthenticatedUser,
  ): Promise<Meter> {
    const meter = await this.findOne(meterId, user);

    // Check if meter already has a device
    if (meter.activeDeviceId) {
      throw new ConflictException('Meter already has an active device. Unlink first.');
    }

    // Find the module (device)
    const device = await this.prisma.device.findUnique({
      where: { id: dto.moduleId },
      include: {
        tenant: true,
        deviceProfile: {
          include: {
            compatibleMeterProfiles: {
              where: { id: meter.meterProfileId },
            },
          },
        },
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    // Check device is in WAREHOUSE status
    if (device.status !== DeviceStatus.WAREHOUSE) {
      throw new BadRequestException(
        `Device is not available. Current status: ${device.status}`,
      );
    }

    // Check device belongs to accessible tenant (hierarchical OR direct assignment)
    const hasDeviceAccess = await this.hasUserAccessToTenant(user, device.tenant.path, device.tenantId);
    if (!hasDeviceAccess) {
      throw new ForbiddenException('Device does not belong to your tenant');
    }

    // Check compatibility with meter profile
    if (device.deviceProfile.compatibleMeterProfiles.length === 0) {
      throw new BadRequestException(
        `Device profile ${device.deviceProfile.brand} ${device.deviceProfile.modelCode} is not compatible with meter profile`,
      );
    }

    // Transaction: Link module to meter
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.device.update({
        where: { id: dto.moduleId },
        data: { status: DeviceStatus.DEPLOYED },
      });

      const updatedMeter = await tx.meter.update({
        where: { id: meterId },
        data: { activeDeviceId: dto.moduleId },
        include: {
          tenant: { select: { id: true, name: true } },
          subscription: {
            include: {
              customer: { select: { id: true, details: true } },
            },
          },
          meterProfile: { select: { id: true, brand: true, modelCode: true } },
          activeDevice: {
            include: { deviceProfile: true },
          },
        },
      });

      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: 'meter.link_module',
          resource: 'meter',
          resourceId: meterId,
          details: {
            moduleId: dto.moduleId,
            moduleSerial: device.serialNumber,
            meterSerial: meter.serialNumber,
          },
        },
      });

      return updatedMeter;
    });

    this.logger.log(`Linked device ${device.serialNumber} to meter ${meter.serialNumber}`);
    return updated;
  }

  /**
   * Unlink a device from a meter
   */
  async unlinkDevice(
    meterId: string,
    dto: UnlinkDeviceDto,
    user: AuthenticatedUser,
  ): Promise<Meter> {
    const meter = await this.findOne(meterId, user);

    if (!meter.activeDeviceId) {
      throw new BadRequestException('Meter has no active device to unlink');
    }

    const deviceId = meter.activeDeviceId;
    const newStatus = dto.moduleStatus || 'WAREHOUSE';

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.device.update({
        where: { id: deviceId },
        data: { status: newStatus as DeviceStatus },
      });

      const updatedMeter = await tx.meter.update({
        where: { id: meterId },
        data: { activeDeviceId: null },
        include: {
          tenant: { select: { id: true, name: true } },
          subscription: {
            include: {
              customer: { select: { id: true, details: true } },
            },
          },
          meterProfile: { select: { id: true, brand: true, modelCode: true } },
        },
      });

      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: 'meter.unlink_device',
          resource: 'meter',
          resourceId: meterId,
          details: {
            deviceId,
            newDeviceStatus: newStatus,
            meterSerial: meter.serialNumber,
          },
        },
      });

      return updatedMeter;
    });

    this.logger.log(`Unlinked device from meter ${meter.serialNumber}`);
    return updated;
  }

  /**
   * Control valve (open/close)
   */
  async controlValve(
    id: string,
    dto: ControlValveDto,
    user: AuthenticatedUser,
  ): Promise<Meter> {
    const meter = await this.findOne(id, user);

    if (meter.valveStatus === 'NOT_APPLICABLE') {
      throw new BadRequestException('This meter does not have valve control');
    }

    const updated = await this.prisma.meter.update({
      where: { id },
      data: {
        valveStatus: dto.action as ValveStatus,
      },
    });

    this.logger.log(`Valve ${dto.action} for meter: ${meter.serialNumber}`);
    return updated;
  }

  /**
   * Get meter reading history
   */
  async getReadingHistory(id: string, user: AuthenticatedUser, days = 30) {
    await this.findOne(id, user);

    const startTime = new Date();
    startTime.setDate(startTime.getDate() - days);

    return this.kysely.getHourlyConsumption(id, startTime, new Date());
  }
}
