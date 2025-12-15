// =============================================================================
// Dashboard Service
// =============================================================================
// Provides real-time dashboard statistics, map data, alarms, and consumption
// charts by querying the actual database (Asset/Device separation architecture)
// CRITICAL: All queries are filtered by user's tenant hierarchy
// =============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AlarmType, AlarmStatus, MeterStatus, DeviceStatus } from '@prisma/client';
import { AuthenticatedUser } from '../../common/interfaces';
import { SYSTEM_ROLES } from '../../common/constants';

// =============================================================================
// Interfaces
// =============================================================================

export interface DashboardStats {
  totalMeters: number;
  totalCustomers: number;
  totalReadings: number;
  totalWaterUsage: number;
  activeAlarms: number;
  metersInMaintenance: number;
  metersOffline: number;
  // Device stats (Asset/Device separation)
  totalDevices: number;
  devicesInWarehouse: number;
  devicesDeployed: number;
}

export type MeterMapStatus = 'alarm' | 'high_usage' | 'normal' | 'offline';

export interface MeterMapData {
  id: string;
  latitude: number;
  longitude: number;
  status: MeterStatus;
  mapStatus: MeterMapStatus; // Computed color status
  hasAlarm: boolean;
  isHighUsage: boolean;
  isOffline: boolean;
  serialNumber: string;
  customerName: string | null;
  // Device info (from joined activeDevice)
  batteryLevel: number | null;
  signalStrength: number | null;
  lastCommunicationAt: string | null;
}

export interface DashboardAlarm {
  id: string;
  type: AlarmType;
  status: AlarmStatus;
  severity: number;
  message: string | null;
  createdAt: Date;
  meterSerial: string;
  customerName: string | null;
}

export interface ConsumptionDataPoint {
  date: string; // ISO date string (YYYY-MM-DD)
  timestamp: number; // Unix timestamp in ms for charts
  consumption: number; // Total consumption for that day
}

