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
let MetersService = MetersService_1 = class MetersService {
    prisma;
    kysely;
    logger = new common_1.Logger(MetersService_1.name);
    constructor(prisma, kysely) {
        this.prisma = prisma;
        this.kysely = kysely;
    }
    async create(dto, user) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: dto.tenantId },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        if (user.role !== constants_1.SYSTEM_ROLES.PLATFORM_ADMIN) {
            if (!tenant.path.startsWith(user.tenantPath)) {
                throw new common_1.ForbiddenException('You do not have access to this tenant');
            }
        }
        const profile = await this.prisma.meterProfile.findUnique({
            where: { id: dto.meterProfileId },
            include: {
                allowedTenants: {
                    where: { id: dto.tenantId },
                },
            },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Meter profile not found');
        }
        if (dto.connectivityConfig) {
            await this.validateConnectivityConfig(dto.connectivityConfig, profile);
        }
        const existingMeter = await this.prisma.meter.findUnique({
            where: { serialNumber: dto.serialNumber },
        });
        if (existingMeter) {
            throw new common_1.BadRequestException(`Meter with serial number ${dto.serialNumber} already exists`);
        }
        if (dto.customerId) {
            const customer = await this.prisma.customer.findFirst({
                where: {
                    id: dto.customerId,
                    tenantId: dto.tenantId,
                },
            });
            if (!customer) {
                throw new common_1.NotFoundException('Customer not found or does not belong to this tenant');
            }
        }
        const meter = await this.prisma.meter.create({
            data: {
                tenantId: dto.tenantId,
                customerId: dto.customerId,
                meterProfileId: dto.meterProfileId,
                serialNumber: dto.serialNumber,
                initialIndex: dto.initialIndex || 0,
                installationDate: new Date(dto.installationDate),
                status: dto.status || 'WAREHOUSE',
                connectivityConfig: dto.connectivityConfig || {},
                address: dto.address,
                addressCode: dto.addressCode,
                latitude: dto.latitude,
                longitude: dto.longitude,
                metadata: dto.metadata,
            },
            include: {
                tenant: {
                    select: { id: true, name: true, path: true },
                },
                customer: {
                    select: { id: true, details: true },
                },
                meterProfile: {
                    select: { id: true, brand: true, modelCode: true, meterType: true },
                },
            },
        });
        this.logger.log(`Created meter: ${meter.serialNumber}`);
        return meter;
    }
    async findAll(query, user) {
        const page = query.page || constants_1.PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(query.limit || constants_1.PAGINATION.DEFAULT_LIMIT, constants_1.PAGINATION.MAX_LIMIT);
        const skip = (page - 1) * limit;
        const whereClause = {};
        if (user.role !== constants_1.SYSTEM_ROLES.PLATFORM_ADMIN) {
            whereClause.tenant = {
                path: {
                    startsWith: user.tenantPath,
                },
            };
        }
        if (query.tenantId) {
            whereClause.tenantId = query.tenantId;
        }
        if (query.customerId) {
            whereClause.customerId = query.customerId;
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
                    customer: {
                        select: { id: true, details: true },
                    },
                    meterProfile: {
                        select: { id: true, brand: true, modelCode: true, meterType: true },
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
                customer: true,
                meterProfile: true,
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
        if (user.role !== constants_1.SYSTEM_ROLES.PLATFORM_ADMIN) {
            if (!meter.tenant.path.startsWith(user.tenantPath)) {
                throw new common_1.ForbiddenException('You do not have access to this meter');
            }
        }
        return meter;
    }
    async update(id, dto, user) {
        const meter = await this.findOne(id, user);
        if (dto.connectivityConfig) {
            const profile = await this.prisma.meterProfile.findUnique({
                where: { id: dto.meterProfileId || meter.meterProfileId },
            });
            await this.validateConnectivityConfig(dto.connectivityConfig, profile);
        }
        if (dto.serialNumber && dto.serialNumber !== meter.serialNumber) {
            const existingMeter = await this.prisma.meter.findUnique({
                where: { serialNumber: dto.serialNumber },
            });
            if (existingMeter) {
                throw new common_1.BadRequestException(`Meter with serial number ${dto.serialNumber} already exists`);
            }
        }
        const updated = await this.prisma.meter.update({
            where: { id },
            data: {
                customerId: dto.customerId,
                meterProfileId: dto.meterProfileId,
                serialNumber: dto.serialNumber,
                status: dto.status,
                valveStatus: dto.valveStatus,
                connectivityConfig: dto.connectivityConfig,
                address: dto.address,
                addressCode: dto.addressCode,
                latitude: dto.latitude,
                longitude: dto.longitude,
                metadata: dto.metadata,
            },
            include: {
                tenant: {
                    select: { id: true, name: true },
                },
                customer: {
                    select: { id: true, details: true },
                },
                meterProfile: {
                    select: { id: true, brand: true, modelCode: true },
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
        await this.prisma.meter.delete({
            where: { id },
        });
        this.logger.log(`Deleted meter: ${meter.serialNumber}`);
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
    async validateConnectivityConfig(config, profile) {
        const profileConfigs = profile.communicationConfigs || [];
        const validateFields = async (connConfig, type) => {
            if (!connConfig)
                return;
            const techConfig = profileConfigs.find((c) => c.technology === connConfig.technology);
            if (!techConfig) {
                throw new common_1.BadRequestException(`Technology ${connConfig.technology} not supported by this profile`);
            }
            const fieldDefs = await this.prisma.communicationTechFieldDef.findUnique({
                where: { technology: connConfig.technology },
            });
            if (fieldDefs) {
                const fields = fieldDefs.fields;
                for (const fieldDef of fields) {
                    if (fieldDef.required && !connConfig.fields?.[fieldDef.name]) {
                        throw new common_1.BadRequestException(`${type} connectivity: ${fieldDef.name} is required for ${connConfig.technology}`);
                    }
                    if (connConfig.fields?.[fieldDef.name] && fieldDef.regex) {
                        const regex = new RegExp(fieldDef.regex);
                        if (!regex.test(connConfig.fields[fieldDef.name])) {
                            throw new common_1.BadRequestException(`${type} connectivity: ${fieldDef.name} has invalid format`);
                        }
                    }
                }
            }
        };
        await validateFields(config.primary, 'Primary');
        await validateFields(config.secondary, 'Secondary');
        if (config.others) {
            for (let i = 0; i < config.others.length; i++) {
                await validateFields(config.others[i], `Other[${i}]`);
            }
        }
    }
};
exports.MetersService = MetersService;
exports.MetersService = MetersService = MetersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        kysely_service_1.KyselyService])
], MetersService);
//# sourceMappingURL=meters.service.js.map