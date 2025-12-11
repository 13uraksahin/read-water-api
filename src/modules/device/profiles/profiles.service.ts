// =============================================================================
// Meter Profiles Service - Refactored for Asset/Device Split
// =============================================================================
// REMOVED: communicationConfigs, batteryLifeMonths (now in DeviceProfile)
// ADDED: Compatible device profiles management
// =============================================================================

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { RedisService } from '../../../core/redis/redis.service';
import { CreateMeterProfileDto, UpdateMeterProfileDto, ProfileQueryDto } from './dto/profile.dto';
import { PaginatedResult } from '../../../common/interfaces';
import { PAGINATION, CACHE_KEYS, CACHE_TTL } from '../../../common/constants';
import { MeterProfile } from '@prisma/client';

@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Create a new meter profile
   */
  async create(dto: CreateMeterProfileDto): Promise<MeterProfile> {
    // Check uniqueness of brand + model code
    const existing = await this.prisma.meterProfile.findFirst({
      where: {
        brand: dto.brand,
        modelCode: dto.modelCode,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Profile with brand ${dto.brand} and model code ${dto.modelCode} already exists`,
      );
    }

    // Calculate R value if not provided
    let rValue = dto.rValue;
    if (!rValue && dto.q3 && dto.q1 && dto.q1 > 0) {
      rValue = dto.q3 / dto.q1;
    }

    const profile = await this.prisma.meterProfile.create({
      data: {
        brand: dto.brand,
        modelCode: dto.modelCode,
        meterType: dto.meterType,
        dialType: dto.dialType,
        connectionType: dto.connectionType,
        mountingType: dto.mountingType,
        temperatureType: dto.temperatureType,
        diameter: dto.diameter,
        length: dto.length,
        width: dto.width,
        height: dto.height,
        q1: dto.q1,
        q2: dto.q2,
        q3: dto.q3,
        q4: dto.q4,
        rValue: rValue,
        pressureLoss: dto.pressureLoss,
        ipRating: dto.ipRating,
        communicationModule: dto.communicationModule,
        specifications: dto.specifications as any,
        // Connect compatible device profiles if provided
        compatibleDeviceProfiles: dto.compatibleDeviceProfileIds
          ? {
              connect: dto.compatibleDeviceProfileIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        compatibleDeviceProfiles: {
          select: {
            id: true,
            brand: true,
            modelCode: true,
            communicationTechnology: true,
          },
        },
      },
    });

    this.logger.log(`Created profile: ${profile.brand} ${profile.modelCode}`);
    return profile;
  }

  /**
   * Get all profiles with pagination
   */
  async findAll(query: ProfileQueryDto): Promise<PaginatedResult<MeterProfile>> {
    const page = query.page || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(query.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (query.brand) {
      whereClause.brand = query.brand;
    }

    if (query.meterType) {
      whereClause.meterType = query.meterType;
    }

    if (query.search) {
      whereClause.OR = [
        { modelCode: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [profiles, total] = await Promise.all([
      this.prisma.meterProfile.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: {
          [query.sortBy || 'brand']: query.sortOrder || 'asc',
        },
        include: {
          compatibleDeviceProfiles: {
            select: {
              id: true,
              brand: true,
              modelCode: true,
              communicationTechnology: true,
            },
          },
          _count: {
            select: { meters: true },
          },
        },
      }),
      this.prisma.meterProfile.count({ where: whereClause }),
    ]);

    return {
      data: profiles,
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
   * Get profile by ID
   */
  async findOne(id: string): Promise<MeterProfile> {
    const profile = await this.prisma.meterProfile.findUnique({
      where: { id },
      include: {
        allowedTenants: {
          select: { id: true, name: true, path: true },
        },
        compatibleDeviceProfiles: {
          select: {
            id: true,
            brand: true,
            modelCode: true,
            communicationTechnology: true,
            batteryLifeMonths: true,
          },
        },
        _count: {
          select: { meters: true },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  /**
   * Update profile
   */
  async update(id: string, dto: UpdateMeterProfileDto): Promise<MeterProfile> {
    await this.findOne(id);

    // Recalculate R value if Q values changed
    let rValue = dto.rValue;
    if (dto.q3 !== undefined && dto.q1 !== undefined && dto.q1 > 0) {
      rValue = dto.q3 / dto.q1;
    }

    const updated = await this.prisma.meterProfile.update({
      where: { id },
      data: {
        modelCode: dto.modelCode,
        meterType: dto.meterType,
        dialType: dto.dialType,
        connectionType: dto.connectionType,
        mountingType: dto.mountingType,
        temperatureType: dto.temperatureType,
        diameter: dto.diameter,
        length: dto.length,
        width: dto.width,
        height: dto.height,
        q1: dto.q1,
        q2: dto.q2,
        q3: dto.q3,
        q4: dto.q4,
        rValue: rValue,
        pressureLoss: dto.pressureLoss,
        ipRating: dto.ipRating,
        communicationModule: dto.communicationModule,
        specifications: dto.specifications as any,
        // Update compatible device profiles if provided
        compatibleDeviceProfiles: dto.compatibleDeviceProfileIds
          ? {
              set: dto.compatibleDeviceProfileIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        compatibleDeviceProfiles: {
          select: {
            id: true,
            brand: true,
            modelCode: true,
            communicationTechnology: true,
          },
        },
      },
    });

    // Invalidate cache
    await this.redisService.del(CACHE_KEYS.METER_PROFILE(id));

    this.logger.log(`Updated profile: ${updated.brand} ${updated.modelCode}`);
    return updated;
  }

  /**
   * Delete profile
   */
  async delete(id: string): Promise<void> {
    const profile = await this.prisma.meterProfile.findUnique({
      where: { id },
      include: {
        _count: {
          select: { meters: true },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    if (profile._count.meters > 0) {
      throw new BadRequestException(
        `Cannot delete profile with ${profile._count.meters} associated meters`,
      );
    }

    await this.prisma.meterProfile.delete({
      where: { id },
    });

    // Invalidate cache
    await this.redisService.del(CACHE_KEYS.METER_PROFILE(id));

    this.logger.log(`Deleted profile: ${profile.brand} ${profile.modelCode}`);
  }

  /**
   * Get communication technology field definitions
   */
  async getCommunicationTechFields() {
    return this.prisma.communicationTechFieldDef.findMany({
      orderBy: { technology: 'asc' },
    });
  }

  /**
   * Get all device profiles (for compatibility selection)
   */
  async getDeviceProfiles() {
    return this.prisma.deviceProfile.findMany({
      select: {
        id: true,
        brand: true,
        modelCode: true,
        communicationTechnology: true,
        batteryLifeMonths: true,
      },
      orderBy: [{ brand: 'asc' }, { modelCode: 'asc' }],
    });
  }
}
