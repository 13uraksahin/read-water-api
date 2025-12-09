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
        const where = {};
        if (params.technology) {
            where.communicationTechnology = params.technology;
        }
        if (params.isActive !== undefined) {
            where.isActive = params.isActive;
        }
        const [total, decoders] = await Promise.all([
            this.prisma.decoderFunction.count({ where }),
            this.prisma.decoderFunction.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
        ]);
        const totalPages = Math.ceil(total / limit);
        const decodersWithProfiles = await Promise.all(decoders.map(async (d) => {
            const metadata = d.metadata;
            const profileId = metadata?.profileId;
            let profile = null;
            if (profileId) {
                const foundProfile = await this.prisma.meterProfile.findUnique({
                    where: { id: profileId },
                    select: {
                        id: true,
                        brand: true,
                        modelCode: true,
                    },
                });
                if (foundProfile) {
                    profile = {
                        id: foundProfile.id,
                        brand: foundProfile.brand,
                        modelCode: foundProfile.modelCode,
                    };
                }
            }
            return this.mapDecoder(d, profileId || null, profile);
        }));
        return {
            data: decodersWithProfiles,
            meta: {
                page,
                limit,
                total,
                totalPages,
            },
        };
    }
    mapDecoder(decoder, profileId, profile) {
        return {
            id: decoder.id,
            createdAt: decoder.createdAt,
            updatedAt: decoder.updatedAt,
            name: decoder.name,
            description: decoder.description,
            technology: decoder.communicationTechnology,
            functionCode: decoder.code,
            version: decoder.version,
            isActive: decoder.isActive,
            testPayload: decoder.testPayload,
            expectedOutput: decoder.expectedOutput,
            lastTestedAt: decoder.lastTestedAt,
            lastTestSucceeded: decoder.lastTestSucceeded,
            profileId,
            profile,
        };
    }
};
exports.DecodersService = DecodersService;
exports.DecodersService = DecodersService = DecodersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DecodersService);
//# sourceMappingURL=decoders.service.js.map