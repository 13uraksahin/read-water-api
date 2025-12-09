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
var ProfilesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfilesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../core/prisma/prisma.service");
const redis_service_1 = require("../../../core/redis/redis.service");
const constants_1 = require("../../../common/constants");
let ProfilesService = ProfilesService_1 = class ProfilesService {
    prisma;
    redisService;
    logger = new common_1.Logger(ProfilesService_1.name);
    constructor(prisma, redisService) {
        this.prisma = prisma;
        this.redisService = redisService;
    }
    async create(dto) {
        const existing = await this.prisma.meterProfile.findFirst({
            where: {
                brand: dto.brand,
                modelCode: dto.modelCode,
            },
        });
        if (existing) {
            throw new common_1.BadRequestException(`Profile with brand ${dto.brand} and model code ${dto.modelCode} already exists`);
        }
        let rValue = dto.rValue;
        if (!rValue && dto.q3 && dto.q1 && dto.q1 > 0) {
            rValue = dto.q3 / dto.q1;
        }
        const profile = await this.prisma.meterProfile.create({
            data: {
                brand: dto.brand,
                modelCode: dto.modelCode,
                meterType: dto.meterType,
                dialType: dto.dialType,
                connectionType: dto.connectionType,
                mountingType: dto.mountingType,
                temperatureType: dto.temperatureType,
                diameter: dto.diameter,
                length: dto.length,
                width: dto.width,
                height: dto.height,
                q1: dto.q1,
                q2: dto.q2,
                q3: dto.q3,
                q4: dto.q4,
                rValue: rValue,
                pressureLoss: dto.pressureLoss,
                ipRating: dto.ipRating,
                communicationModule: dto.communicationModule,
                batteryLifeMonths: dto.batteryLifeMonths,
                communicationConfigs: dto.communicationConfigs,
                specifications: dto.specifications,
            },
        });
        this.logger.log(`Created profile: ${profile.brand} ${profile.modelCode}`);
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
        if (query.meterType) {
            whereClause.meterType = query.meterType;
        }
        if (query.search) {
            whereClause.OR = [
                { modelCode: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        const [profiles, total] = await Promise.all([
            this.prisma.meterProfile.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: {
                    [query.sortBy || 'brand']: query.sortOrder || 'asc',
                },
                include: {
                    _count: {
                        select: { meters: true },
                    },
                },
            }),
            this.prisma.meterProfile.count({ where: whereClause }),
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
        const profile = await this.prisma.meterProfile.findUnique({
            where: { id },
            include: {
                allowedTenants: {
                    select: { id: true, name: true, path: true },
                },
                _count: {
                    select: { meters: true },
                },
            },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        return profile;
    }
    async update(id, dto) {
        await this.findOne(id);
        let rValue = dto.rValue;
        if (dto.q3 !== undefined && dto.q1 !== undefined && dto.q1 > 0) {
            rValue = dto.q3 / dto.q1;
        }
        const updated = await this.prisma.meterProfile.update({
            where: { id },
            data: {
                modelCode: dto.modelCode,
                meterType: dto.meterType,
                dialType: dto.dialType,
                connectionType: dto.connectionType,
                mountingType: dto.mountingType,
                temperatureType: dto.temperatureType,
                diameter: dto.diameter,
                length: dto.length,
                width: dto.width,
                height: dto.height,
                q1: dto.q1,
                q2: dto.q2,
                q3: dto.q3,
                q4: dto.q4,
                rValue: rValue,
                pressureLoss: dto.pressureLoss,
                ipRating: dto.ipRating,
                communicationModule: dto.communicationModule,
                batteryLifeMonths: dto.batteryLifeMonths,
                communicationConfigs: dto.communicationConfigs,
                specifications: dto.specifications,
            },
        });
        await this.redisService.del(constants_1.CACHE_KEYS.METER_PROFILE(id));
        this.logger.log(`Updated profile: ${updated.brand} ${updated.modelCode}`);
        return updated;
    }
    async delete(id) {
        const profile = await this.prisma.meterProfile.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { meters: true },
                },
            },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Profile not found');
        }
        if (profile._count.meters > 0) {
            throw new common_1.BadRequestException(`Cannot delete profile with ${profile._count.meters} associated meters`);
        }
        await this.prisma.meterProfile.delete({
            where: { id },
        });
        await this.redisService.del(constants_1.CACHE_KEYS.METER_PROFILE(id));
        this.logger.log(`Deleted profile: ${profile.brand} ${profile.modelCode}`);
    }
    async getCommunicationTechFields() {
        return this.prisma.communicationTechFieldDef.findMany({
            orderBy: { technology: 'asc' },
        });
    }
};
exports.ProfilesService = ProfilesService;
exports.ProfilesService = ProfilesService = ProfilesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], ProfilesService);
//# sourceMappingURL=profiles.service.js.map