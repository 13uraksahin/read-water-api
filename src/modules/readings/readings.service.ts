// =============================================================================
// Readings Service
// =============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuthenticatedUser } from '../../common/interfaces';
import { SYSTEM_ROLES } from '../../common/constants';

export interface ReadingWithMeter {
  id: string;
  time: Date;
  meterId: string;
  value: number;
  consumption: number;
  unit: string;
  signalStrength: number | null;
  batteryLevel: number | null;
  temperature: number | null;
  rawPayload: Record<string, unknown> | null;
  source: string | null;
  sourceDeviceId: string | null;
  communicationTechnology: string | null;
  processedAt: Date | null;
  decoderUsed: string | null;
  meter?: {
    id: string;
    serialNumber: string;
    tenantId: string;
    customer?: {
      id: string;
      details: Record<string, unknown>;
    } | null;
  };
}

export interface PaginatedReadings {
  data: ReadingWithMeter[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ReadingsQueryParams {
  page?: number;
  limit?: number;
  meterId?: string;
  tenantId?: string;
  sourceDeviceId?: string;
}

@Injectable()
export class ReadingsService {
  private readonly logger = new Logger(ReadingsService.name);

  constructor(private readonly prisma: PrismaService) {}

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
   * Get paginated readings with tenant filtering
   */
  async getReadings(params: ReadingsQueryParams, user: AuthenticatedUser): Promise<PaginatedReadings> {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 30, 100); // Max 100 per page
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    // Get effective tenant path for filtering
    const effectivePath = await this.getEffectiveTenantPath(user, params.tenantId);
    
    if (effectivePath) {
      where.tenant = {
        path: {
          startsWith: effectivePath,
        },
      };
    }
    
    if (params.meterId) {
      where.meterId = params.meterId;
    }
    
    if (params.sourceDeviceId) {
      where.sourceDeviceId = params.sourceDeviceId;
    }

    // Run count and find in parallel
    const [total, readings] = await Promise.all([
      this.prisma.reading.count({ where }),
      this.prisma.reading.findMany({
        where,
        orderBy: {
          time: 'desc',
        },
        skip,
        take: limit,
        include: {
          meter: {
            select: {
              id: true,
              serialNumber: true,
              tenantId: true,
              customer: {
                select: {
                  id: true,
                  details: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: readings.map((r) => ({
        id: r.id,
        time: r.time,
        meterId: r.meterId,
        value: Number(r.value),
        consumption: Number(r.consumption),
        unit: r.unit,
        signalStrength: r.signalStrength,
        batteryLevel: r.batteryLevel,
        temperature: r.temperature ? Number(r.temperature) : null,
        rawPayload: r.rawPayload as Record<string, unknown> | null,
        source: r.source,
        sourceDeviceId: r.sourceDeviceId,
        communicationTechnology: r.communicationTechnology,
        processedAt: r.processedAt,
        decoderUsed: r.decoderUsed,
        meter: r.meter
          ? {
              id: r.meter.id,
              serialNumber: r.meter.serialNumber,
              tenantId: r.meter.tenantId,
              customer: r.meter.customer
                ? {
                    id: r.meter.customer.id,
                    details: r.meter.customer.details as Record<string, unknown>,
                  }
                : null,
            }
          : undefined,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get readings for a specific meter
   */
  async getMeterReadings(
    meterId: string,
    params: { page?: number; limit?: number },
    user: AuthenticatedUser,
  ): Promise<PaginatedReadings> {
    return this.getReadings({
      ...params,
      meterId,
    }, user);
  }
}
