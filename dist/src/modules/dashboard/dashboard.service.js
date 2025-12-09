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
let DashboardService = DashboardService_1 = class DashboardService {
    prisma;
    logger = new common_1.Logger(DashboardService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStats(tenantId) {
        const tenantFilter = tenantId ? { tenantId } : {};
        const [totalMeters, totalCustomers, readingsStats, activeAlarms, metersInMaintenance, metersOffline,] = await Promise.all([
            this.prisma.meter.count({
                where: tenantFilter,
            }),
            this.prisma.customer.count({
                where: tenantFilter,
            }),
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
            this.prisma.meter.count({
                where: {
                    ...tenantFilter,
                    status: 'MAINTENANCE',
                },
            }),
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
    async getOfflineMetersCount(tenantId) {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        try {
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
            return activeMeters.filter((m) => m.readings.length === 0).length;
        }
        catch (error) {
            this.logger.warn('Failed to get offline meters count', error);
            return 0;
        }
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = DashboardService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map