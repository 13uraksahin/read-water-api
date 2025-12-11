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
var DeviceProfilesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceProfilesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../core/prisma/prisma.service");
const redis_service_1 = require("../../../core/redis/redis.service");
const constants_1 = require("../../../common/constants");
let DeviceProfilesService = DeviceProfilesService_1 = class DeviceProfilesService {
    prisma;
    redisService;
    logger = new common_1.Logger(DeviceProfilesService_1.name);
    constructor(prisma, redisService) {
        this.prisma = prisma;
        this.redisService = redisService;
    }
    async create(dto) {
        const existing = await this.prisma.deviceProfile.findFirst({
            where: {
                brand: dto.brand,
                modelCode: dto.modelCode,
            },
        });
        if (existing) {
            throw new common_1.BadRequestException(`Device profile with brand ${dto.brand} and model code ${dto.modelCode} already exists`);
        }
        const profile = await this.prisma.deviceProfile.create({
            data: {
                brand: dto.brand,
                modelCode: dto.modelCode,
                communicationTechnology: dto.communicationTechnology,
                integrationType: dto.integrationType || 'HTTP',
                fieldDefinitions: (dto.fieldDefinitions || []),
                decoderFunction: dto.decoderFunction,
                testPayload: dto.testPayload,
                expectedOutput: dto.expectedOutput,
                batteryLifeMonths: dto.batteryLifeMonths,
                compatibleMeterProfiles: dto.compatibleMeterProfileIds
                    ? {
                        connect: dto.compatibleMeterProfileIds.map((id) => ({ id })),
                    }
                    : undefined,
            },
            include: {
                compatibleMeterProfiles: {
                    select: {
                        id: true,
                        brand: true,
                        modelCode: true,
                        meterType: true,
                    },
                },
                _count: {
                    select: { devices: true },
                },
            },
        });
        this.logger.log(`Created device profile: ${profile.brand} ${profile.modelCode}`);
        return profile;
    }
    async findAll(query) {
        const page = query.page || constants_1.PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(query.limit || constants_1.PAGINATION.DEFAULT_LIMIT, constants_1.PAGINATION.MAX_LIMIT);
        const skip = (page - 1) * limit;
        const whereClause = {};
        if (query.brand) {
            whereClause.brand = query.brand;
        }
        if (query.technology) {
            whereClause.communicationTechnology = query.technology;
        }
        if (query.search) {
            whereClause.OR = [
                { modelCode: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        const [profiles, total] = await Promise.all([
            this.prisma.deviceProfile.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: {
                    [query.sortBy || 'brand']: query.sortOrder || 'asc',
                },
                include: {
                    compatibleMeterProfiles: {
                        select: {
                            id: true,
                            brand: true,
                            modelCode: true,
                            meterType: true,
                        },
                    },
                    _count: {
                        select: { devices: true },
                    },
                },
            }),
            this.prisma.deviceProfile.count({ where: whereClause }),
        ]);
        return {
            data: profiles,
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
    async findOne(id) {
        const profile = await this.prisma.deviceProfile.findUnique({
            where: { id },
            include: {
                compatibleMeterProfiles: {
                    select: {
                        id: true,
                        brand: true,
                        modelCode: true,
                        meterType: true,
                    },
                },
                _count: {
                    select: { devices: true },
                },
            },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Device profile not found');
        }
        return profile;
    }
    async update(id, dto) {
        await this.findOne(id);
        const updated = await this.prisma.deviceProfile.update({
            where: { id },
            data: {
                modelCode: dto.modelCode,
                communicationTechnology: dto.communicationTechnology,
                integrationType: dto.integrationType,
                fieldDefinitions: dto.fieldDefinitions,
                decoderFunction: dto.decoderFunction,
                testPayload: dto.testPayload,
                expectedOutput: dto.expectedOutput,
                batteryLifeMonths: dto.batteryLifeMonths,
                compatibleMeterProfiles: dto.compatibleMeterProfileIds
                    ? {
                        set: dto.compatibleMeterProfileIds.map((id) => ({ id })),
                    }
                    : undefined,
            },
            include: {
                compatibleMeterProfiles: {
                    select: {
                        id: true,
                        brand: true,
                        modelCode: true,
                        meterType: true,
                    },
                },
                _count: {
                    select: { devices: true },
                },
            },
        });
        this.logger.log(`Updated device profile: ${updated.brand} ${updated.modelCode}`);
        return updated;
    }
    async delete(id) {
        const profile = await this.prisma.deviceProfile.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { devices: true },
                },
            },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Device profile not found');
        }
        if (profile._count.devices > 0) {
            throw new common_1.BadRequestException(`Cannot delete device profile with ${profile._count.devices} associated devices`);
        }
        await this.prisma.deviceProfile.delete({
            where: { id },
        });
        this.logger.log(`Deleted device profile: ${profile.brand} ${profile.modelCode}`);
    }
    async testDecoder(id, payload) {
        const profile = await this.findOne(id);
        if (!profile.decoderFunction) {
            throw new common_1.BadRequestException('Device profile does not have a decoder function');
        }
        const testPayload = payload || profile.testPayload;
        if (!testPayload) {
            throw new common_1.BadRequestException('No test payload provided');
        }
        try {
            const decoderFn = new Function('payload', profile.decoderFunction);
            const output = decoderFn(testPayload);
            await this.prisma.deviceProfile.update({
                where: { id },
                data: {
                    lastTestedAt: new Date(),
                    lastTestSucceeded: true,
                },
            });
            return { success: true, output };
        }
        catch (error) {
            await this.prisma.deviceProfile.update({
                where: { id },
                data: {
                    lastTestedAt: new Date(),
                    lastTestSucceeded: false,
                },
            });
            return { success: false, error: error.message };
        }
    }
};
exports.DeviceProfilesService = DeviceProfilesService;
exports.DeviceProfilesService = DeviceProfilesService = DeviceProfilesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], DeviceProfilesService);
//# sourceMappingURL=device-profiles.service.js.map