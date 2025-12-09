"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var RealtimeGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const redis_service_1 = require("../../core/redis/redis.service");
const constants_1 = require("../../common/constants");
let RealtimeGateway = RealtimeGateway_1 = class RealtimeGateway {
    jwtService;
    configService;
    redisService;
    logger = new common_1.Logger(RealtimeGateway_1.name);
    server;
    constructor(jwtService, configService, redisService) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.redisService = redisService;
    }
    afterInit() {
        this.logger.log('WebSocket Gateway initialized');
        this.subscribeToRedisChannels();
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.replace('Bearer ', '');
            if (!token) {
                this.logger.warn(`Connection rejected: No token provided`);
                client.disconnect();
                return;
            }
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get('JWT_SECRET'),
            });
            client.user = payload;
            client.tenantId = payload.tenantId;
            if (payload.tenantId) {
                client.join(`tenant:${payload.tenantId}`);
                this.logger.debug(`Client ${client.id} joined tenant room: ${payload.tenantId}`);
            }
            this.logger.log(`Client connected: ${client.id} (User: ${payload.email})`);
            client.emit(constants_1.SOCKET_EVENTS.CLIENT_CONNECTED, {
                socketId: client.id,
                tenantId: payload.tenantId,
            });
        }
        catch (error) {
            this.logger.warn(`Connection rejected: Invalid token - ${error.message}`);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    handleJoinTenant(client, data) {
        if (!this.canAccessTenant(client, data.tenantId)) {
            return { error: 'Access denied' };
        }
        client.join(`tenant:${data.tenantId}`);
        this.logger.debug(`Client ${client.id} joined tenant room: ${data.tenantId}`);
        return { success: true, room: `tenant:${data.tenantId}` };
    }
    handleLeaveTenant(client, data) {
        client.leave(`tenant:${data.tenantId}`);
        this.logger.debug(`Client ${client.id} left tenant room: ${data.tenantId}`);
        return { success: true };
    }
    emitReading(tenantId, reading) {
        this.server.to(`tenant:${tenantId}`).emit(constants_1.SOCKET_EVENTS.READING_NEW, reading);
    }
    emitReadingBatch(tenantId, readings) {
        this.server.to(`tenant:${tenantId}`).emit(constants_1.SOCKET_EVENTS.READING_BATCH, readings);
    }
    emitAlarm(tenantId, alarm) {
        this.server.to(`tenant:${tenantId}`).emit(constants_1.SOCKET_EVENTS.ALARM_NEW, alarm);
    }
    emitMeterStatusChange(tenantId, data) {
        this.server.to(`tenant:${tenantId}`).emit(constants_1.SOCKET_EVENTS.METER_STATUS_CHANGED, data);
    }
    emitDashboardUpdate(tenantId, data) {
        this.server.to(`tenant:${tenantId}`).emit(constants_1.SOCKET_EVENTS.DASHBOARD_UPDATE, data);
    }
    subscribeToRedisChannels() {
        const subscriber = this.redisService.getSubscriber();
        subscriber.psubscribe('tenant:*:readings');
        subscriber.psubscribe('tenant:*:alarms');
        subscriber.on('pmessage', (pattern, channel, message) => {
            try {
                const data = JSON.parse(message);
                const tenantId = channel.split(':')[1];
                this.server.to(`tenant:${tenantId}`).emit(data.event, data.data);
            }
            catch (error) {
                this.logger.error(`Error processing Redis message: ${error.message}`);
            }
        });
        this.logger.log('Subscribed to Redis channels for real-time updates');
    }
    canAccessTenant(client, tenantId) {
        if (!client.user)
            return false;
        return client.user.tenantId === tenantId;
    }
};
exports.RealtimeGateway = RealtimeGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], RealtimeGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)(constants_1.SOCKET_EVENTS.JOIN_TENANT_ROOM),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handleJoinTenant", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(constants_1.SOCKET_EVENTS.LEAVE_TENANT_ROOM),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handleLeaveTenant", null);
exports.RealtimeGateway = RealtimeGateway = RealtimeGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
        namespace: '/realtime',
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        redis_service_1.RedisService])
], RealtimeGateway);
//# sourceMappingURL=realtime.gateway.js.map