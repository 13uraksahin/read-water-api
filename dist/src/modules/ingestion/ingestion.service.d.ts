import { Queue } from 'bullmq';
import { PrismaService } from '../../core/prisma/prisma.service';
import { IngestReadingDto, IngestBatchDto, LoRaWANUplinkDto, SigfoxCallbackDto } from './dto/ingestion.dto';
export declare class IngestionService {
    private readonly readingsQueue;
    private readonly prisma;
    private readonly logger;
    private deviceTenantCache;
    private readonly CACHE_TTL;
    constructor(readingsQueue: Queue, prisma: PrismaService);
    ingestReading(dto: IngestReadingDto): Promise<{
        jobId: string;
        status: string;
    }>;
    ingestBatch(dto: IngestBatchDto): Promise<{
        jobIds: string[];
        status: string;
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
    clearDeviceCache(): void;
}
