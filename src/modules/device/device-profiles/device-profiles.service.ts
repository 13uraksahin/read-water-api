// =============================================================================
// Device Profiles Service
// =============================================================================

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { RedisService } from '../../../core/redis/redis.service';
import {
  CreateDeviceProfileDto,
  UpdateDeviceProfileDto,
  DeviceProfileQueryDto,
} from './dto/device-profile.dto';
import { PaginatedResult } from '../../../common/interfaces';
import { PAGINATION, CACHE_KEYS, CACHE_TTL } from '../../../common/constants';
import { DeviceProfile } from '@prisma/client';

@Injectable()
export class DeviceProfilesService {
  private readonly logger = new Logger(DeviceProfilesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Create a new device profile
   */
  async create(dto: CreateDeviceProfileDto): Promise<DeviceProfile> {
    // Check uniqueness of brand + model code
    const existing = await this.prisma.deviceProfile.findFirst({
      where: {
        brand: dto.brand,
        modelCode: dto.modelCode,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Device profile with brand ${dto.brand} and model code ${dto.modelCode} already exists`,
      );
    }

    const profile = await this.prisma.deviceProfile.create({
      data: {
        brand: dto.brand,
        modelCode: dto.modelCode,
        communicationTechnology: dto.communicationTechnology,
        integrationType: dto.integrationType || 'HTTP',
        fieldDefinitions: (dto.fieldDefinitions || []) as any,
        decoderFunction: dto.decoderFunction,
        testPayload: dto.testPayload,
        expectedOutput: dto.expectedOutput as any,
        batteryLifeMonths: dto.batteryLifeMonths,
        // Connect compatible meter profiles if provided
        compatibleMeterProfiles: dto.compatibleMeterProfileIds
          ? {
              connect: dto.compatibleMeterProfileIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        compatibleMeterProfiles: {
          select: {
            id: true,
            brand: true,
            modelCode: true,
            meterType: true,
          },
        },
        _count: {
          select: { devices: true },
        },
      },
    });

    this.logger.log(`Created device profile: ${profile.brand} ${profile.modelCode}`);
    return profile;
  }

  /**
   * Get all device profiles with pagination
   */
  async findAll(query: DeviceProfileQueryDto): Promise<PaginatedResult<DeviceProfile>> {
    const page = query.page || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(query.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (query.brand) {
      whereClause.brand = query.brand;
    }

    if (query.technology) {
      whereClause.communicationTechnology = query.technology;
    }

    if (query.search) {
      whereClause.OR = [
        { modelCode: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [profiles, total] = await Promise.all([
      this.prisma.deviceProfile.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: {
          [query.sortBy || 'brand']: query.sortOrder || 'asc',
        },
        include: {
          compatibleMeterProfiles: {
            select: {
              id: true,
              brand: true,
              modelCode: true,
              meterType: true,
            },
          },
          _count: {
            select: { devices: true },
          },
        },
      }),
      this.prisma.deviceProfile.count({ where: whereClause }),
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
   * Get device profile by ID
   */
  async findOne(id: string): Promise<DeviceProfile> {
    const profile = await this.prisma.deviceProfile.findUnique({
      where: { id },
      include: {
        compatibleMeterProfiles: {
          select: {
            id: true,
            brand: true,
            modelCode: true,
            meterType: true,
          },
        },
        _count: {
          select: { devices: true },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Device profile not found');
    }

    return profile;
  }

  /**
   * Update device profile
   */
  async update(id: string, dto: UpdateDeviceProfileDto): Promise<DeviceProfile> {
    await this.findOne(id);

    const updated = await this.prisma.deviceProfile.update({
      where: { id },
      data: {
        modelCode: dto.modelCode,
        communicationTechnology: dto.communicationTechnology,
        integrationType: dto.integrationType,
        fieldDefinitions: dto.fieldDefinitions as any,
        decoderFunction: dto.decoderFunction,
        testPayload: dto.testPayload,
        expectedOutput: dto.expectedOutput as any,
        batteryLifeMonths: dto.batteryLifeMonths,
        // Update compatible meter profiles if provided
        compatibleMeterProfiles: dto.compatibleMeterProfileIds
          ? {
              set: dto.compatibleMeterProfileIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        compatibleMeterProfiles: {
          select: {
            id: true,
            brand: true,
            modelCode: true,
            meterType: true,
          },
        },
        _count: {
          select: { devices: true },
        },
      },
    });

    this.logger.log(`Updated device profile: ${updated.brand} ${updated.modelCode}`);
    return updated;
  }

  /**
   * Delete device profile
   */
  async delete(id: string): Promise<void> {
    const profile = await this.prisma.deviceProfile.findUnique({
      where: { id },
      include: {
        _count: {
          select: { devices: true },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Device profile not found');
    }

    if (profile._count.devices > 0) {
      throw new BadRequestException(
        `Cannot delete device profile with ${profile._count.devices} associated devices`,
      );
    }

    await this.prisma.deviceProfile.delete({
      where: { id },
    });

    this.logger.log(`Deleted device profile: ${profile.brand} ${profile.modelCode}`);
  }

  /**
   * Test decoder function
   */
  async testDecoder(id: string, payload?: string): Promise<{ success: boolean; output?: any; error?: string }> {
    const profile = await this.findOne(id);

    if (!profile.decoderFunction) {
      throw new BadRequestException('Device profile does not have a decoder function');
    }

    const testPayload = payload || profile.testPayload;
    if (!testPayload) {
      throw new BadRequestException('No test payload provided');
    }

    try {
      // Create decoder function
      const decoderFn = new Function('payload', profile.decoderFunction);
      const output = decoderFn(testPayload);

      // Update test results
      await this.prisma.deviceProfile.update({
        where: { id },
        data: {
          lastTestedAt: new Date(),
          lastTestSucceeded: true,
        },
      });

      return { success: true, output };
    } catch (error) {
      // Update test results
      await this.prisma.deviceProfile.update({
        where: { id },
        data: {
          lastTestedAt: new Date(),
          lastTestSucceeded: false,
        },
      });

      return { success: false, error: error.message };
    }
  }
}