// =============================================================================
// Service
// =============================================================================

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Build tenant filter based on user's access and selected tenant
   * CRITICAL: Uses tenant path hierarchy for proper filtering
   * @param tenantPath - The tenant path to filter by (either user's or selected tenant's)
   */
  private buildTenantFilterByPath(tenantPath: string): Record<string, any> {
    return {
      tenant: {
        path: {
          startsWith: tenantPath,
        },
      },
    };
  }

  /**
   * Get the effective tenant path for filtering
   * - If tenantId is provided, use that tenant's path (after access check)
   * - Otherwise, use user's tenant path
   * - Platform admin with no filter sees everything
   */
  private async getEffectiveTenantPath(user: AuthenticatedUser, tenantId?: string): Promise<string | null> {
    // If specific tenant selected, look up its path
    if (tenantId) {
      const selectedTenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { path: true },
      });

      if (!selectedTenant) {
        return user.tenantPath; // Fallback to user's tenant
      }

      // For non-admin users, verify they have access to the selected tenant
      if (user.role !== SYSTEM_ROLES.PLATFORM_ADMIN) {
        if (!selectedTenant.path.startsWith(user.tenantPath)) {
          return user.tenantPath; // No access, fallback to user's tenant
        }
      }

      return selectedTenant.path;
    }

    // No tenant selected - Platform admin sees all, others see their hierarchy
    if (user.role === SYSTEM_ROLES.PLATFORM_ADMIN) {
      return null; // No filter for platform admin without tenant selection
    }

    return user.tenantPath;
  }

  // ===========================================================================
  // GET STATS - Dashboard statistics with real DB queries
  // ===========================================================================

  async getStats(user: AuthenticatedUser, tenantId?: string): Promise<DashboardStats> {
    const effectivePath = await this.getEffectiveTenantPath(user, tenantId);
    const tenantFilter = effectivePath ? this.buildTenantFilterByPath(effectivePath) : {};

    // Run all queries in parallel for better performance
    const [
      totalMeters,
      totalCustomers,
      readingsStats,
      activeAlarms,
      metersInMaintenance,
      metersOffline,
      totalDevices,
      devicesInWarehouse,
      devicesDeployed,
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
        where: tenantFilter,
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
          ...tenantFilter,
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
      this.getOfflineMetersCount(effectivePath),

      // Device stats
      this.prisma.device.count({
        where: tenantFilter,
      }),

      this.prisma.device.count({
        where: {
          ...tenantFilter,
          status: DeviceStatus.WAREHOUSE,
        },
      }),

      this.prisma.device.count({
        where: {
          ...tenantFilter,
          status: DeviceStatus.DEPLOYED,
        },
      }),
    ]);

    return {
      totalMeters,
      totalCustomers,
      totalReadings: readingsStats._count.id || 0,
      totalWaterUsage: Number(readingsStats._sum.consumption || 0),
      activeAlarms,
      metersInMaintenance,
      metersOffline,
      totalDevices,
      devicesInWarehouse,
      devicesDeployed,
    };
  }

  // ===========================================================================
  // GET MAP DATA - Fetch meters with location and device info
  // ===========================================================================

  async getMapData(user: AuthenticatedUser, tenantId?: string): Promise<MeterMapData[]> {
    const effectivePath = await this.getEffectiveTenantPath(user, tenantId);
    const tenantFilter = effectivePath ? this.buildTenantFilterByPath(effectivePath) : {};
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    try {
      // Fetch meters with location, customer, device, and alarm info
      const meters = await this.prisma.meter.findMany({
        where: {
          ...tenantFilter,
          // Only meters with valid coordinates
          latitude: { not: null },
          longitude: { not: null },
        },
        select: {
          id: true,
          serialNumber: true,
          status: true,
          latitude: true,
          longitude: true,
          lastReadingTime: true,
          // Customer relation for name
          customer: {
            select: {
              customerType: true,
              details: true,
            },
          },
          // CRITICAL JOIN: Include activeDevice for battery/signal status
          activeDevice: {
            select: {
              status: true,
              lastBatteryLevel: true,
              lastSignalStrength: true,
              lastCommunicationAt: true,
            },
          },
          // Active alarms on this meter
          alarms: {
            where: {
              status: 'ACTIVE',
            },
            select: {
              type: true,
            },
          },
          // Check for recent readings to determine offline status
          readings: {
            where: {
              time: { gte: twentyFourHoursAgo },
            },
            take: 1,
            select: { id: true },
          },
        },
      });

      // Get high-usage threshold (could be from settings)
      const highUsageThreshold = 100; // m³/day - configurable

      // Check which meters have high usage in last 24h
      const highUsageMeters = await this.getHighUsageMeters(
        effectivePath,
        highUsageThreshold,
      );
      const highUsageMeterIds = new Set(highUsageMeters.map((m) => m.meterId));

      // Transform to map data
      return meters.map((meter) => {
        const hasAlarm = meter.alarms.length > 0;
        const isOffline = this.isOffline(meter);
        const isHighUsage = highUsageMeterIds.has(meter.id);

        // Determine map status color priority: alarm > offline > high_usage > normal
        let mapStatus: MeterMapStatus = 'normal';
        if (hasAlarm) {
          mapStatus = 'alarm';
        } else if (isOffline) {
          mapStatus = 'offline';
        } else if (isHighUsage) {
          mapStatus = 'high_usage';
        }

        // Extract customer name from dynamic details
        const customerName = this.extractCustomerName(
          meter.customer?.customerType,
          meter.customer?.details as Record<string, string> | null,
        );

        return {
          id: meter.id,
          latitude: Number(meter.latitude),
          longitude: Number(meter.longitude),
          status: meter.status,
          mapStatus,
          hasAlarm,
          isHighUsage,
          isOffline,
          serialNumber: meter.serialNumber,
          customerName,
          batteryLevel: meter.activeDevice?.lastBatteryLevel ?? null,
          signalStrength: meter.activeDevice?.lastSignalStrength ?? null,
          lastCommunicationAt:
            meter.activeDevice?.lastCommunicationAt?.toISOString() ?? null,
        };
      });
    } catch (error) {
      this.logger.error('Failed to get map data', error);
      return [];
    }
  }

  // ===========================================================================
  // GET ALARMS - Fetch active alarms for alarm panel
  // ===========================================================================

  async getAlarms(user: AuthenticatedUser, tenantId?: string, limit = 20): Promise<DashboardAlarm[]> {
    const effectivePath = await this.getEffectiveTenantPath(user, tenantId);
    const tenantFilter = effectivePath ? this.buildTenantFilterByPath(effectivePath) : {};

    try {
      const alarms = await this.prisma.alarm.findMany({
        where: {
          status: 'ACTIVE',
          ...tenantFilter,
        },
        orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        include: {
          meter: {
            select: {
              serialNumber: true,
              customer: {
                select: {
                  customerType: true,
                  details: true,
                },
              },
            },
          },
        },
      });

      return alarms.map((alarm) => ({
        id: alarm.id,
        type: alarm.type,
        status: alarm.status,
        severity: alarm.severity,
        message: alarm.message,
        createdAt: alarm.createdAt,
        meterSerial: alarm.meter.serialNumber,
        customerName: this.extractCustomerName(
          alarm.meter.customer?.customerType,
          alarm.meter.customer?.details as Record<string, string> | null,
        ),
      }));
    } catch (error) {
      this.logger.error('Failed to get alarms', error);
      return [];
    }
  }

  // ===========================================================================
  // GET CONSUMPTION CHART - Daily consumption for last N days
  // ===========================================================================

  async getConsumptionChart(
    user: AuthenticatedUser,
    tenantId?: string,
    days = 30,
  ): Promise<ConsumptionDataPoint[]> {
    const effectivePath = await this.getEffectiveTenantPath(user, tenantId);
    
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);
      
      // Get tenant IDs based on effective path
      let tenantIds: string[] = [];
      
      if (effectivePath) {
        // Get all tenants within the hierarchy
        const accessibleTenants = await this.prisma.tenant.findMany({
          where: {
            path: {
              startsWith: effectivePath,
            },
          },
          select: { id: true },
        });
        tenantIds = accessibleTenants.map(t => t.id);
      }

      // Use raw SQL for TimescaleDB time_bucket aggregation
      // This is more efficient than Prisma for time-series data
      let result: { bucket: Date; total_consumption: bigint | number | null }[];
      
      if (tenantIds.length > 0) {
        result = await this.prisma.$queryRaw`
          SELECT 
            time_bucket('1 day', time) AS bucket,
            SUM(consumption) AS total_consumption
          FROM readings
          WHERE 
            time >= ${startDate}
            AND tenant_id = ANY(${tenantIds}::uuid[])
          GROUP BY bucket
          ORDER BY bucket ASC
        `;
      } else {
        // No path filter (platform admin with no tenant selected) - show all
        result = await this.prisma.$queryRaw`
          SELECT 
            time_bucket('1 day', time) AS bucket,
            SUM(consumption) AS total_consumption
          FROM readings
          WHERE time >= ${startDate}
          GROUP BY bucket
          ORDER BY bucket ASC
        `;
      }

      // Transform to ConsumptionDataPoint array
      return result.map((row) => {
        const date = new Date(row.bucket);
        return {
          date: date.toISOString().split('T')[0],
          timestamp: date.getTime(),
          consumption: Number(row.total_consumption || 0),
        };
      });
    } catch (error) {
      this.logger.error('Failed to get consumption chart data', error);

      // Fallback: Try simple Prisma aggregation if raw query fails
      return this.getConsumptionChartFallback(effectivePath, days);
    }
  }

  // ===========================================================================
  // Private Helper Methods
  // ===========================================================================

  /**
   * Check if a meter is offline (no recent reading or no device communication)
   */
  private isOffline(meter: {
    status: MeterStatus;
    lastReadingTime: Date | null;
    readings: { id: string }[];
    activeDevice: {
      status: DeviceStatus;
      lastCommunicationAt: Date | null;
    } | null;
  }): boolean {
    // Meter not active = not considered offline
    if (meter.status !== 'ACTIVE') return false;

    // No device attached and no recent readings
    if (!meter.activeDevice) {
      return meter.readings.length === 0;
    }

    // Device is not deployed
    if (meter.activeDevice.status !== 'DEPLOYED') {
      return true;
    }

    // No communication in 24h
    if (!meter.activeDevice.lastCommunicationAt) {
      return meter.readings.length === 0;
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return (
      meter.activeDevice.lastCommunicationAt < twentyFourHoursAgo &&
      meter.readings.length === 0
    );
  }

  /**
   * Get count of offline meters
   */
  private async getOfflineMetersCount(tenantPath: string | null): Promise<number> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const tenantFilter = tenantPath ? this.buildTenantFilterByPath(tenantPath) : {};

    try {
      const activeMeters = await this.prisma.meter.findMany({
        where: {
          status: 'ACTIVE',
          ...tenantFilter,
        },
        select: {
          id: true,
          status: true,
          lastReadingTime: true,
          readings: {
            where: {
              time: { gte: twentyFourHoursAgo },
            },
            take: 1,
            select: { id: true },
          },
          activeDevice: {
            select: {
              status: true,
              lastCommunicationAt: true,
            },
          },
        },
      });

      return activeMeters.filter((m) =>
        this.isOffline({
          status: m.status,
          lastReadingTime: m.lastReadingTime,
          readings: m.readings,
          activeDevice: m.activeDevice,
        }),
      ).length;
    } catch (error) {
      this.logger.warn('Failed to get offline meters count', error);
      return 0;
    }
  }

  /**
   * Get meters with high usage in last 24h
   */
  private async getHighUsageMeters(
    tenantPath: string | null,
    thresholdM3: number,
  ): Promise<{ meterId: string; totalConsumption: number }[]> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const tenantFilter = tenantPath ? this.buildTenantFilterByPath(tenantPath) : {};

    try {
      const result = await this.prisma.reading.groupBy({
        by: ['meterId'],
        where: {
          time: { gte: twentyFourHoursAgo },
          ...tenantFilter,
        },
        _sum: {
          consumption: true,
        },
        having: {
          consumption: {
            _sum: {
              gte: thresholdM3,
            },
          },
        },
      });

      return result.map((r) => ({
        meterId: r.meterId,
        totalConsumption: Number(r._sum.consumption || 0),
      }));
    } catch (error) {
      this.logger.warn('Failed to get high usage meters', error);
      return [];
    }
  }

  /**
   * Extract customer name from dynamic details
   */
  private extractCustomerName(
    customerType: string | undefined,
    details: Record<string, string> | null,
  ): string | null {
    if (!details) return null;

    if (customerType === 'INDIVIDUAL') {
      const firstName = details.firstName || '';
      const lastName = details.lastName || '';
      return `${firstName} ${lastName}`.trim() || null;
    } else if (customerType === 'ORGANIZATIONAL') {
      return details.organizationName || null;
    }

    return null;
  }

  /**
   * Fallback consumption chart using Prisma (if raw SQL fails)
   */
  private async getConsumptionChartFallback(
    tenantPath: string | null,
    days: number,
  ): Promise<ConsumptionDataPoint[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    const tenantFilter = tenantPath ? this.buildTenantFilterByPath(tenantPath) : {};

    try {
      // Get all readings in range
      const readings = await this.prisma.reading.findMany({
        where: {
          time: { gte: startDate },
          ...tenantFilter,
        },
        select: {
          time: true,
          consumption: true,
        },
        orderBy: { time: 'asc' },
      });

      // Group by day manually
      const dailyMap = new Map<string, number>();

      for (const reading of readings) {
        const dateKey = reading.time.toISOString().split('T')[0];
        const current = dailyMap.get(dateKey) || 0;
        dailyMap.set(dateKey, current + Number(reading.consumption));
      }

      // Convert to array
      return Array.from(dailyMap.entries())
        .map(([date, consumption]) => ({
          date,
          timestamp: new Date(date).getTime(),
          consumption,
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      this.logger.error('Fallback consumption chart also failed', error);
      return [];
    }
  }
}
