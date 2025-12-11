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
var DecodersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecodersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
let DecodersService = DecodersService_1 = class DecodersService {
    prisma;
    logger = new common_1.Logger(DecodersService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
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
        const [total, deviceProfiles] = await Promise.all([
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
        const decoders = deviceProfiles.map((dp) => ({
            id: dp.id,
            createdAt: dp.createdAt,
            updatedAt: dp.updatedAt,
            name: `${dp.brand} ${dp.modelCode} Decoder`,
            description: `Decoder for ${dp.brand} ${dp.modelCode} (${dp.communicationTechnology})`,
            technology: dp.communicationTechnology,
            functionCode: dp.decoderFunction || '',
            testPayload: dp.testPayload,
            expectedOutput: dp.expectedOutput,
            lastTestedAt: dp.lastTestedAt,
            lastTestSucceeded: dp.lastTestSucceeded,
            deviceProfileId: dp.id,
            deviceProfile: {
                id: dp.id,
                brand: dp.brand,
                modelCode: dp.modelCode,
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
    async getDecoder(deviceProfileId) {
        const dp = await this.prisma.deviceProfile.findUnique({
            where: { id: deviceProfileId },
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
        if (!dp || !dp.decoderFunction) {
            return null;
        }
        return {
            id: dp.id,
            createdAt: dp.createdAt,
            updatedAt: dp.updatedAt,
            name: `${dp.brand} ${dp.modelCode} Decoder`,
            description: `Decoder for ${dp.brand} ${dp.modelCode} (${dp.communicationTechnology})`,
            technology: dp.communicationTechnology,
            functionCode: dp.decoderFunction,
            testPayload: dp.testPayload,
            expectedOutput: dp.expectedOutput,
            lastTestedAt: dp.lastTestedAt,
            lastTestSucceeded: dp.lastTestSucceeded,
            deviceProfileId: dp.id,
            deviceProfile: {
                id: dp.id,
                brand: dp.brand,
                modelCode: dp.modelCode,
            },
        };
    }
};
exports.DecodersService = DecodersService;
exports.DecodersService = DecodersService = DecodersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DecodersService);
//# sourceMappingURL=decoders.service.js.map