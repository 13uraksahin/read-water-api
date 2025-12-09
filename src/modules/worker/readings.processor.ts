// =============================================================================
// Readings Processor - BullMQ Worker for Processing Readings
// =============================================================================

import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../core/prisma/prisma.service';
import { KyselyService } from '../../core/kysely/kysely.service';
import { RedisService } from '../../core/redis/redis.service';
import { DecoderService } from './decoder.service';
import { ReadingJobData, DecodedReading } from '../../common/interfaces';
import { QUEUES, SOCKET_EVENTS } from '../../common/constants';

@Processor(QUEUES.READINGS, {
  concurrency: 10, // Process 10 jobs concurrently
})
export class ReadingsProcessor extends WorkerHost {
  private readonly logger = new Logger(ReadingsProcessor.name);

  // Batch processing buffer
  private readingBuffer: Array<{
    jobId: string;
    data: ReadingJobData;
    decoded: DecodedReading;
    meterProfile: string;
  }> = [];
  private bufferFlushTimeout: NodeJS.Timeout | null = null;
  private readonly BUFFER_SIZE = 100;
  private readonly BUFFER_FLUSH_INTERVAL = 1000; // 1 second

  constructor(
    private readonly prisma: PrismaService,
    private readonly kysely: KyselyService,
    private readonly redisService: RedisService,
    private readonly decoderService: DecoderService,
  ) {
    super();
  }

