// =============================================================================
// Dashboard Service - Updated for Subscription Model
// =============================================================================
// Provides real-time dashboard statistics, map data, alarms, and consumption
// Address/location is now on Subscription, not Meter
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
  totalSubscriptions: number;
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
  mapStatus: MeterMapStatus;
  hasAlarm: boolean;
  isHighUsage: boolean;
  isOffline: boolean;
  serialNumber: string;
  customerName: string | null;
  address: Record<string, unknown> | null;
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
  date: string;
  timestamp: number;
  consumption: number;
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
   */
  /**
   * Get the effective tenant path for filtering
   * Supports both hierarchical access AND direct tenant assignments for multi-tenant users
   */
  private async getEffectiveTenantPath(user: AuthenticatedUser, tenantId?: string): Promise<string | null> {
    // Platform admin can see everything
    if (user.role === SYSTEM_ROLES.PLATFORM_ADMIN) {
      if (tenantId) {
        const selectedTenant = await this.prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { path: true },
        });
        return selectedTenant?.path || null;
      }
      return null;
    }

    if (tenantId) {
      // Check if user has direct assignment to the requested tenant
      const userTenantAssignment = await this.prisma.userTenant.findFirst({
        where: {
          userId: user.id,
          tenantId: tenantId,
        },
        include: {
          tenant: {
            select: { path: true },
          },
        },
      });

      if (userTenantAssignment) {
        // User has direct assignment to this tenant - allow access
        return userTenantAssignment.tenant.path;
      }

      // Check hierarchical access (user's tenant path contains selected tenant)
      const selectedTenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { path: true },
      });

      if (selectedTenant && selectedTenant.path.startsWith(user.tenantPath)) {
        return selectedTenant.path;
      }

      // No access to requested tenant - fall back to user's primary tenant
      return user.tenantPath;
    }

    // No tenantId specified - use user's primary tenant path
    return user.tenantPath;
  }

  // ===========================================================================
  // GET STATS - Dashboard statistics with real DB queries
  // ===========================================================================

  async getStats(user: AuthenticatedUser, tenantId?: string): Promise<DashboardStats> {
    const effectivePath = await this.getEffectiveTenantPath(user, tenantId);
    const tenantFilter = effectivePath ? this.buildTenantFilterByPath(effectivePath) : {};

    const [
      totalMeters,
      totalCustomers,
      totalSubscriptions,
      readingsStats,
      activeAlarms,
      metersInMaintenance,
      metersOffline,
      totalDevices,
      devicesInWarehouse,
      devicesDeployed,
    ] = await Promise.all([
      this.prisma.meter.count({ where: tenantFilter }),
      this.prisma.customer.count({ where: tenantFilter }),
      this.prisma.subscription.count({ where: tenantFilter }),
      this.prisma.reading.aggregate({
        where: tenantFilter,
        _count: { id: true },
        _sum: { consumption: true },
      }),
      this.prisma.alarm.count({
        where: { ...tenantFilter, status: 'ACTIVE' },
      }),
      this.prisma.meter.count({
        where: { ...tenantFilter, status: 'MAINTENANCE' },
      }),
      this.getOfflineMetersCount(effectivePath),
      this.prisma.device.count({ where: tenantFilter }),
      this.prisma.device.count({
        where: { ...tenantFilter, status: DeviceStatus.WAREHOUSE },
      }),
      this.prisma.device.count({
        where: { ...tenantFilter, status: DeviceStatus.DEPLOYED },
      }),
    ]);

    return {
      totalMeters,
      totalCustomers,
      totalSubscriptions,
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
  // GET MAP DATA - Fetch subscriptions with location and meter info
  // Now uses Subscription.latitude/longitude instead of Meter
  // ===========================================================================

  async getMapData(user: AuthenticatedUser, tenantId?: string): Promise<MeterMapData[]> {
    const effectivePath = await this.getEffectiveTenantPath(user, tenantId);
    const tenantFilter = effectivePath ? this.buildTenantFilterByPath(effectivePath) : {};
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    try {
      // Fetch subscriptions with location and related meter/device info
      const subscriptions = await this.prisma.subscription.findMany({
        where: {
          ...tenantFilter,
          latitude: { not: null },
          longitude: { not: null },
          isActive: true,
        },
        select: {
          id: true,
          latitude: true,
          longitude: true,
          address: true,
          customer: {
            select: {
              customerType: true,
              details: true,
            },
          },
          meters: {
            where: { status: MeterStatus.ACTIVE },
            select: {
              id: true,
              serialNumber: true,
              status: true,
              lastReadingTime: true,
              activeDevice: {
                select: {
                  status: true,
                  lastBatteryLevel: true,
                  lastSignalStrength: true,
                  lastCommunicationAt: true,
                },
              },
              alarms: {
                where: { status: 'ACTIVE' },
                select: { type: true },
              },
              readings: {
                where: { time: { gte: twentyFourHoursAgo } },
                take: 1,
                select: { id: true },
              },
            },
          },
        },
      });

      // Get high-usage threshold
      const highUsageThreshold = 100;

      // Check which meters have high usage in last 24h
      const highUsageMeters = await this.getHighUsageMeters(effectivePath, highUsageThreshold);
      const highUsageMeterIds = new Set(highUsageMeters.map((m) => m.meterId));

      // Transform to map data
      const mapData: MeterMapData[] = [];

      for (const subscription of subscriptions) {
        // Show one point per active meter in the subscription
        for (const meter of subscription.meters) {
          const hasAlarm = meter.alarms.length > 0;
          const isOffline = this.isOffline({
            status: meter.status,
            lastReadingTime: meter.lastReadingTime,
            readings: meter.readings,
            activeDevice: meter.activeDevice,
          });
          const isHighUsage = highUsageMeterIds.has(meter.id);

          let mapStatus: MeterMapStatus = 'normal';
          if (hasAlarm) {
            mapStatus = 'alarm';
          } else if (isOffline) {
            mapStatus = 'offline';
          } else if (isHighUsage) {
            mapStatus = 'high_usage';
          }

          const customerName = this.extractCustomerName(
            subscription.customer?.customerType,
            subscription.customer?.details as Record<string, string> | null,
          );

          mapData.push({
            id: meter.id,
            latitude: Number(subscription.latitude),
            longitude: Number(subscription.longitude),
            status: meter.status,
            mapStatus,
            hasAlarm,
            isHighUsage,
            isOffline,
            serialNumber: meter.serialNumber,
            customerName,
            address: subscription.address as Record<string, unknown> | null,
            batteryLevel: meter.activeDevice?.lastBatteryLevel ?? null,
            signalStrength: meter.activeDevice?.lastSignalStrength ?? null,
            lastCommunicationAt: meter.activeDevice?.lastCommunicationAt?.toISOString() ?? null,
          });
        }
      }

      return mapData;
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
              subscription: {
                select: {
                  customer: {
                    select: {
                      customerType: true,
                      details: true,
                    },
                  },
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
          alarm.meter.subscription?.customer?.customerType,
          alarm.meter.subscription?.customer?.details as Record<string, string> | null,
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
      
      let tenantIds: string[] = [];
      
      if (effectivePath) {
        const accessibleTenants = await this.prisma.tenant.findMany({
          where: { path: { startsWith: effectivePath } },
          select: { id: true },
        });
        tenantIds = accessibleTenants.map(t => t.id);
      }

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
      return this.getConsumptionChartFallback(effectivePath, days);
    }
  }

  // ===========================================================================
  // Private Helper Methods
  // ===========================================================================

  private isOffline(meter: {
    status: MeterStatus;
    lastReadingTime: Date | null;
    readings: { id: string }[];
    activeDevice: {
      status: DeviceStatus;
      lastCommunicationAt: Date | null;
    } | null;
  }): boolean {
    if (meter.status !== 'ACTIVE') return false;

    if (!meter.activeDevice) {
      return meter.readings.length === 0;
    }

    if (meter.activeDevice.status !== 'DEPLOYED') {
      return true;
    }

    if (!meter.activeDevice.lastCommunicationAt) {
      return meter.readings.length === 0;
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return (
      meter.activeDevice.lastCommunicationAt < twentyFourHoursAgo &&
      meter.readings.length === 0
    );
  }

  private async getOfflineMetersCount(tenantPath: string | null): Promise<number> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const tenantFilter = tenantPath ? this.buildTenantFilterByPath(tenantPath) : {};

    try {
      const activeMeters = await this.prisma.meter.findMany({
        where: { status: 'ACTIVE', ...tenantFilter },
        select: {
          id: true,
          status: true,
          lastReadingTime: true,
          readings: {
            where: { time: { gte: twentyFourHoursAgo } },
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

  private async getHighUsageMeters(
    tenantPath: string | null,
    thresholdM3: number,
  ): Promise<{ meterId: string; totalConsumption: number }[]> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const tenantFilter = tenantPath ? this.buildTenantFilterByPath(tenantPath) : {};

    try {
      const result = await this.prisma.reading.groupBy({
        by: ['meterId'],
        where: { time: { gte: twentyFourHoursAgo }, ...tenantFilter },
        _sum: { consumption: true },
        having: {
          consumption: { _sum: { gte: thresholdM3 } },
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

  private async getConsumptionChartFallback(
    tenantPath: string | null,
    days: number,
  ): Promise<ConsumptionDataPoint[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    const tenantFilter = tenantPath ? this.buildTenantFilterByPath(tenantPath) : {};

    try {
      const readings = await this.prisma.reading.findMany({
        where: { time: { gte: startDate }, ...tenantFilter },
        select: { time: true, consumption: true },
        orderBy: { time: 'asc' },
      });

      const dailyMap = new Map<string, number>();

      for (const reading of readings) {
        const dateKey = reading.time.toISOString().split('T')[0];
        const current = dailyMap.get(dateKey) || 0;
        dailyMap.set(dateKey, current + Number(reading.consumption));
      }

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
