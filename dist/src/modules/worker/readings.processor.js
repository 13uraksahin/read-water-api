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
var ReadingsProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadingsProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const bullmq_2 = require("bullmq");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const kysely_service_1 = require("../../core/kysely/kysely.service");
const redis_service_1 = require("../../core/redis/redis.service");
const decoder_service_1 = require("./decoder.service");
const constants_1 = require("../../common/constants");
let ReadingsProcessor = ReadingsProcessor_1 = class ReadingsProcessor extends bullmq_1.WorkerHost {
    prisma;
    kysely;
    redisService;
    decoderService;
    logger = new common_1.Logger(ReadingsProcessor_1.name);
    readingBuffer = [];
    bufferFlushTimeout = null;
    BUFFER_SIZE = 100;
    BUFFER_FLUSH_INTERVAL = 1000;
    constructor(prisma, kysely, redisService, decoderService) {
        super();
        this.prisma = prisma;
        this.kysely = kysely;
        this.redisService = redisService;
        this.decoderService = decoderService;
    }
    async process(job) {
        const { tenantId, meterId, deviceId, internalDeviceId, technology, payload, timestamp, metadata } = job.data;
        this.logger.debug(`Processing job ${job.id} for device ${deviceId}`);
        try {
            const meter = await this.prisma.meter.findUnique({
                where: { id: meterId },
                select: {
                    id: true,
                    tenantId: true,
                    meterProfileId: true,
                    lastReadingValue: true,
                    initialIndex: true,
                    activeDeviceId: true,
                    activeDevice: {
                        select: {
                            id: true,
                            deviceProfileId: true,
                            deviceProfile: {
                                select: {
                                    id: true,
                                    decoderFunction: true,
                                },
                            },
                        },
                    },
                },
            });
            if (!meter) {
                throw new Error(`Meter not found: ${meterId}`);
            }
            if (!meter.activeDevice) {
                throw new Error(`Meter ${meterId} has no active device`);
            }
            const decoderFunction = meter.activeDevice.deviceProfile.decoderFunction;
            const decoded = await this.decoderService.decodeWithFunction(decoderFunction || '', payload);
            const previousValue = meter.lastReadingValue
                ? Number(meter.lastReadingValue)
                : Number(meter.initialIndex);
            const consumption = Math.max(0, decoded.value - previousValue);
            if (metadata) {
                if (metadata.rssi !== undefined && decoded.signalStrength === undefined) {
                    decoded.signalStrength = metadata.rssi;
                }
                if (metadata.snr !== undefined) {
                    decoded.raw = { ...decoded.raw, snr: metadata.snr };
                }
            }
            this.readingBuffer.push({
                jobId: job.id,
                data: job.data,
                decoded: { ...decoded, consumption },
                deviceProfileId: meter.activeDevice.deviceProfileId,
            });
            if (this.readingBuffer.length >= this.BUFFER_SIZE) {
                await this.flushBuffer();
            }
            else if (!this.bufferFlushTimeout) {
                this.bufferFlushTimeout = setTimeout(() => {
                    this.flushBuffer().catch((err) => {
                        this.logger.error(`Buffer flush error: ${err.message}`);
                    });
                }, this.BUFFER_FLUSH_INTERVAL);
            }
            return {
                success: true,
                value: decoded.value,
                consumption,
            };
        }
        catch (error) {
            this.logger.error(`Job ${job.id} failed: ${error.message}`, error.stack);
            throw error;
        }
    }
    async flushBuffer() {
        if (this.bufferFlushTimeout) {
            clearTimeout(this.bufferFlushTimeout);
            this.bufferFlushTimeout = null;
        }
        if (this.readingBuffer.length === 0) {
            return;
        }
        const itemsToFlush = [...this.readingBuffer];
        this.readingBuffer = [];
        this.logger.debug(`Flushing ${itemsToFlush.length} readings to database`);
        try {
            const readings = itemsToFlush.map((item) => ({
                tenant_id: item.data.tenantId,
                meter_id: item.data.meterId,
                time: item.data.timestamp,
                value: item.decoded.value,
                consumption: item.decoded.consumption || 0,
                unit: item.decoded.unit || 'm3',
                signal_strength: item.decoded.signalStrength,
                battery_level: item.decoded.batteryLevel,
                temperature: item.decoded.temperature,
                raw_payload: { payload: item.data.payload, ...item.decoded.raw },
                source: item.data.technology,
                source_device_id: item.data.internalDeviceId || item.data.deviceId,
                communication_technology: item.data.technology,
                decoder_used: item.deviceProfileId,
            }));
            await this.kysely.bulkInsertReadings(readings);
            const meterUpdates = new Map();
            const deviceUpdates = new Map();
            for (const item of itemsToFlush) {
                const existingMeter = meterUpdates.get(item.data.meterId);
                if (!existingMeter || item.data.timestamp > existingMeter.time) {
                    meterUpdates.set(item.data.meterId, {
                        value: item.decoded.value,
                        time: item.data.timestamp,
                    });
                }
                if (item.data.internalDeviceId) {
                    const existingDevice = deviceUpdates.get(item.data.internalDeviceId);
                    if (!existingDevice || item.data.timestamp > existingDevice.time) {
                        deviceUpdates.set(item.data.internalDeviceId, {
                            signal: item.decoded.signalStrength,
                            battery: item.decoded.batteryLevel,
                            time: item.data.timestamp,
                        });
                    }
                }
            }
            await Promise.all(Array.from(meterUpdates.entries()).map(([meterId, update]) => this.prisma.meter.update({
                where: { id: meterId },
                data: {
                    lastReadingValue: update.value,
                    lastReadingTime: update.time,
                },
            })));
            await Promise.all(Array.from(deviceUpdates.entries()).map(([deviceId, update]) => this.prisma.device.update({
                where: { id: deviceId },
                data: {
                    lastSignalStrength: update.signal,
                    lastBatteryLevel: update.battery,
                    lastCommunicationAt: update.time,
                },
            })));
            await this.emitReadingEvents(itemsToFlush);
            await this.checkAlarms(itemsToFlush);
            this.logger.log(`Flushed ${itemsToFlush.length} readings successfully`);
        }
        catch (error) {
            this.logger.error(`Buffer flush failed: ${error.message}`, error.stack);
            this.readingBuffer.unshift(...itemsToFlush);
            throw error;
        }
    }
    async emitReadingEvents(items) {
        const byTenant = new Map();
        for (const item of items) {
            const tenantId = item.data.tenantId;
            if (!byTenant.has(tenantId)) {
                byTenant.set(tenantId, []);
            }
            byTenant.get(tenantId).push({
                meterId: item.data.meterId,
                deviceId: item.data.deviceId,
                internalDeviceId: item.data.internalDeviceId,
                value: item.decoded.value,
                consumption: item.decoded.consumption,
                timestamp: item.data.timestamp,
                signalStrength: item.decoded.signalStrength,
                batteryLevel: item.decoded.batteryLevel,
            });
        }
        for (const [tenantId, readings] of byTenant) {
            await this.redisService.publish(`tenant:${tenantId}:readings`, JSON.stringify({
                event: constants_1.SOCKET_EVENTS.READING_BATCH,
                data: readings,
            }));
        }
    }
    async checkAlarms(items) {
        const alarmsToCreate = [];
        for (const item of items) {
            if (item.decoded.batteryLevel !== undefined && item.decoded.batteryLevel < 20) {
                alarmsToCreate.push({
                    tenantId: item.data.tenantId,
                    meterId: item.data.meterId,
                    type: 'LOW_BATTERY',
                    severity: item.decoded.batteryLevel < 10 ? 4 : 3,
                    message: `Low battery: ${item.decoded.batteryLevel}%`,
                });
            }
            if (item.decoded.signalStrength !== undefined && item.decoded.signalStrength < -110) {
                alarmsToCreate.push({
                    tenantId: item.data.tenantId,
                    meterId: item.data.meterId,
                    type: 'NO_SIGNAL',
                    severity: 2,
                    message: `Weak signal: ${item.decoded.signalStrength} dBm`,
                });
            }
            if (item.decoded.alarms && item.decoded.alarms.length > 0) {
                for (const alarm of item.decoded.alarms) {
                    alarmsToCreate.push({
                        tenantId: item.data.tenantId,
                        meterId: item.data.meterId,
                        type: alarm.toUpperCase(),
                        severity: 3,
                        message: `Device reported: ${alarm}`,
                    });
                }
            }
        }
        if (alarmsToCreate.length > 0) {
            await this.prisma.alarm.createMany({
                data: alarmsToCreate.map((a) => ({
                    tenantId: a.tenantId,
                    meterId: a.meterId,
                    type: a.type,
                    severity: a.severity,
                    message: a.message,
                })),
                skipDuplicates: true,
            });
            this.logger.warn(`Created ${alarmsToCreate.length} alarms`);
        }
    }
    onCompleted(job) {
        this.logger.debug(`Job ${job.id} completed`);
    }
    onFailed(job, error) {
        this.logger.error(`Job ${job.id} failed: ${error.message}`);
    }
    onError(error) {
        this.logger.error(`Worker error: ${error.message}`);
    }
};
exports.ReadingsProcessor = ReadingsProcessor;
__decorate([
    (0, bullmq_1.OnWorkerEvent)('completed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bullmq_2.Job]),
    __metadata("design:returntype", void 0)
], ReadingsProcessor.prototype, "onCompleted", null);
__decorate([
    (0, bullmq_1.OnWorkerEvent)('failed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bullmq_2.Job, Error]),
    __metadata("design:returntype", void 0)
], ReadingsProcessor.prototype, "onFailed", null);
__decorate([
    (0, bullmq_1.OnWorkerEvent)('error'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Error]),
    __metadata("design:returntype", void 0)
], ReadingsProcessor.prototype, "onError", null);
exports.ReadingsProcessor = ReadingsProcessor = ReadingsProcessor_1 = __decorate([
    (0, bullmq_1.Processor)(constants_1.QUEUES.READINGS, {
        concurrency: 10,
    }),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        kysely_service_1.KyselyService,
        redis_service_1.RedisService,
        decoder_service_1.DecoderService])
], ReadingsProcessor);
//# sourceMappingURL=readings.processor.js.map