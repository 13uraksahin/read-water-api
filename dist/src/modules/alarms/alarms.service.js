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
var AlarmsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlarmsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
let AlarmsService = AlarmsService_1 = class AlarmsService {
    prisma;
    logger = new common_1.Logger(AlarmsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAlarms(params) {
        const page = params.page ?? 1;
        const limit = Math.min(params.limit ?? 30, 100);
        const skip = (page - 1) * limit;
        const where = {};
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
    async getAlarm(id) {
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
            throw new common_1.NotFoundException(`Alarm with ID ${id} not found`);
        }
        return this.mapAlarm(alarm);
    }
    async acknowledgeAlarm(id, userId) {
        const existing = await this.prisma.alarm.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException(`Alarm with ID ${id} not found`);
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
    async resolveAlarm(id, userId, resolution) {
        const existing = await this.prisma.alarm.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException(`Alarm with ID ${id} not found`);
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
    mapAlarm(alarm) {
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
            details: alarm.details,
            acknowledgedAt: alarm.acknowledgedAt,
            acknowledgedBy: alarm.acknowledgedBy,
            resolvedAt: alarm.resolvedAt,
            resolvedBy: alarm.resolvedBy,
            resolution: alarm.resolution,
            meter: alarm.meter
                ? {
                    id: alarm.meter.id,
                    serialNumber: alarm.meter.serialNumber,
                    latitude: subscription?.latitude ? Number(subscription.latitude) : null,
                    longitude: subscription?.longitude ? Number(subscription.longitude) : null,
                    address: subscription?.address,
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
};
exports.AlarmsService = AlarmsService;
exports.AlarmsService = AlarmsService = AlarmsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AlarmsService);
//# sourceMappingURL=alarms.service.js.map