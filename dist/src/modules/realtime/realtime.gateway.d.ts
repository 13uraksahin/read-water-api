import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../core/redis/redis.service';
import { JwtPayload } from '../../common/interfaces';
interface AuthenticatedSocket extends Socket {
    user?: JwtPayload;
    tenantId?: string;
}
export declare class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    private readonly configService;
    private readonly redisService;
    private readonly logger;
    server: Server;
    constructor(jwtService: JwtService, configService: ConfigService, redisService: RedisService);
    afterInit(): void;
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): void;
    handleJoinTenant(client: AuthenticatedSocket, data: {
        tenantId: string;
    }): {
        error: string;
        success?: undefined;
        room?: undefined;
    } | {
        success: boolean;
        room: string;
        error?: undefined;
    };
    handleLeaveTenant(client: AuthenticatedSocket, data: {
        tenantId: string;
    }): {
        success: boolean;
    };
    emitReading(tenantId: string, reading: any): void;
    emitReadingBatch(tenantId: string, readings: any[]): void;
    emitAlarm(tenantId: string, alarm: any): void;
    emitMeterStatusChange(tenantId: string, data: {
        meterId: string;
        status: string;
    }): void;
    emitDashboardUpdate(tenantId: string, data: any): void;
    private subscribeToRedisChannels;
    private canAccessTenant;
}
export {};
