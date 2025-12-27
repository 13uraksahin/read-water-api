// =============================================================================
// Alarms Service - Updated for Subscription Model
// =============================================================================
// Address/location is now on Subscription, not Meter
// =============================================================================

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

export interface AlarmData {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
  meterId: string;
  type: string;
  status: string;
  severity: number;
  message: string | null;
  details: Record<string, unknown> | null;
  acknowledgedAt: Date | null;
  acknowledgedBy: string | null;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  resolution: string | null;
  meter?: {
    id: string;
    serialNumber: string;
    // Location now comes from subscription
    latitude: number | null;
    longitude: number | null;
    address: Record<string, unknown> | null;
  };
  tenant?: {
    id: string;
    name: string;
  };
}

export interface PaginatedAlarms {
  data: AlarmData[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AlarmsQueryParams {
  page?: number;
  limit?: number;
  tenantId?: string;
  meterId?: string;
  status?: string;
  type?: string;
  severity?: number;
}

@Injectable()
export class AlarmsService {
  private readonly logger = new Logger(AlarmsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get paginated alarms
   */
  async getAlarms(params: AlarmsQueryParams): Promise<PaginatedAlarms> {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 30, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (params.tenantId) {
      where.tenantId = params.tenantId;
    }

    if (params.meterId) {
      where.meterId = params.meterId;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.type) {
      where.type = params.type;
    }

    if (params.severity !== undefined) {
      where.severity = params.severity;
    }

    const [total, alarms] = await Promise.all([
      this.prisma.alarm.count({ where }),
      this.prisma.alarm.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          meter: {
            select: {
              id: true,
              serialNumber: true,
              // Address/location now comes from subscription
              subscription: {
                select: {
                  latitude: true,
                  longitude: true,
                  address: true,
                },
              },
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: alarms.map((a) => this.mapAlarm(a)),
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get a single alarm by ID
   */
  async getAlarm(id: string): Promise<AlarmData> {
    const alarm = await this.prisma.alarm.findUnique({
      where: { id },
      include: {
        meter: {
          select: {
            id: true,
            serialNumber: true,
            subscription: {
              select: {
                latitude: true,
                longitude: true,
                address: true,
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!alarm) {
      throw new NotFoundException(`Alarm with ID ${id} not found`);
    }

    return this.mapAlarm(alarm);
  }

  /**
   * Acknowledge an alarm
   */
  async acknowledgeAlarm(id: string, userId: string): Promise<AlarmData> {
    const existing = await this.prisma.alarm.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Alarm with ID ${id} not found`);
    }

    const alarm = await this.prisma.alarm.update({
      where: { id },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
        acknowledgedBy: userId,
      },
      include: {
        meter: {
          select: {
            id: true,
            serialNumber: true,
            subscription: {
              select: {
                latitude: true,
                longitude: true,
                address: true,
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.mapAlarm(alarm);
  }

  /**
   * Resolve an alarm
   */
  async resolveAlarm(id: string, userId: string, resolution?: string): Promise<AlarmData> {
    const existing = await this.prisma.alarm.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Alarm with ID ${id} not found`);
    }

    const alarm = await this.prisma.alarm.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedBy: userId,
        resolution,
      },
      include: {
        meter: {
          select: {
            id: true,
            serialNumber: true,
            subscription: {
              select: {
                latitude: true,
                longitude: true,
                address: true,
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.mapAlarm(alarm);
  }

  private mapAlarm(alarm: any): AlarmData {
    // Extract location/address from subscription
    const subscription = alarm.meter?.subscription;
    
    return {
      id: alarm.id,
      createdAt: alarm.createdAt,
      updatedAt: alarm.updatedAt,
      tenantId: alarm.tenantId,
      meterId: alarm.meterId,
      type: alarm.type,
      status: alarm.status,
      severity: alarm.severity,
      message: alarm.message,
      details: alarm.details as Record<string, unknown> | null,
      acknowledgedAt: alarm.acknowledgedAt,
      acknowledgedBy: alarm.acknowledgedBy,
      resolvedAt: alarm.resolvedAt,
      resolvedBy: alarm.resolvedBy,
      resolution: alarm.resolution,
      meter: alarm.meter
        ? {
            id: alarm.meter.id,
            serialNumber: alarm.meter.serialNumber,
            // Location from subscription
            latitude: subscription?.latitude ? Number(subscription.latitude) : null,
            longitude: subscription?.longitude ? Number(subscription.longitude) : null,
            address: subscription?.address as Record<string, unknown> | null,
          }
        : undefined,
      tenant: alarm.tenant
        ? {
            id: alarm.tenant.id,
            name: alarm.tenant.name,
          }
        : undefined,
    };
  }
}
