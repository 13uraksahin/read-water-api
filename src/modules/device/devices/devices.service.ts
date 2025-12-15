// =============================================================================
// Devices Service - Inventory Management for Communication Units
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
import {
  CreateDeviceDto,
  UpdateDeviceDto,
  DeviceQueryDto,
  BulkCreateDeviceDto,
} from './dto/device.dto';
import { AuthenticatedUser, PaginatedResult } from '../../../common/interfaces';
import { PAGINATION, SYSTEM_ROLES } from '../../../common/constants';
import { Device, DeviceStatus } from '@prisma/client';

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new device (inventory item)
   */
  async create(dto: CreateDeviceDto, user: AuthenticatedUser): Promise<Device> {
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

    // Verify device profile exists
    const deviceProfile = await this.prisma.deviceProfile.findUnique({
      where: { id: dto.deviceProfileId },
    });

    if (!deviceProfile) {
      throw new NotFoundException('Device profile not found');
    }

    // Validate dynamic fields against profile's field definitions
    await this.validateDynamicFields(dto.dynamicFields, deviceProfile);

    // Check serial number uniqueness
    const existingDevice = await this.prisma.device.findUnique({
      where: { serialNumber: dto.serialNumber },
    });

    if (existingDevice) {
      throw new ConflictException(
        `Device with serial number ${dto.serialNumber} already exists`,
      );
    }

    const device = await this.prisma.device.create({
      data: {
        tenantId: dto.tenantId,
        deviceProfileId: dto.deviceProfileId,
        serialNumber: dto.serialNumber,
        status: dto.status || DeviceStatus.WAREHOUSE,
        dynamicFields: dto.dynamicFields as any,
        metadata: dto.metadata as any,
      },
      include: {
        tenant: {
          select: { id: true, name: true, path: true },
        },
        deviceProfile: {
          select: {
            id: true,
            brand: true,
            modelCode: true,
            communicationTechnology: true,
          },
        },
      },
    });

    this.logger.log(`Created device: ${device.serialNumber}`);
    return device;
  }

  /**
   * Bulk create devices
   */
  async bulkCreate(
    dto: BulkCreateDeviceDto,
    user: AuthenticatedUser,
  ): Promise<{ created: number; errors: string[] }> {
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

    // Verify device profile exists
    const deviceProfile = await this.prisma.deviceProfile.findUnique({
      where: { id: dto.deviceProfileId },
    });

    if (!deviceProfile) {
      throw new NotFoundException('Device profile not found');
    }

    const errors: string[] = [];
    let created = 0;

    for (const deviceData of dto.devices) {
      try {
        // Validate dynamic fields
        await this.validateDynamicFields(deviceData.dynamicFields, deviceProfile);

        // Check serial number uniqueness
        const existing = await this.prisma.device.findUnique({
          where: { serialNumber: deviceData.serialNumber },
        });

        if (existing) {
          errors.push(`${deviceData.serialNumber}: Already exists`);
          continue;
        }

        await this.prisma.device.create({
          data: {
            tenantId: dto.tenantId,
            deviceProfileId: dto.deviceProfileId,
            serialNumber: deviceData.serialNumber,
            status: DeviceStatus.WAREHOUSE,
            dynamicFields: deviceData.dynamicFields as any,
            metadata: deviceData.metadata as any,
          },
        });

        created++;
      } catch (error) {
        errors.push(`${deviceData.serialNumber}: ${error.message}`);
      }
    }

    this.logger.log(`Bulk created ${created} devices, ${errors.length} errors`);

    return { created, errors };
  }

  /**
   * Get the effective tenant path for filtering
   */
  private async getEffectiveTenantPath(user: AuthenticatedUser, tenantId?: string): Promise<string | null> {
    if (tenantId) {
      const selectedTenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { path: true },
      });

      if (!selectedTenant) {
        return user.tenantPath;
      }

      if (user.role !== SYSTEM_ROLES.PLATFORM_ADMIN) {
        if (!selectedTenant.path.startsWith(user.tenantPath)) {
          return user.tenantPath;
        }
      }

      return selectedTenant.path;
    }

    if (user.role === SYSTEM_ROLES.PLATFORM_ADMIN) {
      return null;
    }

    return user.tenantPath;
  }

  /**
   * Get all devices with pagination and filtering
   */
  async findAll(
    query: DeviceQueryDto,
    user: AuthenticatedUser,
  ): Promise<PaginatedResult<Device>> {
    const page = query.page || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(
      query.limit || PAGINATION.DEFAULT_LIMIT,
      PAGINATION.MAX_LIMIT,
    );
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

    if (query.deviceProfileId) {
      whereClause.deviceProfileId = query.deviceProfileId;
    }

    if (query.status) {
      whereClause.status = query.status;
    }

    if (query.brand) {
      whereClause.deviceProfile = {
        ...whereClause.deviceProfile,
        brand: query.brand,
      };
    }

    if (query.technology) {
      whereClause.deviceProfile = {
        ...whereClause.deviceProfile,
        communicationTechnology: query.technology,
      };
    }

    if (query.search) {
      whereClause.OR = [
        { serialNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [devices, total] = await Promise.all([
      this.prisma.device.findMany({
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
          deviceProfile: {
            select: {
              id: true,
              brand: true,
              modelCode: true,
              communicationTechnology: true,
            },
          },
          meter: {
            select: { id: true, serialNumber: true },
          },
        },
      }),
      this.prisma.device.count({ where: whereClause }),
    ]);

    return {
      data: devices,
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
   * Get available devices (WAREHOUSE status) for linking
   */
  async findAvailable(
    tenantId: string,
    meterProfileId: string,
    user: AuthenticatedUser,
  ): Promise<Device[]> {
    // Verify tenant access
    if (user.role !== SYSTEM_ROLES.PLATFORM_ADMIN) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
      });
      if (!tenant || !tenant.path.startsWith(user.tenantPath)) {
        throw new ForbiddenException('You do not have access to this tenant');
      }
    }

    // Get compatible device profiles for this meter profile
    const meterProfile = await this.prisma.meterProfile.findUnique({
      where: { id: meterProfileId },
      include: {
        compatibleDeviceProfiles: {
          select: { id: true },
        },
      },
    });

    if (!meterProfile) {
      throw new NotFoundException('Meter profile not found');
    }

    const compatibleProfileIds = meterProfile.compatibleDeviceProfiles.map(
      (p) => p.id,
    );

    return this.prisma.device.findMany({
      where: {
        tenantId,
        status: DeviceStatus.WAREHOUSE,
        deviceProfileId: { in: compatibleProfileIds },
      },
      include: {
        deviceProfile: {
          select: {
            brand: true,
            modelCode: true,
            communicationTechnology: true,
          },
        },
      },
      orderBy: { serialNumber: 'asc' },
    });
  }

  /**
   * Get device by ID
   */
  async findOne(id: string, user: AuthenticatedUser): Promise<Device & { meter?: any }> {
    const device = await this.prisma.device.findUnique({
      where: { id },
      include: {
        tenant: {
          select: { id: true, name: true, path: true },
        },
        deviceProfile: true,
        // Include the linked meter via Prisma's relation (inverse of Meter.activeDevice)
        meter: {
          select: {
            id: true,
            serialNumber: true,
            status: true,
            customer: {
              select: { id: true, details: true },
            },
            meterProfile: {
              select: { brand: true, modelCode: true },
            },
          },
        },
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    // Check access
    if (user.role !== SYSTEM_ROLES.PLATFORM_ADMIN) {
      if (!device.tenant.path.startsWith(user.tenantPath)) {
        throw new ForbiddenException('You do not have access to this device');
      }
    }

    return device;
  }

  /**
   * Find device by dynamic field (e.g., DevEUI for LoRaWAN)
   */
  async findByDynamicField(
    fieldName: string,
    fieldValue: string,
  ): Promise<Device | null> {
    const devices = await this.prisma.$queryRaw<Device[]>`
      SELECT d.*, dp.decoder_function, dp.communication_technology
      FROM devices d
      JOIN device_profiles dp ON d.device_profile_id = dp.id
      WHERE LOWER(d.dynamic_fields->>${fieldName}) = ${fieldValue.toLowerCase()}
      LIMIT 1
    `;

    return devices.length > 0 ? devices[0] : null;
  }

  /**
   * Update device
   */
  async update(
    id: string,
    dto: UpdateDeviceDto,
    user: AuthenticatedUser,
  ): Promise<Device> {
    const device = await this.findOne(id, user);

    // Validate dynamic fields if changed
    if (dto.dynamicFields) {
      const deviceProfile = await this.prisma.deviceProfile.findUnique({
        where: { id: device.deviceProfileId },
      });
      await this.validateDynamicFields(dto.dynamicFields, deviceProfile!);
    }

    // Prevent status change if device is linked to a meter
    if (dto.status && device.meter) {
      if (dto.status === DeviceStatus.WAREHOUSE) {
        throw new BadRequestException(
          'Cannot set status to WAREHOUSE while device is linked to a meter. Unlink first.',
        );
      }
    }

    const updated = await this.prisma.device.update({
      where: { id },
      data: {
        status: dto.status,
        dynamicFields: dto.dynamicFields as any,
        lastSignalStrength: dto.lastSignalStrength,
        lastBatteryLevel: dto.lastBatteryLevel,
        metadata: dto.metadata as any,
        ...(dto.lastSignalStrength !== undefined || dto.lastBatteryLevel !== undefined
          ? { lastCommunicationAt: new Date() }
          : {}),
      },
      include: {
        tenant: {
          select: { id: true, name: true },
        },
        deviceProfile: {
          select: {
            brand: true,
            modelCode: true,
            communicationTechnology: true,
          },
        },
        meter: {
          select: { id: true, serialNumber: true },
        },
      },
    });

    this.logger.log(`Updated device: ${updated.serialNumber}`);
    return updated;
  }

  /**
   * Delete device
   */
  async delete(id: string, user: AuthenticatedUser): Promise<void> {
    const device = await this.findOne(id, user);

    // Prevent deletion if device is linked to a meter
    if (device.meter) {
      throw new BadRequestException(
        'Cannot delete device while it is linked to a meter. Unlink first.',
      );
    }

    await this.prisma.device.delete({
      where: { id },
    });

    this.logger.log(`Deleted device: ${device.serialNumber}`);
  }

  /**
   * Validate dynamic fields against profile's field definitions
   */
  private async validateDynamicFields(
    fields: Record<string, string>,
    profile: any,
  ): Promise<void> {
    const fieldDefs = (profile.fieldDefinitions as any[]) || [];

    for (const fieldDef of fieldDefs) {
      const value = fields[fieldDef.name];

      if (fieldDef.required && !value) {
        throw new BadRequestException(`${fieldDef.name} is required`);
      }

      if (value && fieldDef.regex) {
        const regex = new RegExp(fieldDef.regex);
        if (!regex.test(value)) {
          throw new BadRequestException(
            `${fieldDef.name} has invalid format. Expected: ${fieldDef.regex}`,
          );
        }
      }

      if (value && fieldDef.length && value.length !== fieldDef.length) {
        throw new BadRequestException(
          `${fieldDef.name} must be exactly ${fieldDef.length} characters`,
        );
      }
    }
  }
}
