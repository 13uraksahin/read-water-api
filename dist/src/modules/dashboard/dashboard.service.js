"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DashboardService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const client_1 = require("@prisma/client");
const constants_1 = require("../../common/constants");
let DashboardService = DashboardService_1 = class DashboardService {
    prisma;
    logger = new common_1.Logger(DashboardService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    buildTenantFilterByPath(tenantPath) {
        return {
            tenant: {
                path: {
                    startsWith: tenantPath,
                },
            },
        };
    }
    async getEffectiveTenantPath(user, tenantId) {
        if (tenantId) {
            const selectedTenant = await this.prisma.tenant.findUnique({
                where: { id: tenantId },
                select: { path: true },
            });
            if (!selectedTenant) {
                return user.tenantPath;
            }
            if (user.role !== constants_1.SYSTEM_ROLES.PLATFORM_ADMIN) {
                if (!selectedTenant.path.startsWith(user.tenantPath)) {
                    return user.tenantPath;
                }
            }
            return selectedTenant.path;
        }
        if (user.role === constants_1.SYSTEM_ROLES.PLATFORM_ADMIN) {
            return null;
        }
        return user.tenantPath;
    }
    async getStats(user, tenantId) {
        const effectivePath = await this.getEffectiveTenantPath(user, tenantId);
        const tenantFilter = effectivePath ? this.buildTenantFilterByPath(effectivePath) : {};
        const [totalMeters, totalCustomers, readingsStats, activeAlarms, metersInMaintenance, metersOffline, totalDevices, devicesInWarehouse, devicesDeployed,] = await Promise.all([
            this.prisma.meter.count({
                where: tenantFilter,
            }),
            this.prisma.customer.count({
                where: tenantFilter,
            }),
            this.prisma.reading.aggregate({
                where: tenantFilter,
                _count: {
                    id: true,
                },
                _sum: {
                    consumption: true,
                },
            }),
            this.prisma.alarm.count({
                where: {
                    ...tenantFilter,
                    status: 'ACTIVE',
                },
            }),
            this.prisma.meter.count({
                where: {
                    ...tenantFilter,
                    status: 'MAINTENANCE',
                },
            }),
            this.getOfflineMetersCount(effectivePath),
            this.prisma.device.count({
                where: tenantFilter,
            }),
            this.prisma.device.count({
                where: {
                    ...tenantFilter,
                    status: client_1.DeviceStatus.WAREHOUSE,
                },
            }),
            this.prisma.device.count({
                where: {
                    ...tenantFilter,
                    status: client_1.DeviceStatus.DEPLOYED,
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
    async getMapData(user, tenantId) {
        const effectivePath = await this.getEffectiveTenantPath(user, tenantId);
        const tenantFilter = effectivePath ? this.buildTenantFilterByPath(effectivePath) : {};
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        try {
            const meters = await this.prisma.meter.findMany({
                where: {
                    ...tenantFilter,
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
                    customer: {
                        select: {
                            customerType: true,
                            details: true,
                        },
                    },
                    activeDevice: {
                        select: {
                            status: true,
                            lastBatteryLevel: true,
                            lastSignalStrength: true,
                            lastCommunicationAt: true,
                        },
                    },
                    alarms: {
                        where: {
                            status: 'ACTIVE',
                        },
                        select: {
                            type: true,
                        },
                    },
                    readings: {
                        where: {
                            time: { gte: twentyFourHoursAgo },
                        },
                        take: 1,
                        select: { id: true },
                    },
                },
            });
            const highUsageThreshold = 100;
            const highUsageMeters = await this.getHighUsageMeters(effectivePath, highUsageThreshold);
            const highUsageMeterIds = new Set(highUsageMeters.map((m) => m.meterId));
            return meters.map((meter) => {
                const hasAlarm = meter.alarms.length > 0;
                const isOffline = this.isOffline(meter);
                const isHighUsage = highUsageMeterIds.has(meter.id);
                let mapStatus = 'normal';
                if (hasAlarm) {
                    mapStatus = 'alarm';
                }
                else if (isOffline) {
                    mapStatus = 'offline';
                }
                else if (isHighUsage) {
                    mapStatus = 'high_usage';
                }
                const customerName = this.extractCustomerName(meter.customer?.customerType, meter.customer?.details);
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
                    lastCommunicationAt: meter.activeDevice?.lastCommunicationAt?.toISOString() ?? null,
                };
            });
        }
        catch (error) {
            this.logger.error('Failed to get map data', error);
            return [];
        }
    }
    async getAlarms(user, tenantId, limit = 20) {
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
                customerName: this.extractCustomerName(alarm.meter.customer?.customerType, alarm.meter.customer?.details),
            }));
        }
        catch (error) {
            this.logger.error('Failed to get alarms', error);
            return [];
        }
    }
    async getConsumptionChart(user, tenantId, days = 30) {
        const effectivePath = await this.getEffectiveTenantPath(user, tenantId);
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            startDate.setHours(0, 0, 0, 0);
            let tenantIds = [];
            if (effectivePath) {
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
            let result;
            if (tenantIds.length > 0) {
                result = await this.prisma.$queryRaw `
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
            }
            else {
                result = await this.prisma.$queryRaw `
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
        }
        catch (error) {
            this.logger.error('Failed to get consumption chart data', error);
            return this.getConsumptionChartFallback(effectivePath, days);
        }
    }
    isOffline(meter) {
        if (meter.status !== 'ACTIVE')
            return false;
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
        return (meter.activeDevice.lastCommunicationAt < twentyFourHoursAgo &&
            meter.readings.length === 0);
    }
    async getOfflineMetersCount(tenantPath) {
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
            return activeMeters.filter((m) => this.isOffline({
                status: m.status,
                lastReadingTime: m.lastReadingTime,
                readings: m.readings,
                activeDevice: m.activeDevice,
            })).length;
        }
        catch (error) {
            this.logger.warn('Failed to get offline meters count', error);
            return 0;
        }
    }
    async getHighUsageMeters(tenantPath, thresholdM3) {
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
        }
        catch (error) {
            this.logger.warn('Failed to get high usage meters', error);
            return [];
        }
    }
    extractCustomerName(customerType, details) {
        if (!details)
            return null;
        if (customerType === 'INDIVIDUAL') {
            const firstName = details.firstName || '';
            const lastName = details.lastName || '';
            return `${firstName} ${lastName}`.trim() || null;
        }
        else if (customerType === 'ORGANIZATIONAL') {
            return details.organizationName || null;
        }
        return null;
    }
    async getConsumptionChartFallback(tenantPath, days) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);
        const tenantFilter = tenantPath ? this.buildTenantFilterByPath(tenantPath) : {};
        try {
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
            const dailyMap = new Map();
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
        }
        catch (error) {
            this.logger.error('Fallback consumption chart also failed', error);
            return [];
        }
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = DashboardService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map