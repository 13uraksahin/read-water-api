import { IngestionService } from './ingestion.service';
import { IngestReadingDto, IngestBatchDto, LoRaWANUplinkDto, SigfoxCallbackDto } from './dto/ingestion.dto';
export declare class IngestionController {
    private readonly ingestionService;
    private readonly logger;
    constructor(ingestionService: IngestionService);
    ingestReading(dto: IngestReadingDto): Promise<{
        jobId: string;
        status: string;
    }>;
    ingestBatch(dto: IngestBatchDto): Promise<{
        jobIds: string[];
        queued: number;
        skipped: number;
    }>;
    lorawanUplink(dto: LoRaWANUplinkDto): Promise<{
        jobId: string;
        status: string;
    }>;
    sigfoxCallback(dto: SigfoxCallbackDto): Promise<{
        jobId: string;
        status: string;
    }>;
    health(): Promise<{
        status: string;
        service: string;
        timestamp: string;
    }>;
}
