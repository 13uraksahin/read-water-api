// =============================================================================
// Module Profiles Service
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
  CreateModuleProfileDto,
  UpdateModuleProfileDto,
  ModuleProfileQueryDto,
  CommunicationConfigDto,
  ScenarioDto,
} from './dto/module-profile.dto';
import { PaginatedResult } from '../../../common/interfaces';
import { PAGINATION, CACHE_KEYS, CACHE_TTL } from '../../../common/constants';
import { DeviceProfile } from '@prisma/client';
import { randomUUID } from 'crypto';

// Type alias - Prisma uses DeviceProfile but we expose as ModuleProfile
type ModuleProfile = DeviceProfile;

// Helper to ensure scenarios have IDs and proper defaults
function processScenarios(scenarios?: ScenarioDto[]): ScenarioDto[] {
  if (!scenarios || scenarios.length === 0) return [];
  
  // Ensure each scenario has an ID
  const processed = scenarios.map((scenario, index) => ({
    ...scenario,
    id: scenario.id || randomUUID(),
    isDefault: scenario.isDefault ?? (index === 0), // First scenario is default if none specified
  }));
  
  // Ensure exactly one default scenario
  const hasDefault = processed.some(s => s.isDefault);
  if (!hasDefault && processed.length > 0) {
    processed[0].isDefault = true;
  }
  
  return processed;
}

// Helper to process communication configs with scenarios
function processCommunicationConfigs(configs?: CommunicationConfigDto[]): CommunicationConfigDto[] {
  if (!configs) return [];
  
  return configs.map(config => ({
    ...config,
    scenarios: processScenarios(config.scenarios),
  }));
}

