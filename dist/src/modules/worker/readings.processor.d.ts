import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../core/prisma/prisma.service';
import { KyselyService } from '../../core/kysely/kysely.service';
import { RedisService } from '../../core/redis/redis.service';
import { DecoderService } from './decoder.service';
import { ReadingJobData } from '../../common/interfaces';
export declare class ReadingsProcessor extends WorkerHost {
    private readonly prisma;
    private readonly kysely;
    private readonly redisService;
    private readonly decoderService;
    private readonly logger;
    private readingBuffer;
    private bufferFlushTimeout;
    private readonly BUFFER_SIZE;
    private readonly BUFFER_FLUSH_INTERVAL;
    constructor(prisma: PrismaService, kysely: KyselyService, redisService: RedisService, decoderService: DecoderService);
    process(job: Job<ReadingJobData>): Promise<any>;
    private flushBuffer;
    private emitReadingEvents;
    private checkAlarms;
    onCompleted(job: Job<ReadingJobData>): void;
    onFailed(job: Job<ReadingJobData>, error: Error): void;
    onError(error: Error): void;
}
