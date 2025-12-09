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
var ReadingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
let ReadingsService = ReadingsService_1 = class ReadingsService {
    prisma;
    logger = new common_1.Logger(ReadingsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getReadings(params) {
        const page = params.page ?? 1;
        const limit = Math.min(params.limit ?? 30, 100);
        const skip = (page - 1) * limit;
        const where = {};
        if (params.meterId) {
            where.meterId = params.meterId;
        }
        if (params.tenantId) {
            where.meter = {
                tenantId: params.tenantId,
            };
        }
        const [total, readings] = await Promise.all([
            this.prisma.reading.count({ where }),
            this.prisma.reading.findMany({
                where,
                orderBy: {
                    time: 'desc',
                },
                skip,
                take: limit,
                include: {
                    meter: {
                        select: {
                            id: true,
                            serialNumber: true,
                            tenantId: true,
                            customer: {
                                select: {
                                    id: true,
                                    details: true,
                                },
                            },
                        },
                    },
                },
            }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data: readings.map((r) => ({
                id: r.id,
                time: r.time,
                meterId: r.meterId,
                value: Number(r.value),
                consumption: Number(r.consumption),
                unit: r.unit,
                signalStrength: r.signalStrength,
                batteryLevel: r.batteryLevel,
                temperature: r.temperature ? Number(r.temperature) : null,
                rawPayload: r.rawPayload,
                source: r.source,
                sourceDeviceId: r.sourceDeviceId,
                communicationTechnology: r.communicationTechnology,
                processedAt: r.processedAt,
                decoderUsed: r.decoderUsed,
                meter: r.meter
                    ? {
                        id: r.meter.id,
                        serialNumber: r.meter.serialNumber,
                        tenantId: r.meter.tenantId,
                        customer: r.meter.customer
                            ? {
                                id: r.meter.customer.id,
                                details: r.meter.customer.details,
                            }
                            : null,
                    }
                    : undefined,
            })),
            meta: {
                page,
                limit,
                total,
                totalPages,
            },
        };
    }
    async getMeterReadings(meterId, params) {
        return this.getReadings({
            ...params,
            meterId,
        });
    }
};
exports.ReadingsService = ReadingsService;
exports.ReadingsService = ReadingsService = ReadingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReadingsService);
//# sourceMappingURL=readings.service.js.map