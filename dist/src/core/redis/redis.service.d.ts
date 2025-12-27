import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
export declare class RedisService implements OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private readonly client;
    private readonly subscriber;
    private readonly publisher;
    constructor(configService: ConfigService);
    getClient(): Redis;
    getSubscriber(): Redis;
    getPublisher(): Redis;
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;
    get(key: string): Promise<string | null>;
    del(key: string): Promise<number>;
    setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
    getJson<T>(key: string): Promise<T | null>;
    exists(key: string): Promise<boolean>;
    keys(pattern: string): Promise<string[]>;
    incr(key: string): Promise<number>;
    zadd(key: string, score: number, member: string): Promise<number>;
    zrangebyscore(key: string, min: number, max: number): Promise<string[]>;
    publish(channel: string, message: string): Promise<number>;
    subscribe(channel: string, callback: (message: string) => void): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