  /**
   * Process a single reading job
   */
  async process(job: Job<ReadingJobData>): Promise<any> {
    const { tenantId, meterId, deviceId, technology, payload, timestamp, metadata } = job.data;

    this.logger.debug(`Processing job ${job.id} for device ${deviceId}`);

    try {
      // 1. Get meter and profile info
      const meter = await this.prisma.meter.findUnique({
        where: { id: meterId },
        select: {
          id: true,
          tenantId: true,
          meterProfileId: true,
          lastReadingValue: true,
          initialIndex: true,
        },
      });

      if (!meter) {
        throw new Error(`Meter not found: ${meterId}`);
      }

      // 2. Decode payload using decoder service
      const decoded = await this.decoderService.decode(
        meter.meterProfileId,
        technology,
        payload,
      );

      // 3. Calculate consumption
      const previousValue = meter.lastReadingValue
        ? Number(meter.lastReadingValue)
        : Number(meter.initialIndex);
      const consumption = Math.max(0, decoded.value - previousValue);

      // 4. Apply metadata from device (RSSI, battery, etc.)
      if (metadata) {
        if (metadata.rssi !== undefined && decoded.signalStrength === undefined) {
          decoded.signalStrength = metadata.rssi;
        }
        if (metadata.snr !== undefined) {
          decoded.raw = { ...decoded.raw, snr: metadata.snr };
        }
      }

      // 5. Add to buffer for batch insert
      this.readingBuffer.push({
        jobId: job.id!,
        data: job.data,
        decoded: { ...decoded, consumption },
        meterProfile: meter.meterProfileId,
      });

      // 6. Flush buffer if full or schedule flush
      if (this.readingBuffer.length >= this.BUFFER_SIZE) {
        await this.flushBuffer();
      } else if (!this.bufferFlushTimeout) {
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
    } catch (error) {
      this.logger.error(`Job ${job.id} failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Flush buffer - Bulk insert readings to TimescaleDB
   */
  private async flushBuffer(): Promise<void> {
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
      // Prepare readings for bulk insert
      const readings = itemsToFlush.map((item) => ({
        tenant_id: item.data.tenantId,
        meter_id: item.data.meterId!,
        time: item.data.timestamp,
        value: item.decoded.value,
        consumption: item.decoded.consumption || 0,
        unit: item.decoded.unit || 'm3',
        signal_strength: item.decoded.signalStrength,
        battery_level: item.decoded.batteryLevel,
        temperature: item.decoded.temperature,
        raw_payload: { payload: item.data.payload, ...item.decoded.raw },
        source: item.data.technology,
        source_device_id: item.data.deviceId,
        communication_technology: item.data.technology as any,
        decoder_used: item.meterProfile,
      }));

      // Bulk insert using Kysely (optimized for TimescaleDB)
      await this.kysely.bulkInsertReadings(readings);

      // Update meter last reading values
      const meterUpdates = new Map<string, { value: number; time: Date; signal?: number; battery?: number }>();
      for (const item of itemsToFlush) {
        const existing = meterUpdates.get(item.data.meterId!);
        if (!existing || item.data.timestamp > existing.time) {
          meterUpdates.set(item.data.meterId!, {
            value: item.decoded.value,
            time: item.data.timestamp,
            signal: item.decoded.signalStrength,
            battery: item.decoded.batteryLevel,
          });
        }
      }

      // Update meters in parallel
      await Promise.all(
        Array.from(meterUpdates.entries()).map(([meterId, update]) =>
          this.prisma.meter.update({
            where: { id: meterId },
            data: {
              lastReadingValue: update.value,
              lastReadingTime: update.time,
              lastSignalStrength: update.signal,
              lastBatteryLevel: update.battery,
            },
          }),
        ),
      );

      // Emit real-time events
      await this.emitReadingEvents(itemsToFlush);

      // Check for alarms
      await this.checkAlarms(itemsToFlush);

      this.logger.log(`Flushed ${itemsToFlush.length} readings successfully`);
    } catch (error) {
      this.logger.error(`Buffer flush failed: ${error.message}`, error.stack);
      // Put items back in buffer for retry
      this.readingBuffer.unshift(...itemsToFlush);
      throw error;
    }
  }

  /**
   * Emit real-time events via Redis pub/sub
   */
  private async emitReadingEvents(
    items: Array<{
      jobId: string;
      data: ReadingJobData;
      decoded: DecodedReading;
    }>,
  ): Promise<void> {
    // Group by tenant for efficient broadcasting
    const byTenant = new Map<string, any[]>();

    for (const item of items) {
      const tenantId = item.data.tenantId;
      if (!byTenant.has(tenantId)) {
        byTenant.set(tenantId, []);
      }
      byTenant.get(tenantId)!.push({
        meterId: item.data.meterId,
        deviceId: item.data.deviceId,
        value: item.decoded.value,
        consumption: item.decoded.consumption,
        timestamp: item.data.timestamp,
        signalStrength: item.decoded.signalStrength,
        batteryLevel: item.decoded.batteryLevel,
      });
    }

    // Publish events
    for (const [tenantId, readings] of byTenant) {
      await this.redisService.publish(
        `tenant:${tenantId}:readings`,
        JSON.stringify({
          event: SOCKET_EVENTS.READING_BATCH,
          data: readings,
        }),
      );
    }
  }

  /**
   * Check for alarm conditions
   */
  private async checkAlarms(
    items: Array<{
      jobId: string;
      data: ReadingJobData;
      decoded: DecodedReading;
    }>,
  ): Promise<void> {
    const alarmsToCreate: Array<{
      tenantId: string;
      meterId: string;
      type: string;
      severity: number;
      message: string;
    }> = [];

    for (const item of items) {
      // Check battery level
      if (item.decoded.batteryLevel !== undefined && item.decoded.batteryLevel < 20) {
        alarmsToCreate.push({
          tenantId: item.data.tenantId,
          meterId: item.data.meterId!,
          type: 'LOW_BATTERY',
          severity: item.decoded.batteryLevel < 10 ? 4 : 3,
          message: `Low battery: ${item.decoded.batteryLevel}%`,
        });
      }

      // Check signal strength
      if (item.decoded.signalStrength !== undefined && item.decoded.signalStrength < -110) {
        alarmsToCreate.push({
          tenantId: item.data.tenantId,
          meterId: item.data.meterId!,
          type: 'NO_SIGNAL',
          severity: 2,
          message: `Weak signal: ${item.decoded.signalStrength} dBm`,
        });
      }

      // Check for alarms reported by decoder
      if (item.decoded.alarms && item.decoded.alarms.length > 0) {
        for (const alarm of item.decoded.alarms) {
          alarmsToCreate.push({
            tenantId: item.data.tenantId,
            meterId: item.data.meterId!,
            type: alarm.toUpperCase(),
            severity: 3,
            message: `Device reported: ${alarm}`,
          });
        }
      }
    }

    // Create alarms
    if (alarmsToCreate.length > 0) {
      await this.prisma.alarm.createMany({
        data: alarmsToCreate.map((a) => ({
          tenantId: a.tenantId,
          meterId: a.meterId,
          type: a.type as any,
          severity: a.severity,
          message: a.message,
        })),
        skipDuplicates: true,
      });

      this.logger.warn(`Created ${alarmsToCreate.length} alarms`);
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<ReadingJobData>) {
    this.logger.debug(`Job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<ReadingJobData>, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }

  @OnWorkerEvent('error')
  onError(error: Error) {
    this.logger.error(`Worker error: ${error.message}`);
  }
}

