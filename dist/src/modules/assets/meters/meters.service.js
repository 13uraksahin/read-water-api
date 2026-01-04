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
var MetersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../core/prisma/prisma.service");
const kysely_service_1 = require("../../../core/kysely/kysely.service");
const constants_1 = require("../../../common/constants");
const client_1 = require("@prisma/client");
let MetersService = MetersService_1 = class MetersService {
    prisma;
    kysely;
    logger = new common_1.Logger(MetersService_1.name);
    constructor(prisma, kysely) {
        this.prisma = prisma;
        this.kysely = kysely;
    }
    async hasUserAccessToTenant(user, tenantPath, tenantId) {
        if (user.role === constants_1.SYSTEM_ROLES.PLATFORM_ADMIN) {
            return true;
        }
        if (tenantPath.startsWith(user.tenantPath) || user.tenantPath.startsWith(tenantPath)) {
            return true;
        }
        const directAssignment = await this.prisma.userTenant.findFirst({
            where: {
                userId: user.id,
                tenantId: tenantId,
            },
        });
        return !!directAssignment;
    }
    async create(dto, user) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: dto.tenantId },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        const hasAccess = await this.hasUserAccessToTenant(user, tenant.path, tenant.id);
        if (!hasAccess) {
            throw new common_1.ForbiddenException('You do not have access to this tenant');
        }
        const profile = await this.prisma.meterProfile.findUnique({
            where: { id: dto.meterProfileId },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Meter profile not found');
        }
        const existingMeter = await this.prisma.meter.findUnique({
            where: { serialNumber: dto.serialNumber },
        });
        if (existingMeter) {
            throw new common_1.BadRequestException(`Meter with serial number ${dto.serialNumber} already exists`);
        }
        if (dto.subscriptionId) {
            const subscription = await this.prisma.subscription.findFirst({
                where: {
                    id: dto.subscriptionId,
                    tenantId: dto.tenantId,
                },
            });
            if (!subscription) {
                throw new common_1.NotFoundException('Subscription not found or does not belong to this tenant');
            }
        }
        const meter = await this.prisma.meter.create({
            data: {
                tenantId: dto.tenantId,
                subscriptionId: dto.subscriptionId || null,
                meterProfileId: dto.meterProfileId,
                serialNumber: dto.serialNumber,
                initialIndex: dto.initialIndex || 0,
                installationDate: new Date(dto.installationDate),
                status: dto.status || client_1.MeterStatus.WAREHOUSE,
                metadata: dto.metadata,
            },
            include: {
                tenant: {
                    select: { id: true, name: true, path: true },
                },
                subscription: {
                    include: {
                        customer: {
                            select: { id: true, details: true, customerType: true },
                        },
                    },
                },
                meterProfile: {
                    select: { id: true, brand: true, modelCode: true, meterType: true },
                },
                activeDevice: {
                    select: { id: true, serialNumber: true, status: true },
                },
            },
        });
        this.logger.log(`Created meter: ${meter.serialNumber}`);
        return meter;
    }
    async getEffectiveTenantPath(user, tenantId) {
        if (user.role === constants_1.SYSTEM_ROLES.PLATFORM_ADMIN) {
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
                return userTenantAssignment.tenant.path;
            }
            const selectedTenant = await this.prisma.tenant.findUnique({
                where: { id: tenantId },
                select: { path: true },
            });
            if (selectedTenant && selectedTenant.path.startsWith(user.tenantPath)) {
                return selectedTenant.path;
            }
            return user.tenantPath;
        }
        return user.tenantPath;
    }
    async findAll(query, user) {
        const page = query.page || constants_1.PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(query.limit || constants_1.PAGINATION.DEFAULT_LIMIT, constants_1.PAGINATION.MAX_LIMIT);
        const skip = (page - 1) * limit;
        const whereClause = {};
        const effectivePath = await this.getEffectiveTenantPath(user, query.tenantId);
        if (effectivePath) {
            whereClause.tenant = {
                path: {
                    startsWith: effectivePath,
                },
            };
        }
        if (query.subscriptionId) {
            whereClause.subscriptionId = query.subscriptionId;
        }
        if (query.status) {
            whereClause.status = query.status;
        }
        if (query.brand) {
            whereClause.meterProfile = {
                brand: query.brand,
            };
        }
        if (query.search) {
            whereClause.OR = [
                { serialNumber: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        const [meters, total] = await Promise.all([
            this.prisma.meter.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: {
                    [query.sortBy || 'createdAt']: query.sortOrder || 'desc',
                },
                include: {
                    tenant: {
                        select: { id: true, name: true },
                    },
                    subscription: {
                        include: {
                            customer: {
                                select: { id: true, details: true, customerType: true },
                            },
                        },
                    },
                    meterProfile: {
                        select: { id: true, brand: true, modelCode: true, meterType: true },
                    },
                    activeDevice: {
                        select: {
                            id: true,
                            serialNumber: true,
                            status: true,
                            lastSignalStrength: true,
                            lastBatteryLevel: true,
                            deviceProfile: {
                                select: { brand: true, modelCode: true, communicationTechnology: true },
                            },
                        },
                    },
                },
            }),
            this.prisma.meter.count({ where: whereClause }),
        ]);
        return {
            data: meters,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1,
            },
        };
    }
    async findOne(id, user) {
        const meter = await this.prisma.meter.findUnique({
            where: { id },
            include: {
                tenant: {
                    select: { id: true, name: true, path: true },
                },
                subscription: {
                    include: {
                        customer: true,
                    },
                },
                meterProfile: true,
                activeDevice: {
                    include: {
                        deviceProfile: true,
                    },
                },
                alarms: {
                    where: { status: 'ACTIVE' },
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                },
                readings: {
                    take: 10,
                    orderBy: { time: 'desc' },
                },
            },
        });
        if (!meter) {
            throw new common_1.NotFoundException('Meter not found');
        }
        const hasAccess = await this.hasUserAccessToTenant(user, meter.tenant.path, meter.tenantId);
        if (!hasAccess) {
            throw new common_1.ForbiddenException('You do not have access to this meter');
        }
        return meter;
    }
    async update(id, dto, user) {
        const meter = await this.findOne(id, user);
        if (dto.serialNumber && dto.serialNumber !== meter.serialNumber) {
            const existingMeter = await this.prisma.meter.findUnique({
                where: { serialNumber: dto.serialNumber },
            });
            if (existingMeter) {
                throw new common_1.BadRequestException(`Meter with serial number ${dto.serialNumber} already exists`);
            }
        }
        if (dto.subscriptionId) {
            const subscription = await this.prisma.subscription.findFirst({
                where: {
                    id: dto.subscriptionId,
                    tenantId: meter.tenantId,
                },
            });
            if (!subscription) {
                throw new common_1.NotFoundException('Subscription not found or does not belong to this tenant');
            }
        }
        const updated = await this.prisma.meter.update({
            where: { id },
            data: {
                subscriptionId: dto.subscriptionId,
                meterProfileId: dto.meterProfileId,
                serialNumber: dto.serialNumber,
                status: dto.status,
                valveStatus: dto.valveStatus,
                metadata: dto.metadata,
            },
            include: {
                tenant: {
                    select: { id: true, name: true },
                },
                subscription: {
                    include: {
                        customer: {
                            select: { id: true, details: true },
                        },
                    },
                },
                meterProfile: {
                    select: { id: true, brand: true, modelCode: true },
                },
                activeDevice: {
                    select: { id: true, serialNumber: true, status: true },
                },
            },
        });
        this.logger.log(`Updated meter: ${updated.serialNumber}`);
        return updated;
    }
    async delete(id, user) {
        const meter = await this.findOne(id, user);
        const readingCount = await this.prisma.reading.count({
            where: { meterId: id },
        });
        if (readingCount > 0) {
            throw new common_1.BadRequestException(`Cannot delete meter with ${readingCount} readings. Consider changing status to PASSIVE instead.`);
        }
        if (meter.activeDeviceId) {
            await this.prisma.device.update({
                where: { id: meter.activeDeviceId },
                data: { status: client_1.DeviceStatus.WAREHOUSE },
            });
        }
        await this.prisma.meter.delete({
            where: { id },
        });
        this.logger.log(`Deleted meter: ${meter.serialNumber}`);
    }
    async linkSubscription(meterId, dto, user) {
        const meter = await this.findOne(meterId, user);
        const subscription = await this.prisma.subscription.findFirst({
            where: {
                id: dto.subscriptionId,
                tenantId: meter.tenantId,
            },
        });
        if (!subscription) {
            throw new common_1.NotFoundException('Subscription not found or does not belong to this tenant');
        }
        const updated = await this.prisma.meter.update({
            where: { id: meterId },
            data: { subscriptionId: dto.subscriptionId },
            include: {
                tenant: { select: { id: true, name: true } },
                subscription: {
                    include: {
                        customer: { select: { id: true, details: true } },
                    },
                },
                meterProfile: { select: { id: true, brand: true, modelCode: true } },
                activeDevice: { select: { id: true, serialNumber: true, status: true } },
            },
        });
        this.logger.log(`Linked meter ${meter.serialNumber} to subscription ${dto.subscriptionId}`);
        return updated;
    }
    async unlinkSubscription(meterId, user) {
        const meter = await this.findOne(meterId, user);
        if (!meter.subscriptionId) {
            throw new common_1.BadRequestException('Meter is not linked to any subscription');
        }
        const updated = await this.prisma.meter.update({
            where: { id: meterId },
            data: { subscriptionId: null },
            include: {
                tenant: { select: { id: true, name: true } },
                meterProfile: { select: { id: true, brand: true, modelCode: true } },
                activeDevice: { select: { id: true, serialNumber: true, status: true } },
            },
        });
        this.logger.log(`Unlinked meter ${meter.serialNumber} from subscription`);
        return updated;
    }
    async linkDevice(meterId, dto, user) {
        const meter = await this.findOne(meterId, user);
        if (meter.activeDeviceId) {
            throw new common_1.ConflictException('Meter already has an active device. Unlink first.');
        }
        const device = await this.prisma.device.findUnique({
            where: { id: dto.moduleId },
            include: {
                tenant: true,
                deviceProfile: {
                    include: {
                        compatibleMeterProfiles: {
                            where: { id: meter.meterProfileId },
                        },
                    },
                },
            },
        });
        if (!device) {
            throw new common_1.NotFoundException('Device not found');
        }
        if (device.status !== client_1.DeviceStatus.WAREHOUSE) {
            throw new common_1.BadRequestException(`Device is not available. Current status: ${device.status}`);
        }
        const hasDeviceAccess = await this.hasUserAccessToTenant(user, device.tenant.path, device.tenantId);
        if (!hasDeviceAccess) {
            throw new common_1.ForbiddenException('Device does not belong to your tenant');
        }
        if (device.deviceProfile.compatibleMeterProfiles.length === 0) {
            throw new common_1.BadRequestException(`Device profile ${device.deviceProfile.brand} ${device.deviceProfile.modelCode} is not compatible with meter profile`);
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            await tx.device.update({
                where: { id: dto.moduleId },
                data: { status: client_1.DeviceStatus.DEPLOYED },
            });
            const updatedMeter = await tx.meter.update({
                where: { id: meterId },
                data: { activeDeviceId: dto.moduleId },
                include: {
                    tenant: { select: { id: true, name: true } },
                    subscription: {
                        include: {
                            customer: { select: { id: true, details: true } },
                        },
                    },
                    meterProfile: { select: { id: true, brand: true, modelCode: true } },
                    activeDevice: {
                        include: { deviceProfile: true },
                    },
                },
            });
            await tx.activityLog.create({
                data: {
                    userId: user.id,
                    action: 'meter.link_module',
                    resource: 'meter',
                    resourceId: meterId,
                    details: {
                        moduleId: dto.moduleId,
                        moduleSerial: device.serialNumber,
                        meterSerial: meter.serialNumber,
                    },
                },
            });
            return updatedMeter;
        });
        this.logger.log(`Linked device ${device.serialNumber} to meter ${meter.serialNumber}`);
        return updated;
    }
    async unlinkDevice(meterId, dto, user) {
        const meter = await this.findOne(meterId, user);
        if (!meter.activeDeviceId) {
            throw new common_1.BadRequestException('Meter has no active device to unlink');
        }
        const deviceId = meter.activeDeviceId;
        const newStatus = dto.moduleStatus || 'WAREHOUSE';
        const updated = await this.prisma.$transaction(async (tx) => {
            await tx.device.update({
                where: { id: deviceId },
                data: { status: newStatus },
            });
            const updatedMeter = await tx.meter.update({
                where: { id: meterId },
                data: { activeDeviceId: null },
                include: {
                    tenant: { select: { id: true, name: true } },
                    subscription: {
                        include: {
                            customer: { select: { id: true, details: true } },
                        },
                    },
                    meterProfile: { select: { id: true, brand: true, modelCode: true } },
                },
            });
            await tx.activityLog.create({
                data: {
                    userId: user.id,
                    action: 'meter.unlink_device',
                    resource: 'meter',
                    resourceId: meterId,
                    details: {
                        deviceId,
                        newDeviceStatus: newStatus,
                        meterSerial: meter.serialNumber,
                    },
                },
            });
            return updatedMeter;
        });
        this.logger.log(`Unlinked device from meter ${meter.serialNumber}`);
        return updated;
    }
    async controlValve(id, dto, user) {
        const meter = await this.findOne(id, user);
        if (meter.valveStatus === 'NOT_APPLICABLE') {
            throw new common_1.BadRequestException('This meter does not have valve control');
        }
        const updated = await this.prisma.meter.update({
            where: { id },
            data: {
                valveStatus: dto.action,
            },
        });
        this.logger.log(`Valve ${dto.action} for meter: ${meter.serialNumber}`);
        return updated;
    }
    async getReadingHistory(id, user, days = 30) {
        await this.findOne(id, user);
        const startTime = new Date();
        startTime.setDate(startTime.getDate() - days);
        return this.kysely.getHourlyConsumption(id, startTime, new Date());
    }
};
exports.MetersService = MetersService;
exports.MetersService = MetersService = MetersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        kysely_service_1.KyselyService])
], MetersService);
//# sourceMappingURL=meters.service.js.map