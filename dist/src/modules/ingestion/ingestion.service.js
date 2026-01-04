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
const redis_service_1 = require("../../core/redis/redis.service");
const constants_1 = require("../../common/constants");
const client_1 = require("@prisma/client");
const utils_1 = require("../../common/utils");
let IngestionService = IngestionService_1 = class IngestionService {
    readingsQueue;
    prisma;
    redisService;
    logger = new common_1.Logger(IngestionService_1.name);
    constructor(readingsQueue, prisma, redisService) {
        this.readingsQueue = readingsQueue;
        this.prisma = prisma;
        this.redisService = redisService;
    }
    async ingestReading(dto) {
        const timestamp = dto.time ? ((0, utils_1.toDate)(dto.time) ?? new Date()) : new Date();
        const deviceLookup = await this.resolveDevice(dto.device, dto.technology);
        if (!deviceLookup.meterId) {
            this.logger.warn(`Device ${dto.device} (${dto.technology}) has no linked meter - ignoring payload`);
            throw new common_1.BadRequestException(`Device ${dto.device} has no linked meter. Please link it to a meter first.`);
        }
        const jobData = {
            tenantId: deviceLookup.tenantId,
            meterId: deviceLookup.meterId,
            deviceId: dto.device,
            internalDeviceId: deviceLookup.deviceId,
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
        this.logger.debug(`Queued reading job ${job.id} for device ${dto.device}`);
        return {
            jobId: job.id,
            status: 'queued',
        };
    }
    async ingestBatch(dto) {
        const jobIds = [];
        let skipped = 0;
        const chunkSize = 100;
        for (let i = 0; i < dto.readings.length; i += chunkSize) {
            const chunk = dto.readings.slice(i, i + chunkSize);
            const jobs = await Promise.all(chunk.map(async (reading) => {
                try {
                    const timestamp = reading.time ? ((0, utils_1.toDate)(reading.time) ?? new Date()) : new Date();
                    const deviceLookup = await this.resolveDevice(reading.device, reading.technology);
                    if (!deviceLookup.meterId) {
                        this.logger.debug(`Skipping device ${reading.device} - no linked meter`);
                        skipped++;
                        return null;
                    }
                    const jobData = {
                        tenantId: dto.tenantId || deviceLookup.tenantId,
                        meterId: deviceLookup.meterId,
                        deviceId: reading.device,
                        internalDeviceId: deviceLookup.deviceId,
                        technology: reading.technology,
                        payload: reading.payload,
                        timestamp,
                        metadata: reading.metadata,
                    };
                    return this.readingsQueue.add('process-reading', jobData, {
                        attempts: 3,
                        backoff: { type: 'exponential', delay: 1000 },
                    });
                }
                catch (error) {
                    this.logger.debug(`Skipping reading: ${error.message}`);
                    skipped++;
                    return null;
                }
            }));
            jobIds.push(...jobs.filter((j) => j !== null).map((j) => j.id));
        }
        this.logger.log(`Queued ${jobIds.length} readings, skipped ${skipped}`);
        return {
            jobIds,
            queued: jobIds.length,
            skipped,
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
            device: dto.devEUI.toLowerCase(),
            payload,
            technology: client_1.CommunicationTechnology.LORAWAN,
            metadata,
        });
    }
    async handleSigfoxCallback(dto) {
        const metadata = {
            seqNumber: dto.seqNumber,
            avgSnr: dto.avgSnr,
            station: dto.station,
            rssi: dto.rssi,
        };
        return this.ingestReading({
            device: dto.device.toLowerCase(),
            payload: dto.data,
            technology: client_1.CommunicationTechnology.SIGFOX,
            time: dto.time,
            metadata,
        });
    }
    async resolveDevice(deviceId, technology) {
        const cacheKey = constants_1.CACHE_KEYS.MODULE_LOOKUP(technology, deviceId);
        const cached = await this.redisService.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const deviceIdField = this.getDeviceIdField(technology);
        const deviceIdLower = deviceId.toLowerCase();
        const devices = await this.prisma.$queryRaw `
      SELECT 
        d.id,
        d.tenant_id,
        d.device_profile_id,
        m.id as meter_id,
        dp.decoder_function
      FROM devices d
      LEFT JOIN meters m ON m.active_device_id = d.id
      JOIN device_profiles dp ON d.device_profile_id = dp.id
      WHERE d.status IN ('ACTIVE', 'DEPLOYED')
        AND LOWER(d.dynamic_fields->>${deviceIdField}) = ${deviceIdLower}
      LIMIT 1
    `;
        if (!devices || devices.length === 0) {
            throw new common_1.NotFoundException(`Device with ${deviceIdField}=${deviceId} not found for technology ${technology}`);
        }
        const device = devices[0];
        const result = {
            deviceId: device.id,
            tenantId: device.tenant_id,
            meterId: device.meter_id,
            deviceProfileId: device.device_profile_id,
            decoderFunction: device.decoder_function,
        };
        await this.redisService.set(cacheKey, JSON.stringify(result), constants_1.CACHE_TTL.SHORT);
        return result;
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
    async clearDeviceCache(technology, deviceId) {
        if (technology && deviceId) {
            await this.redisService.del(constants_1.CACHE_KEYS.MODULE_LOOKUP(technology, deviceId));
        }
        this.logger.log('Device lookup cache cleared');
    }
};
exports.IngestionService = IngestionService;
exports.IngestionService = IngestionService = IngestionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bullmq_1.InjectQueue)(constants_1.QUEUES.READINGS)),
    __metadata("design:paramtypes", [bullmq_2.Queue,
        prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], IngestionService);
//# sourceMappingURL=ingestion.service.js.map