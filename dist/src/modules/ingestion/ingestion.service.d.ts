import { Queue } from 'bullmq';
import { PrismaService } from '../../core/prisma/prisma.service';
import { RedisService } from '../../core/redis/redis.service';
import { IngestReadingDto, IngestBatchDto, LoRaWANUplinkDto, SigfoxCallbackDto } from './dto/ingestion.dto';
export declare class IngestionService {
    private readonly readingsQueue;
    private readonly prisma;
    private readonly redisService;
    private readonly logger;
    constructor(readingsQueue: Queue, prisma: PrismaService, redisService: RedisService);
    ingestReading(dto: IngestReadingDto): Promise<{
        jobId: string;
        status: string;
    }>;
    ingestBatch(dto: IngestBatchDto): Promise<{
        jobIds: string[];
        queued: number;
        skipped: number;
    }>;
    handleLoRaWANUplink(dto: LoRaWANUplinkDto): Promise<{
        jobId: string;
        status: string;
    }>;
    handleSigfoxCallback(dto: SigfoxCallbackDto): Promise<{
        jobId: string;
        status: string;
    }>;
    private resolveDevice;
    private getDeviceIdField;
    clearDeviceCache(technology?: string, deviceId?: string): Promise<void>;
}
