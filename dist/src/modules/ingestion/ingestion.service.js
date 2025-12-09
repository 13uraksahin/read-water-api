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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var IngestionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestionService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const constants_1 = require("../../common/constants");
const client_1 = require("@prisma/client");
let IngestionService = IngestionService_1 = class IngestionService {
    readingsQueue;
    prisma;
    logger = new common_1.Logger(IngestionService_1.name);
    deviceTenantCache = new Map();
    CACHE_TTL = 5 * 60 * 1000;
    constructor(readingsQueue, prisma) {
        this.readingsQueue = readingsQueue;
        this.prisma = prisma;
    }
    async ingestReading(dto) {
        const timestamp = dto.timestamp ? new Date(dto.timestamp) : new Date();
        const { tenantId, meterId } = await this.resolveDevice(dto.deviceId, dto.technology);
        const jobData = {
            tenantId,
            meterId,
            deviceId: dto.deviceId,
            technology: dto.technology,
            payload: dto.payload,
            timestamp,
            metadata: dto.metadata,
        };
        const ageMs = Date.now() - timestamp.getTime();
        const priority = ageMs > 60000 ? 10 : ageMs > 5000 ? 5 : 1;
        const job = await this.readingsQueue.add('process-reading', jobData, {
            priority,
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
            removeOnComplete: {
                age: 3600,
                count: 10000,
            },
            removeOnFail: {
                age: 86400,
            },
        });
        this.logger.debug(`Queued reading job ${job.id} for device ${dto.deviceId}`);
        return {
            jobId: job.id,
            status: 'queued',
        };
    }
    async ingestBatch(dto) {
        const jobIds = [];
        const chunkSize = 100;
        for (let i = 0; i < dto.readings.length; i += chunkSize) {
            const chunk = dto.readings.slice(i, i + chunkSize);
            const jobs = await Promise.all(chunk.map(async (reading) => {
                const timestamp = reading.timestamp ? new Date(reading.timestamp) : new Date();
                const { tenantId, meterId } = await this.resolveDevice(reading.deviceId, reading.technology);
                const jobData = {
                    tenantId: dto.tenantId || tenantId,
                    meterId,
                    deviceId: reading.deviceId,
                    technology: reading.technology,
                    payload: reading.payload,
                    timestamp,
                    metadata: reading.metadata,
                };
                return this.readingsQueue.add('process-reading', jobData, {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 1000 },
                });
            }));
            jobIds.push(...jobs.map((j) => j.id));
        }
        this.logger.log(`Queued ${jobIds.length} readings in batch`);
        return {
            jobIds,
            status: 'queued',
        };
    }
    async handleLoRaWANUplink(dto) {
        const payload = Buffer.from(dto.data, 'base64').toString('hex');
        const metadata = {
            fPort: dto.fPort,
            fCnt: dto.fCnt,
        };
        if (dto.rxInfo && dto.rxInfo.length > 0) {
            const bestRx = dto.rxInfo.reduce((best, current) => current.rssi > best.rssi ? current : best);
            metadata.rssi = bestRx.rssi;
            metadata.snr = bestRx.snr;
            metadata.gatewayId = bestRx.gatewayID;
        }
        if (dto.txInfo) {
            metadata.frequency = dto.txInfo.frequency;
            metadata.dr = dto.txInfo.dr;
        }
        return this.ingestReading({
            deviceId: dto.devEUI.toLowerCase(),
            payload,
            technology: client_1.CommunicationTechnology.LORAWAN,
            metadata,
        });
    }
    async handleSigfoxCallback(dto) {
        const timestamp = dto.time ? new Date(dto.time * 1000) : new Date();
        const metadata = {
            seqNumber: dto.seqNumber,
            avgSnr: dto.avgSnr,
            station: dto.station,
            rssi: dto.rssi,
        };
        return this.ingestReading({
            deviceId: dto.device.toLowerCase(),
            payload: dto.data,
            technology: client_1.CommunicationTechnology.SIGFOX,
            timestamp: timestamp.toISOString(),
            metadata,
        });
    }
    async resolveDevice(deviceId, technology) {
        const cacheKey = `${technology}:${deviceId}`;
        const cached = this.deviceTenantCache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
            return { tenantId: cached.tenantId, meterId: cached.meterId };
        }
        const meter = await this.prisma.meter.findFirst({
            where: {
                status: 'ACTIVE',
                OR: [
                    {
                        connectivityConfig: {
                            path: ['primary', 'technology'],
                            equals: technology,
                        },
                    },
                    {
                        connectivityConfig: {
                            path: ['secondary', 'technology'],
                            equals: technology,
                        },
                    },
                ],
            },
            select: {
                id: true,
                tenantId: true,
                connectivityConfig: true,
            },
        });
        if (!meter) {
            throw new common_1.BadRequestException(`Unknown device: ${deviceId} (${technology})`);
        }
        const config = meter.connectivityConfig;
        const deviceIdField = this.getDeviceIdField(technology);
        const matchesPrimary = config?.primary?.technology === technology &&
            config?.primary?.fields?.[deviceIdField]?.toLowerCase() === deviceId.toLowerCase();
        const matchesSecondary = config?.secondary?.technology === technology &&
            config?.secondary?.fields?.[deviceIdField]?.toLowerCase() === deviceId.toLowerCase();
        if (!matchesPrimary && !matchesSecondary) {
            throw new common_1.BadRequestException(`Device ${deviceId} not found for technology ${technology}`);
        }
        this.deviceTenantCache.set(cacheKey, {
            tenantId: meter.tenantId,
            meterId: meter.id,
            expiresAt: Date.now() + this.CACHE_TTL,
        });
        return { tenantId: meter.tenantId, meterId: meter.id };
    }
    getDeviceIdField(technology) {
        switch (technology) {
            case 'LORAWAN':
                return 'DevEUI';
            case 'SIGFOX':
                return 'ID';
            case 'NB_IOT':
                return 'IMEI';
            case 'WM_BUS':
            case 'OMS':
                return 'DeviceId';
            case 'WIFI':
            case 'BLUETOOTH':
                return 'MacAddress';
            case 'NFC':
                return 'UID';
            case 'MIOTY':
                return 'ShortAddress';
            default:
                return 'DeviceId';
        }
    }
    clearDeviceCache() {
        this.deviceTenantCache.clear();
        this.logger.log('Device cache cleared');
    }
};
exports.IngestionService = IngestionService;
exports.IngestionService = IngestionService = IngestionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bullmq_1.InjectQueue)(constants_1.QUEUES.READINGS)),
    __metadata("design:paramtypes", [bullmq_2.Queue,
        prisma_service_1.PrismaService])
], IngestionService);
//# sourceMappingURL=ingestion.service.js.map