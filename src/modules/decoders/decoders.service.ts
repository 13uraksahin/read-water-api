// =============================================================================
// Decoders Service
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
  version: number;
  isActive: boolean;
  testPayload: string | null;
  expectedOutput: Record<string, unknown> | null;
  lastTestedAt: Date | null;
  lastTestSucceeded: boolean | null;
  profileId: string | null;
  profile: {
    id: string;
    brand: string;
    modelCode: string;
  } | null;
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
  isActive?: boolean;
}

@Injectable()
export class DecodersService {
  private readonly logger = new Logger(DecodersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get paginated decoders
   */
  async getDecoders(params: DecodersQueryParams): Promise<PaginatedDecoders> {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 30, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (params.technology) {
      where.communicationTechnology = params.technology;
    }

    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    const [total, decoders] = await Promise.all([
      this.prisma.decoderFunction.count({ where }),
      this.prisma.decoderFunction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Get associated profiles from metadata
    const decodersWithProfiles = await Promise.all(
      decoders.map(async (d) => {
        const metadata = d.metadata as Record<string, unknown> | null;
        const profileId = metadata?.profileId as string | undefined;
        
        let profile = null;
        if (profileId) {
          const foundProfile = await this.prisma.meterProfile.findUnique({
            where: { id: profileId },
            select: {
              id: true,
              brand: true,
              modelCode: true,
            },
          });
          if (foundProfile) {
            profile = {
              id: foundProfile.id,
              brand: foundProfile.brand,
              modelCode: foundProfile.modelCode,
            };
          }
        }

        return this.mapDecoder(d, profileId || null, profile);
      }),
    );

    return {
      data: decodersWithProfiles,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  private mapDecoder(
    decoder: any,
    profileId: string | null,
    profile: { id: string; brand: string; modelCode: string } | null,
  ): DecoderData {
    return {
      id: decoder.id,
      createdAt: decoder.createdAt,
      updatedAt: decoder.updatedAt,
      name: decoder.name,
      description: decoder.description,
      technology: decoder.communicationTechnology,
      functionCode: decoder.code,
      version: decoder.version,
      isActive: decoder.isActive,
      testPayload: decoder.testPayload,
      expectedOutput: decoder.expectedOutput as Record<string, unknown> | null,
      lastTestedAt: decoder.lastTestedAt,
      lastTestSucceeded: decoder.lastTestSucceeded,
      profileId,
      profile,
    };
  }
}
