// =============================================================================
// Dashboard Service
// =============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

export interface DashboardStats {
  totalMeters: number;
  totalCustomers: number;
  totalReadings: number;
  totalWaterUsage: number;
  activeAlarms: number;
  metersInMaintenance: number;
  metersOffline: number;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get dashboard statistics
   */
  async getStats(tenantId?: string): Promise<DashboardStats> {
    const tenantFilter = tenantId ? { tenantId } : {};

    // Run all queries in parallel for better performance
    const [
      totalMeters,
      totalCustomers,
      readingsStats,
      activeAlarms,
      metersInMaintenance,
      metersOffline,
    ] = await Promise.all([
      // Total meters count
      this.prisma.meter.count({
        where: tenantFilter,
      }),

      // Total customers count
      this.prisma.customer.count({
        where: tenantFilter,
      }),

      // Total readings and water usage (aggregate)
      this.prisma.reading.aggregate({
        where: tenantId
          ? {
              meter: {
                tenantId,
              },
            }
          : {},
        _count: {
          id: true,
        },
        _sum: {
          consumption: true,
        },
      }),

      // Active alarms count
      this.prisma.alarm.count({
        where: {
          ...(tenantId
            ? {
                meter: {
                  tenantId,
                },
              }
            : {}),
          status: 'ACTIVE',
        },
      }),

      // Meters in maintenance
      this.prisma.meter.count({
        where: {
          ...tenantFilter,
          status: 'MAINTENANCE',
        },
      }),

      // Meters offline (no reading in last 24 hours)
      this.getOfflineMetersCount(tenantId),
    ]);

    return {
      totalMeters,
      totalCustomers,
      totalReadings: readingsStats._count.id || 0,
      totalWaterUsage: Number(readingsStats._sum.consumption || 0),
      activeAlarms,
      metersInMaintenance,
      metersOffline,
    };
  }

  /**
   * Get count of offline meters (no reading in last 24 hours)
   */
  private async getOfflineMetersCount(tenantId?: string): Promise<number> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    try {
      // Get meters that are active but haven't had a reading in the last 24 hours
      // Using a subquery approach that works with Prisma
      const activeMeters = await this.prisma.meter.findMany({
        where: {
          status: 'ACTIVE',
          ...(tenantId ? { tenantId } : {}),
        },
        select: {
          id: true,
          readings: {
            where: {
              time: {
                gte: twentyFourHoursAgo,
              },
            },
            take: 1,
          },
        },
      });

      // Count meters with no recent readings
      return activeMeters.filter((m) => m.readings.length === 0).length;
    } catch (error) {
      this.logger.warn('Failed to get offline meters count', error);
      return 0;
    }
  }
}
