// =============================================================================
// Meters Service - Refactored for Asset/Device Split
// =============================================================================
// REMOVED: All connectivity_config validation and processing
// Meters are now pure assets - connectivity is handled by Device entity
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
} from './dto/meter.dto';
import { AuthenticatedUser, PaginatedResult } from '../../../common/interfaces';
import { PAGINATION, SYSTEM_ROLES } from '../../../common/constants';
import { Meter, ValveStatus, DeviceStatus } from '@prisma/client';

@Injectable()
export class MetersService {
  private readonly logger = new Logger(MetersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kysely: KyselyService,
  ) {}

  /**
   * Create a new meter (pure asset, no connectivity config)
   */
  async create(dto: CreateMeterDto, user: AuthenticatedUser): Promise<Meter> {
    // Verify tenant access
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: dto.tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (user.role !== SYSTEM_ROLES.PLATFORM_ADMIN) {
      if (!tenant.path.startsWith(user.tenantPath)) {
        throw new ForbiddenException('You do not have access to this tenant');
      }
    }

    // Verify meter profile exists and tenant has access
    const profile = await this.prisma.meterProfile.findUnique({
      where: { id: dto.meterProfileId },
      include: {
        allowedTenants: {
          where: { id: dto.tenantId },
        },
      },
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

    // STRICT: Verify customer exists and belongs to tenant
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: dto.customerId,
        tenantId: dto.tenantId,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found or does not belong to this tenant');
    }

    const meter = await this.prisma.meter.create({
      data: {
        tenantId: dto.tenantId,
        customerId: dto.customerId,
        meterProfileId: dto.meterProfileId,
        serialNumber: dto.serialNumber,
        initialIndex: dto.initialIndex || 0,
        installationDate: new Date(dto.installationDate),
        status: dto.status || 'WAREHOUSE',
        address: dto.address as any,
        addressCode: dto.addressCode,
        latitude: dto.latitude,
        longitude: dto.longitude,
        metadata: dto.metadata as any,
      },
      include: {
        tenant: {
          select: { id: true, name: true, path: true },
        },
        customer: {
          select: { id: true, details: true },
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

    // Filter by accessible tenants
    if (user.role !== SYSTEM_ROLES.PLATFORM_ADMIN) {
      whereClause.tenant = {
        path: {
          startsWith: user.tenantPath,
        },
      };
    }

    if (query.tenantId) {
      whereClause.tenantId = query.tenantId;
    }

    if (query.customerId) {
      whereClause.customerId = query.customerId;
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
          customer: {
            select: { id: true, details: true },
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
        customer: true,
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

    // Check access
    if (user.role !== SYSTEM_ROLES.PLATFORM_ADMIN) {
      if (!meter.tenant.path.startsWith(user.tenantPath)) {
        throw new ForbiddenException('You do not have access to this meter');
      }
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

    const updated = await this.prisma.meter.update({
      where: { id },
      data: {
        customerId: dto.customerId,
        meterProfileId: dto.meterProfileId,
        serialNumber: dto.serialNumber,
        status: dto.status,
        valveStatus: dto.valveStatus,
        address: dto.address as any,
        addressCode: dto.addressCode,
        latitude: dto.latitude,
        longitude: dto.longitude,
        metadata: dto.metadata as any,
      },
      include: {
        tenant: {
          select: { id: true, name: true },
        },
        customer: {
          select: { id: true, details: true },
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
   * Link a device to a meter
   * Device must be in WAREHOUSE status
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

    // Find the device
    const device = await this.prisma.device.findUnique({
      where: { id: dto.deviceId },
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

    // Check device belongs to same tenant or child tenant
    if (user.role !== SYSTEM_ROLES.PLATFORM_ADMIN) {
      if (!device.tenant.path.startsWith(user.tenantPath)) {
        throw new ForbiddenException('Device does not belong to your tenant');
      }
    }

    // Check compatibility with meter profile
    if (device.deviceProfile.compatibleMeterProfiles.length === 0) {
      throw new BadRequestException(
        `Device profile ${device.deviceProfile.brand} ${device.deviceProfile.modelCode} is not compatible with meter profile`,
      );
    }

    // Transaction: Link device to meter
    const updated = await this.prisma.$transaction(async (tx) => {
      // Update device status to DEPLOYED
      await tx.device.update({
        where: { id: dto.deviceId },
        data: { status: DeviceStatus.DEPLOYED },
      });

      // Link device to meter
      const updatedMeter = await tx.meter.update({
        where: { id: meterId },
        data: { activeDeviceId: dto.deviceId },
        include: {
          tenant: { select: { id: true, name: true } },
          customer: { select: { id: true, details: true } },
          meterProfile: { select: { id: true, brand: true, modelCode: true } },
          activeDevice: {
            include: { deviceProfile: true },
          },
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: 'meter.link_device',
          resource: 'meter',
          resourceId: meterId,
          details: {
            deviceId: dto.deviceId,
            deviceSerial: device.serialNumber,
            meterSerial: meter.serialNumber,
          },
        },
      });

      return updatedMeter;
    });

    this.logger.log(
      `Linked device ${device.serialNumber} to meter ${meter.serialNumber}`,
    );

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
    const newStatus = dto.deviceStatus || 'WAREHOUSE';

    // Transaction: Unlink device from meter
    const updated = await this.prisma.$transaction(async (tx) => {
      // Update device status
      await tx.device.update({
        where: { id: deviceId },
        data: { status: newStatus as DeviceStatus },
      });

      // Unlink device from meter
      const updatedMeter = await tx.meter.update({
        where: { id: meterId },
        data: { activeDeviceId: null },
        include: {
          tenant: { select: { id: true, name: true } },
          customer: { select: { id: true, details: true } },
          meterProfile: { select: { id: true, brand: true, modelCode: true } },
        },
      });

      // Log activity
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

    // In a real implementation, this would send a command to the device
    // For now, we just update the status
    const updated = await this.prisma.meter.update({
      where: { id },
      data: {
        valveStatus: dto.action as ValveStatus,
      },
    });

    this.logger.log(`Valve ${dto.action} for meter: ${meter.serialNumber}`);

    // TODO: Send command to device via MQTT/HTTP

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
