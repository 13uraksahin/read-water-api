// =============================================================================
// Ingestion Service - Refactored for Asset/Device Split
// =============================================================================
// NEW FLOW:
// 1. Receive payload with device identifier (DevEUI, Sigfox ID, IMEI, etc.)
// 2. Lookup Device by dynamic_fields (NOT Meter's connectivity_config)
// 3. Check if Device has an active meter linked
// 4. Queue job with device and meter info
// =============================================================================

import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../core/prisma/prisma.service';
import { RedisService } from '../../core/redis/redis.service';
import { QUEUES, CACHE_KEYS, CACHE_TTL } from '../../common/constants';
import { ReadingJobData, DeviceLookupResult, IntegrationMetadata } from '../../common/interfaces';
import {
  IngestReadingDto,
  IngestBatchDto,
  LoRaWANUplinkDto,
  SigfoxCallbackDto,
} from './dto/ingestion.dto';
import { CommunicationTechnology } from '@prisma/client';
import { toDate } from '../../common/utils';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    @InjectQueue(QUEUES.READINGS) private readonly readingsQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Ingest a single reading - Primary endpoint
   * Returns 202 Accepted immediately after queuing
   */
  async ingestReading(dto: IngestReadingDto): Promise<{ jobId: string; status: string }> {
    // Convert time to Date object (handles epoch seconds, milliseconds, ISO strings)
    const timestamp = dto.time ? (toDate(dto.time) ?? new Date()) : new Date();

    // NEW FLOW: Lookup Device (not Meter) by device identifier
    const deviceLookup = await this.resolveDevice(dto.device, dto.technology);

    // Check if device has a linked meter
    if (!deviceLookup.meterId) {
      this.logger.warn(
        `Device ${dto.device} (${dto.technology}) has no linked meter - ignoring payload`,
      );
      throw new BadRequestException(
        `Device ${dto.device} has no linked meter. Please link it to a meter first.`,
      );
    }

    // Create job data
    const jobData: ReadingJobData = {
      tenantId: deviceLookup.tenantId,
      meterId: deviceLookup.meterId,
      deviceId: dto.device,
      internalDeviceId: deviceLookup.deviceId,
      technology: dto.technology,
      payload: dto.payload,
      timestamp,
      metadata: dto.metadata,
    };

    // Queue job with priority based on payload age
    const ageMs = Date.now() - timestamp.getTime();
    const priority = ageMs > 60000 ? 10 : ageMs > 5000 ? 5 : 1; // Lower = higher priority

    const job = await this.readingsQueue.add('process-reading', jobData, {
      priority,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: {
        age: 3600, // Keep completed jobs for 1 hour
        count: 10000, // Keep max 10000 completed jobs
      },
      removeOnFail: {
        age: 86400, // Keep failed jobs for 24 hours
      },
    });

    this.logger.debug(`Queued reading job ${job.id} for device ${dto.device}`);

    return {
      jobId: job.id!,
      status: 'queued',
    };
  }

  /**
   * Ingest a batch of readings - For efficiency
   */
  async ingestBatch(dto: IngestBatchDto): Promise<{ jobIds: string[]; queued: number; skipped: number }> {
    const jobIds: string[] = [];
    let skipped = 0;

    // Process in chunks to avoid memory issues
    const chunkSize = 100;
    for (let i = 0; i < dto.readings.length; i += chunkSize) {
      const chunk = dto.readings.slice(i, i + chunkSize);

      const jobs = await Promise.all(
        chunk.map(async (reading) => {
          try {
            // Convert time to Date object (handles epoch seconds, milliseconds, ISO strings)
            const timestamp = reading.time ? (toDate(reading.time) ?? new Date()) : new Date();
            const deviceLookup = await this.resolveDevice(
              reading.device,
              reading.technology,
            );

            // Skip if no linked meter
            if (!deviceLookup.meterId) {
              this.logger.debug(`Skipping device ${reading.device} - no linked meter`);
              skipped++;
              return null;
            }

            const jobData: ReadingJobData = {
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
          } catch (error) {
            this.logger.debug(`Skipping reading: ${error.message}`);
            skipped++;
            return null;
          }
        }),
      );

      jobIds.push(
        ...jobs.filter((j) => j !== null).map((j) => j!.id!),
      );
    }

    this.logger.log(`Queued ${jobIds.length} readings, skipped ${skipped}`);

    return {
      jobIds,
      queued: jobIds.length,
      skipped,
    };
  }

  /**
   * LoRaWAN uplink handler (ChirpStack compatible)
   */
  async handleLoRaWANUplink(dto: LoRaWANUplinkDto): Promise<{ jobId: string; status: string }> {
    // Convert base64 to hex
    const payload = Buffer.from(dto.data, 'base64').toString('hex');

    // Extract metadata
    const metadata: IntegrationMetadata = {
      fPort: dto.fPort,
      fCnt: dto.fCnt,
    };

    if (dto.rxInfo && dto.rxInfo.length > 0) {
      const bestRx = dto.rxInfo.reduce((best, current) =>
        current.rssi > best.rssi ? current : best,
      );
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
      technology: CommunicationTechnology.LORAWAN,
      metadata,
    });
  }

  /**
   * Sigfox callback handler
   * Note: Sigfox sends time as epoch seconds, which is handled by our time converter
   */
  async handleSigfoxCallback(dto: SigfoxCallbackDto): Promise<{ jobId: string; status: string }> {
    const metadata: IntegrationMetadata = {
      seqNumber: dto.seqNumber,
      avgSnr: dto.avgSnr,
      station: dto.station,
      rssi: dto.rssi,
    };

    return this.ingestReading({
      device: dto.device.toLowerCase(),
      payload: dto.data,
      technology: CommunicationTechnology.SIGFOX,
      // dto.time is epoch seconds - our time converter will handle it automatically
      time: dto.time,
      metadata,
    });
  }

  /**
   * NEW: Resolve device identifier to Device entity
   * Uses caching and looks up by dynamic_fields in the devices table
   */
  private async resolveDevice(
    deviceId: string,
    technology: string,
  ): Promise<DeviceLookupResult> {
    const cacheKey = CACHE_KEYS.MODULE_LOOKUP(technology, deviceId);

    // Check Redis cache first
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get the device ID field name for this technology
    const deviceIdField = this.getDeviceIdField(technology);
    const deviceIdLower = deviceId.toLowerCase();

    // Query devices table - search in dynamic_fields JSONB
    const devices = await this.prisma.$queryRaw<
      Array<{
        id: string;
        tenant_id: string;
        device_profile_id: string;
        meter_id: string | null;
        decoder_function: string | null;
      }>
    >`
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
      throw new NotFoundException(
        `Device with ${deviceIdField}=${deviceId} not found for technology ${technology}`,
      );
    }

    const device = devices[0];

    const result: DeviceLookupResult = {
      deviceId: device.id,
      tenantId: device.tenant_id,
      meterId: device.meter_id,
      deviceProfileId: device.device_profile_id,
      decoderFunction: device.decoder_function,
    };

    // Cache result (shorter TTL for devices that might be linked/unlinked)
    await this.redisService.set(cacheKey, JSON.stringify(result), CACHE_TTL.SHORT);

    return result;
  }

  /**
   * Get the device ID field name for each technology
   */
  private getDeviceIdField(technology: string): string {
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

  /**
   * Clear device cache (for admin/testing)
   */
  async clearDeviceCache(technology?: string, deviceId?: string): Promise<void> {
    if (technology && deviceId) {
      await this.redisService.del(CACHE_KEYS.MODULE_LOOKUP(technology, deviceId));
    }
    this.logger.log('Device lookup cache cleared');
  }
}
