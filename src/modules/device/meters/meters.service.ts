// =============================================================================
// Meters Service
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
import { CreateMeterDto, UpdateMeterDto, MeterQueryDto, ControlValveDto } from './dto/meter.dto';
import { AuthenticatedUser, PaginatedResult, ConnectivityConfig } from '../../../common/interfaces';
import { PAGINATION, SYSTEM_ROLES } from '../../../common/constants';
import { Meter, ValveStatus } from '@prisma/client';

@Injectable()
export class MetersService {
  private readonly logger = new Logger(MetersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kysely: KyselyService,
  ) {}

  /**
   * Create a new meter with dynamic connectivity config validation
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

    // Validate connectivity config against profile
    if (dto.connectivityConfig) {
      await this.validateConnectivityConfig(dto.connectivityConfig, profile);
    }

    // Check serial number uniqueness
    const existingMeter = await this.prisma.meter.findUnique({
      where: { serialNumber: dto.serialNumber },
    });

    if (existingMeter) {
      throw new BadRequestException(`Meter with serial number ${dto.serialNumber} already exists`);
    }

    // Verify customer if provided
    if (dto.customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: {
          id: dto.customerId,
          tenantId: dto.tenantId,
        },
      });

      if (!customer) {
        throw new NotFoundException('Customer not found or does not belong to this tenant');
      }
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
        connectivityConfig: dto.connectivityConfig as any || {},
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

    // Validate connectivity config if changed
    if (dto.connectivityConfig) {
      const profile = await this.prisma.meterProfile.findUnique({
        where: { id: dto.meterProfileId || meter.meterProfileId },
      });
      await this.validateConnectivityConfig(dto.connectivityConfig, profile!);
    }

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
        connectivityConfig: dto.connectivityConfig as any,
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

    await this.prisma.meter.delete({
      where: { id },
    });

    this.logger.log(`Deleted meter: ${meter.serialNumber}`);
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
  async getReadingHistory(
    id: string,
    user: AuthenticatedUser,
    days = 30,
  ) {
    await this.findOne(id, user);

    const startTime = new Date();
    startTime.setDate(startTime.getDate() - days);

    return this.kysely.getHourlyConsumption(id, startTime, new Date());
  }

  /**
   * Validate connectivity config against profile's communication configs
   */
  private async validateConnectivityConfig(
    config: any,
    profile: any,
  ): Promise<void> {
    const profileConfigs = profile.communicationConfigs as any[] || [];

    const validateFields = async (connConfig: any, type: string) => {
      if (!connConfig) return;

      const techConfig = profileConfigs.find(
        (c: any) => c.technology === connConfig.technology,
      );

      if (!techConfig) {
        throw new BadRequestException(
          `Technology ${connConfig.technology} not supported by this profile`,
        );
      }

      // Get field definitions
      const fieldDefs = await this.prisma.communicationTechFieldDef.findUnique({
        where: { technology: connConfig.technology as any },
      });

      if (fieldDefs) {
        const fields = fieldDefs.fields as any[];
        for (const fieldDef of fields) {
          if (fieldDef.required && !connConfig.fields?.[fieldDef.name]) {
            throw new BadRequestException(
              `${type} connectivity: ${fieldDef.name} is required for ${connConfig.technology}`,
            );
          }

          if (connConfig.fields?.[fieldDef.name] && fieldDef.regex) {
            const regex = new RegExp(fieldDef.regex);
            if (!regex.test(connConfig.fields[fieldDef.name])) {
              throw new BadRequestException(
                `${type} connectivity: ${fieldDef.name} has invalid format`,
              );
            }
          }
        }
      }
    };

    await validateFields(config.primary, 'Primary');
    await validateFields(config.secondary, 'Secondary');

    if (config.others) {
      for (let i = 0; i < config.others.length; i++) {
        await validateFields(config.others[i], `Other[${i}]`);
      }
    }
  }
}

