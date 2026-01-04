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
var ModuleProfilesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceProfilesService = exports.ModuleProfilesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../core/prisma/prisma.service");
const redis_service_1 = require("../../../core/redis/redis.service");
const constants_1 = require("../../../common/constants");
const crypto_1 = require("crypto");
function processScenarios(scenarios) {
    if (!scenarios || scenarios.length === 0)
        return [];
    const processed = scenarios.map((scenario, index) => ({
        ...scenario,
        id: scenario.id || (0, crypto_1.randomUUID)(),
        isDefault: scenario.isDefault ?? (index === 0),
    }));
    const hasDefault = processed.some(s => s.isDefault);
    if (!hasDefault && processed.length > 0) {
        processed[0].isDefault = true;
    }
    return processed;
}
function processCommunicationConfigs(configs) {
    if (!configs)
        return [];
    return configs.map(config => ({
        ...config,
        scenarios: processScenarios(config.scenarios),
    }));
}
let ModuleProfilesService = ModuleProfilesService_1 = class ModuleProfilesService {
    prisma;
    redisService;
    logger = new common_1.Logger(ModuleProfilesService_1.name);
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
            throw new common_1.BadRequestException(`Module profile with brand ${dto.brand} and model code ${dto.modelCode} already exists`);
        }
        let communicationTechnology = dto.communicationTechnology;
        let fieldDefinitions = dto.fieldDefinitions || [];
        let decoderFunction = dto.decoderFunction;
        let testPayload = dto.testPayload;
        let specifications = {};
        if (dto.communicationConfigs && dto.communicationConfigs.length > 0) {
            const processedConfigs = processCommunicationConfigs(dto.communicationConfigs);
            specifications.communicationConfigs = processedConfigs;
            const primaryConfig = processedConfigs[0];
            communicationTechnology = primaryConfig.technology;
            fieldDefinitions = processedConfigs.flatMap(config => config.fieldDefinitions.map(fd => ({
                ...fd,
                technology: config.technology,
            })));
            const defaultScenario = primaryConfig.scenarios?.find(s => s.isDefault) || primaryConfig.scenarios?.[0];
            if (!decoderFunction) {
                decoderFunction = defaultScenario?.decoderFunction || primaryConfig.decoderFunction;
            }
            if (!testPayload) {
                testPayload = defaultScenario?.testPayload || primaryConfig.testPayload;
            }
        }
        const profile = await this.prisma.deviceProfile.create({
            data: {
                brand: dto.brand,
                modelCode: dto.modelCode,
                communicationTechnology: communicationTechnology,
                integrationType: dto.integrationType || 'HTTP',
                fieldDefinitions: fieldDefinitions,
                decoderFunction,
                testPayload,
                expectedOutput: dto.expectedOutput,
                batteryLifeMonths: dto.batteryLifeMonths,
                specifications: Object.keys(specifications).length > 0 ? specifications : undefined,
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
        this.logger.log(`Created module profile: ${profile.brand} ${profile.modelCode}`);
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
            throw new common_1.NotFoundException('Module profile not found');
        }
        return profile;
    }
    async update(id, dto) {
        const existingProfile = await this.findOne(id);
        let communicationTechnology = dto.communicationTechnology;
        let fieldDefinitions = dto.fieldDefinitions;
        let decoderFunction = dto.decoderFunction;
        let testPayload = dto.testPayload;
        let specifications = existingProfile.specifications || {};
        if (dto.communicationConfigs && dto.communicationConfigs.length > 0) {
            const processedConfigs = processCommunicationConfigs(dto.communicationConfigs);
            specifications.communicationConfigs = processedConfigs;
            const primaryConfig = processedConfigs[0];
            communicationTechnology = primaryConfig.technology;
            fieldDefinitions = processedConfigs.flatMap(config => config.fieldDefinitions.map(fd => ({
                ...fd,
                technology: config.technology,
            })));
            const defaultScenario = primaryConfig.scenarios?.find(s => s.isDefault) || primaryConfig.scenarios?.[0];
            if (decoderFunction === undefined) {
                decoderFunction = defaultScenario?.decoderFunction || primaryConfig.decoderFunction;
            }
            if (testPayload === undefined) {
                testPayload = defaultScenario?.testPayload || primaryConfig.testPayload;
            }
        }
        const updated = await this.prisma.deviceProfile.update({
            where: { id },
            data: {
                modelCode: dto.modelCode,
                communicationTechnology,
                integrationType: dto.integrationType,
                fieldDefinitions: fieldDefinitions,
                decoderFunction,
                testPayload,
                expectedOutput: dto.expectedOutput,
                batteryLifeMonths: dto.batteryLifeMonths,
                specifications: Object.keys(specifications).length > 0 ? specifications : undefined,
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
        this.logger.log(`Updated module profile: ${updated.brand} ${updated.modelCode}`);
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
            throw new common_1.NotFoundException('Module profile not found');
        }
        if (profile._count.devices > 0) {
            throw new common_1.BadRequestException(`Cannot delete module profile with ${profile._count.devices} associated modules`);
        }
        await this.prisma.deviceProfile.delete({
            where: { id },
        });
        this.logger.log(`Deleted module profile: ${profile.brand} ${profile.modelCode}`);
    }
    async testDecoder(id, payload) {
        const profile = await this.findOne(id);
        if (!profile.decoderFunction) {
            throw new common_1.BadRequestException('Module profile does not have a decoder function');
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
    async getDecoders(params) {
        const page = params.page ?? 1;
        const limit = Math.min(params.limit ?? 30, 100);
        const skip = (page - 1) * limit;
        const where = {
            decoderFunction: { not: null },
        };
        if (params.technology) {
            where.communicationTechnology = params.technology;
        }
        if (params.brand) {
            where.brand = params.brand;
        }
        const [total, moduleProfiles] = await Promise.all([
            this.prisma.deviceProfile.count({ where }),
            this.prisma.deviceProfile.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    createdAt: true,
                    updatedAt: true,
                    brand: true,
                    modelCode: true,
                    communicationTechnology: true,
                    decoderFunction: true,
                    testPayload: true,
                    expectedOutput: true,
                    lastTestedAt: true,
                    lastTestSucceeded: true,
                },
            }),
        ]);
        const totalPages = Math.ceil(total / limit);
        const decoders = moduleProfiles.map((mp) => ({
            id: mp.id,
            createdAt: mp.createdAt,
            updatedAt: mp.updatedAt,
            name: `${mp.brand} ${mp.modelCode} Decoder`,
            description: `Decoder for ${mp.brand} ${mp.modelCode} (${mp.communicationTechnology})`,
            technology: mp.communicationTechnology,
            functionCode: mp.decoderFunction || '',
            testPayload: mp.testPayload,
            expectedOutput: mp.expectedOutput,
            lastTestedAt: mp.lastTestedAt,
            lastTestSucceeded: mp.lastTestSucceeded,
            moduleProfileId: mp.id,
            moduleProfile: {
                id: mp.id,
                brand: mp.brand,
                modelCode: mp.modelCode,
            },
        }));
        return {
            data: decoders,
            meta: {
                page,
                limit,
                total,
                totalPages,
            },
        };
    }
    async getDecoder(moduleProfileId) {
        const mp = await this.prisma.deviceProfile.findUnique({
            where: { id: moduleProfileId },
            select: {
                id: true,
                createdAt: true,
                updatedAt: true,
                brand: true,
                modelCode: true,
                communicationTechnology: true,
                decoderFunction: true,
                testPayload: true,
                expectedOutput: true,
                lastTestedAt: true,
                lastTestSucceeded: true,
            },
        });
        if (!mp || !mp.decoderFunction) {
            return null;
        }
        return {
            id: mp.id,
            createdAt: mp.createdAt,
            updatedAt: mp.updatedAt,
            name: `${mp.brand} ${mp.modelCode} Decoder`,
            description: `Decoder for ${mp.brand} ${mp.modelCode} (${mp.communicationTechnology})`,
            technology: mp.communicationTechnology,
            functionCode: mp.decoderFunction,
            testPayload: mp.testPayload,
            expectedOutput: mp.expectedOutput,
            lastTestedAt: mp.lastTestedAt,
            lastTestSucceeded: mp.lastTestSucceeded,
            moduleProfileId: mp.id,
            moduleProfile: {
                id: mp.id,
                brand: mp.brand,
                modelCode: mp.modelCode,
            },
        };
    }
};
exports.ModuleProfilesService = ModuleProfilesService;
exports.DeviceProfilesService = ModuleProfilesService;
exports.DeviceProfilesService = exports.ModuleProfilesService = ModuleProfilesService = ModuleProfilesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], ModuleProfilesService);
//# sourceMappingURL=module-profiles.service.js.map