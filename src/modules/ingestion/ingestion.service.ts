// =============================================================================
// Ingestion Service - High-Performance Reading Intake
// =============================================================================
// CRITICAL: This service ONLY validates and queues jobs. NO processing here.
// All actual processing happens in the Worker module.
// =============================================================================

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../core/prisma/prisma.service';
import { QUEUES } from '../../common/constants';
import { ReadingJobData } from '../../common/interfaces';
import {
  IngestReadingDto,
  IngestBatchDto,
  LoRaWANUplinkDto,
  SigfoxCallbackDto,
} from './dto/ingestion.dto';
import { CommunicationTechnology } from '@prisma/client';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  // Cache for device->tenant mapping (reduce DB lookups)
  private deviceTenantCache = new Map<string, { tenantId: string; meterId: string; expiresAt: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectQueue(QUEUES.READINGS) private readonly readingsQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Ingest a single reading - Primary endpoint
   * Returns 202 Accepted immediately after queuing
   */
  async ingestReading(dto: IngestReadingDto): Promise<{ jobId: string; status: string }> {
    const timestamp = dto.timestamp ? new Date(dto.timestamp) : new Date();

    // Lookup meter and tenant (with caching)
    const { tenantId, meterId } = await this.resolveDevice(dto.deviceId, dto.technology);

    // Create job data
    const jobData: ReadingJobData = {
      tenantId,
      meterId,
      deviceId: dto.deviceId,
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

    this.logger.debug(`Queued reading job ${job.id} for device ${dto.deviceId}`);

    return {
      jobId: job.id!,
      status: 'queued',
    };
  }

  /**
   * Ingest a batch of readings - For efficiency
   */
  async ingestBatch(dto: IngestBatchDto): Promise<{ jobIds: string[]; status: string }> {
    const jobIds: string[] = [];

    // Process in chunks to avoid memory issues
    const chunkSize = 100;
    for (let i = 0; i < dto.readings.length; i += chunkSize) {
      const chunk = dto.readings.slice(i, i + chunkSize);

      const jobs = await Promise.all(
        chunk.map(async (reading) => {
          const timestamp = reading.timestamp ? new Date(reading.timestamp) : new Date();
          const { tenantId, meterId } = await this.resolveDevice(
            reading.deviceId,
            reading.technology,
          );

          const jobData: ReadingJobData = {
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
        }),
      );

      jobIds.push(...jobs.map((j) => j.id!));
    }

    this.logger.log(`Queued ${jobIds.length} readings in batch`);

    return {
      jobIds,
      status: 'queued',
    };
  }

  /**
   * LoRaWAN uplink handler (ChirpStack compatible)
   */
  async handleLoRaWANUplink(dto: LoRaWANUplinkDto): Promise<{ jobId: string; status: string }> {
    // Convert base64 to hex
    const payload = Buffer.from(dto.data, 'base64').toString('hex');

    // Extract metadata
    const metadata: Record<string, any> = {
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
      deviceId: dto.devEUI.toLowerCase(),
      payload,
      technology: CommunicationTechnology.LORAWAN,
      metadata,
    });
  }

  /**
   * Sigfox callback handler
   */
  async handleSigfoxCallback(dto: SigfoxCallbackDto): Promise<{ jobId: string; status: string }> {
    const timestamp = dto.time ? new Date(dto.time * 1000) : new Date();

    const metadata: Record<string, any> = {
      seqNumber: dto.seqNumber,
      avgSnr: dto.avgSnr,
      station: dto.station,
      rssi: dto.rssi,
    };

    return this.ingestReading({
      deviceId: dto.device.toLowerCase(),
      payload: dto.data,
      technology: CommunicationTechnology.SIGFOX,
      timestamp: timestamp.toISOString(),
      metadata,
    });
  }

  /**
   * Resolve device ID to tenant and meter
   * Uses caching to reduce DB lookups
   */
  private async resolveDevice(
    deviceId: string,
    technology: string,
  ): Promise<{ tenantId: string; meterId: string }> {
    const cacheKey = `${technology}:${deviceId}`;

    // Check cache first
    const cached = this.deviceTenantCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return { tenantId: cached.tenantId, meterId: cached.meterId };
    }

    // Lookup in database - find meter by device ID in connectivity config
    const meter = await this.prisma.meter.findFirst({
      where: {
        status: 'ACTIVE',
        OR: [
          // Check primary connectivity
          {
            connectivityConfig: {
              path: ['primary', 'technology'],
              equals: technology,
            },
          },
          // Check secondary connectivity
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
      throw new BadRequestException(`Unknown device: ${deviceId} (${technology})`);
    }

    // Verify device ID matches
    const config = meter.connectivityConfig as any;
    const deviceIdField = this.getDeviceIdField(technology);

    const matchesPrimary =
      config?.primary?.technology === technology &&
      config?.primary?.fields?.[deviceIdField]?.toLowerCase() === deviceId.toLowerCase();

    const matchesSecondary =
      config?.secondary?.technology === technology &&
      config?.secondary?.fields?.[deviceIdField]?.toLowerCase() === deviceId.toLowerCase();

    if (!matchesPrimary && !matchesSecondary) {
      throw new BadRequestException(`Device ${deviceId} not found for technology ${technology}`);
    }

    // Cache result
    this.deviceTenantCache.set(cacheKey, {
      tenantId: meter.tenantId,
      meterId: meter.id,
      expiresAt: Date.now() + this.CACHE_TTL,
    });

    return { tenantId: meter.tenantId, meterId: meter.id };
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
   * Clear device cache (for testing/admin)
   */
  clearDeviceCache(): void {
    this.deviceTenantCache.clear();
    this.logger.log('Device cache cleared');
  }
}