@Injectable()
export class ModuleProfilesService {
  private readonly logger = new Logger(ModuleProfilesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Create a new module profile
   */
  async create(dto: CreateModuleProfileDto): Promise<ModuleProfile> {
    // Check uniqueness of brand + model code
    const existing = await this.prisma.deviceProfile.findFirst({
      where: {
        brand: dto.brand,
        modelCode: dto.modelCode,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Module profile with brand ${dto.brand} and model code ${dto.modelCode} already exists`,
      );
    }

    // Handle communicationConfigs - store in specifications and derive primary values
    let communicationTechnology = dto.communicationTechnology;
    let fieldDefinitions = dto.fieldDefinitions || [];
    let decoderFunction = dto.decoderFunction;
    let testPayload = dto.testPayload;
    let specifications: any = {};

    if (dto.communicationConfigs && dto.communicationConfigs.length > 0) {
      // Process configs to ensure scenarios have IDs and defaults
      const processedConfigs = processCommunicationConfigs(dto.communicationConfigs);
      
      // Store all communication configs in specifications
      specifications.communicationConfigs = processedConfigs;
      
      // Use first config as primary for backward compatibility
      const primaryConfig = processedConfigs[0];
      communicationTechnology = primaryConfig.technology;
      
      // Merge all field definitions from all technologies
      fieldDefinitions = processedConfigs.flatMap(config => 
        config.fieldDefinitions.map(fd => ({
          ...fd,
          // Add technology prefix to field name for uniqueness if multiple techs
          technology: config.technology,
        }))
      );
      
      // Use primary decoder from default scenario if not explicitly set
      const defaultScenario = primaryConfig.scenarios?.find(s => s.isDefault) || primaryConfig.scenarios?.[0];
      if (!decoderFunction) {
        decoderFunction = defaultScenario?.decoderFunction || primaryConfig.decoderFunction;
      }
      if (!testPayload) {
        testPayload = defaultScenario?.testPayload || primaryConfig.testPayload;
      }
    }

    const profile = await this.prisma.deviceProfile.create({
      data: {
        brand: dto.brand,
        modelCode: dto.modelCode,
        communicationTechnology: communicationTechnology!,
        integrationType: dto.integrationType || 'HTTP',
        fieldDefinitions: fieldDefinitions as any,
        decoderFunction,
        testPayload,
        expectedOutput: dto.expectedOutput as any,
        batteryLifeMonths: dto.batteryLifeMonths,
        specifications: Object.keys(specifications).length > 0 ? specifications : undefined,
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

    this.logger.log(`Created module profile: ${profile.brand} ${profile.modelCode}`);
    return profile;
  }

  /**
   * Get all module profiles with pagination
   */
  async findAll(query: ModuleProfileQueryDto): Promise<PaginatedResult<ModuleProfile>> {
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
   * Get module profile by ID
   */
  async findOne(id: string): Promise<ModuleProfile> {
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
      throw new NotFoundException('Module profile not found');
    }

    return profile;
  }

  /**
   * Update module profile
   */
  async update(id: string, dto: UpdateModuleProfileDto): Promise<ModuleProfile> {
    const existingProfile = await this.findOne(id);

    // Handle communicationConfigs update
    let communicationTechnology = dto.communicationTechnology;
    let fieldDefinitions = dto.fieldDefinitions;
    let decoderFunction = dto.decoderFunction;
    let testPayload = dto.testPayload;
    let specifications: any = (existingProfile.specifications as any) || {};

    if (dto.communicationConfigs && dto.communicationConfigs.length > 0) {
      // Process configs to ensure scenarios have IDs and defaults
      const processedConfigs = processCommunicationConfigs(dto.communicationConfigs);
      
      // Store all communication configs in specifications
      specifications.communicationConfigs = processedConfigs;
      
      // Use first config as primary for backward compatibility
      const primaryConfig = processedConfigs[0];
      communicationTechnology = primaryConfig.technology;
      
      // Merge all field definitions from all technologies
      fieldDefinitions = processedConfigs.flatMap(config => 
        config.fieldDefinitions.map(fd => ({
          ...fd,
          technology: config.technology,
        }))
      );
      
      // Use primary decoder from default scenario if not explicitly set
      const defaultScenario = primaryConfig.scenarios?.find(s => s.isDefault) || primaryConfig.scenarios?.[0];
      if (decoderFunction === undefined) {
        decoderFunction = defaultScenario?.decoderFunction || primaryConfig.decoderFunction;
      }
      if (testPayload === undefined) {
        testPayload = defaultScenario?.testPayload || primaryConfig.testPayload;
      }
    }

    const updated = await this.prisma.deviceProfile.update({
      where: { id },
      data: {
        modelCode: dto.modelCode,
        communicationTechnology,
        integrationType: dto.integrationType,
        fieldDefinitions: fieldDefinitions as any,
        decoderFunction,
        testPayload,
        expectedOutput: dto.expectedOutput as any,
        batteryLifeMonths: dto.batteryLifeMonths,
        specifications: Object.keys(specifications).length > 0 ? specifications : undefined,
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

    this.logger.log(`Updated module profile: ${updated.brand} ${updated.modelCode}`);
    return updated;
  }

  /**
   * Delete module profile
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
      throw new NotFoundException('Module profile not found');
    }

    if (profile._count.devices > 0) {
      throw new BadRequestException(
        `Cannot delete module profile with ${profile._count.devices} associated modules`,
      );
    }

    await this.prisma.deviceProfile.delete({
      where: { id },
    });

    this.logger.log(`Deleted module profile: ${profile.brand} ${profile.modelCode}`);
  }

  /**
   * Test decoder function
   */
  async testDecoder(id: string, payload?: string): Promise<{ success: boolean; output?: any; error?: string }> {
    const profile = await this.findOne(id);

    if (!profile.decoderFunction) {
      throw new BadRequestException('Module profile does not have a decoder function');
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

  // ==========================================================================
  // Decoders Read-Only API (Merged from decoders module)
  // Decoders are now embedded in ModuleProfile - these methods provide
  // a read-only view for the frontend Decoders page
  // ==========================================================================

  /**
   * Get paginated decoders from ModuleProfiles
   * Decoders are stored in ModuleProfile.decoderFunction
   */
  async getDecoders(params: {
    page?: number;
    limit?: number;
    technology?: string;
    brand?: string;
  }): Promise<{
    data: DecoderData[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 30, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      decoderFunction: { not: null }, // Only profiles with decoder functions
    };

    if (params.technology) {
      where.communicationTechnology = params.technology;
    }

    if (params.brand) {
      where.brand = params.brand;
    }

    const [total, moduleProfiles] = await Promise.all([
      this.prisma.deviceProfile.count({ where }),
      this.prisma.deviceProfile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          brand: true,
          modelCode: true,
          communicationTechnology: true,
          decoderFunction: true,
          testPayload: true,
          expectedOutput: true,
          lastTestedAt: true,
          lastTestSucceeded: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Map module profiles to decoder format
    const decoders = moduleProfiles.map((mp): DecoderData => ({
      id: mp.id,
      createdAt: mp.createdAt,
      updatedAt: mp.updatedAt,
      name: `${mp.brand} ${mp.modelCode} Decoder`,
      description: `Decoder for ${mp.brand} ${mp.modelCode} (${mp.communicationTechnology})`,
      technology: mp.communicationTechnology,
      functionCode: mp.decoderFunction || '',
      testPayload: mp.testPayload,
      expectedOutput: mp.expectedOutput as Record<string, unknown> | null,
      lastTestedAt: mp.lastTestedAt,
      lastTestSucceeded: mp.lastTestSucceeded,
      moduleProfileId: mp.id,
      moduleProfile: {
        id: mp.id,
        brand: mp.brand,
        modelCode: mp.modelCode,
      },
    }));

    return {
      data: decoders,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get a single decoder by module profile ID
   */
  async getDecoder(moduleProfileId: string): Promise<DecoderData | null> {
    const mp = await this.prisma.deviceProfile.findUnique({
      where: { id: moduleProfileId },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        brand: true,
        modelCode: true,
        communicationTechnology: true,
        decoderFunction: true,
        testPayload: true,
        expectedOutput: true,
        lastTestedAt: true,
        lastTestSucceeded: true,
      },
    });

    if (!mp || !mp.decoderFunction) {
      return null;
    }

    return {
      id: mp.id,
      createdAt: mp.createdAt,
      updatedAt: mp.updatedAt,
      name: `${mp.brand} ${mp.modelCode} Decoder`,
      description: `Decoder for ${mp.brand} ${mp.modelCode} (${mp.communicationTechnology})`,
      technology: mp.communicationTechnology,
      functionCode: mp.decoderFunction,
      testPayload: mp.testPayload,
      expectedOutput: mp.expectedOutput as Record<string, unknown> | null,
      lastTestedAt: mp.lastTestedAt,
      lastTestSucceeded: mp.lastTestSucceeded,
      moduleProfileId: mp.id,
      moduleProfile: {
        id: mp.id,
        brand: mp.brand,
        modelCode: mp.modelCode,
      },
    };
  }
}

// Type for decoder data representation
export interface DecoderData {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  description: string | null;
  technology: string;
  functionCode: string;
  testPayload: string | null;
  expectedOutput: Record<string, unknown> | null;
  lastTestedAt: Date | null;
  lastTestSucceeded: boolean | null;
  moduleProfileId: string;
  moduleProfile: {
    id: string;
    brand: string;
    modelCode: string;
  };
}

// Export as DeviceProfilesService for backward compatibility
export { ModuleProfilesService as DeviceProfilesService };
