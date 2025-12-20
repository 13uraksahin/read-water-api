import { PrismaService } from '../../core/prisma/prisma.service';
import { RedisService } from '../../core/redis/redis.service';
export declare class HealthService {
    private readonly prisma;
    private readonly redis;
    constructor(prisma: PrismaService, redis: RedisService);
    check(): Promise<{
        status: string;
        timestamp: string;
        uptime: number;
    }>;
    checkReady(): Promise<{
        status: string;
        timestamp: string;
        uptime: number;
        services: {
            database: {
                status: string;
                latency?: number;
                error?: string;
            };
            redis: {
                status: string;
                latency?: number;
                error?: string;
            };
        };
    }>;
    private checkDatabase;
    private checkRedis;
}
