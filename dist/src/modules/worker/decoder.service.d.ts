import { PrismaService } from '../../core/prisma/prisma.service';
import { RedisService } from '../../core/redis/redis.service';
import { DecodedReading } from '../../common/interfaces';
export declare class DecoderService {
    private readonly prisma;
    private readonly redisService;
    private readonly logger;
    private decoderCache;
    constructor(prisma: PrismaService, redisService: RedisService);
    decode(deviceProfileId: string, payload: string): Promise<DecodedReading>;
    decodeWithFunction(decoderCode: string, payload: string): Promise<DecodedReading>;
    private getDecoderFunction;
    private executeDecoder;
    private defaultDecode;
    private validateDecodedResult;
    private cacheDecoder;
    clearCache(): void;
}
