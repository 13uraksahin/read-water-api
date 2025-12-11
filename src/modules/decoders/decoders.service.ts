// =============================================================================
// Decoders Service - Refactored for Asset/Device Split
// =============================================================================
// NOW: Decoder functions are stored in DeviceProfile, not separate model
// =============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

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
  deviceProfileId: string;
  deviceProfile: {
    id: string;
    brand: string;
    modelCode: string;
  };
}

export interface PaginatedDecoders {
  data: DecoderData[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DecodersQueryParams {
  page?: number;
  limit?: number;
  technology?: string;
  brand?: string;
}

@Injectable()
export class DecodersService {
  private readonly logger = new Logger(DecodersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get paginated decoders from DeviceProfiles
   * Decoders are now stored in DeviceProfile.decoderFunction
   */
  async getDecoders(params: DecodersQueryParams): Promise<PaginatedDecoders> {
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

    const [total, deviceProfiles] = await Promise.all([
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

    // Map device profiles to decoder format
    const decoders = deviceProfiles.map((dp): DecoderData => ({
      id: dp.id,
      createdAt: dp.createdAt,
      updatedAt: dp.updatedAt,
      name: `${dp.brand} ${dp.modelCode} Decoder`,
      description: `Decoder for ${dp.brand} ${dp.modelCode} (${dp.communicationTechnology})`,
      technology: dp.communicationTechnology,
      functionCode: dp.decoderFunction || '',
      testPayload: dp.testPayload,
      expectedOutput: dp.expectedOutput as Record<string, unknown> | null,
      lastTestedAt: dp.lastTestedAt,
      lastTestSucceeded: dp.lastTestSucceeded,
      deviceProfileId: dp.id,
      deviceProfile: {
        id: dp.id,
        brand: dp.brand,
        modelCode: dp.modelCode,
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
   * Get a single decoder by device profile ID
   */
  async getDecoder(deviceProfileId: string): Promise<DecoderData | null> {
    const dp = await this.prisma.deviceProfile.findUnique({
      where: { id: deviceProfileId },
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

    if (!dp || !dp.decoderFunction) {
      return null;
    }

    return {
      id: dp.id,
      createdAt: dp.createdAt,
      updatedAt: dp.updatedAt,
      name: `${dp.brand} ${dp.modelCode} Decoder`,
      description: `Decoder for ${dp.brand} ${dp.modelCode} (${dp.communicationTechnology})`,
      technology: dp.communicationTechnology,
      functionCode: dp.decoderFunction,
      testPayload: dp.testPayload,
      expectedOutput: dp.expectedOutput as Record<string, unknown> | null,
      lastTestedAt: dp.lastTestedAt,
      lastTestSucceeded: dp.lastTestSucceeded,
      deviceProfileId: dp.id,
      deviceProfile: {
        id: dp.id,
        brand: dp.brand,
        modelCode: dp.modelCode,
      },
    };
  }
}
