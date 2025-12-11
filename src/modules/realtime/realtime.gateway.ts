// =============================================================================
// Realtime Gateway - Socket.IO WebSocket Server
// =============================================================================

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../core/redis/redis.service';
import { SOCKET_EVENTS } from '../../common/constants';
import { JwtPayload } from '../../common/interfaces';

interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
  tenantId?: string;
}

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'https://read-water-app.portall.com.tr',
      // Allow any origin in development - override via CORS_ORIGINS env var
      ...(process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()) || []),
    ],
    credentials: true,
  },
  namespace: '/realtime',
  // Support Cloudflare tunnel and proxied connections
  transports: ['websocket', 'polling'],
  allowUpgrades: true,
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Initialize gateway
   */
  afterInit() {
    this.logger.log('WebSocket Gateway initialized');

    // Subscribe to Redis channels for cross-instance communication
    this.subscribeToRedisChannels();
  }

  /**
   * Handle new client connection
   */
  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Connection rejected: No token provided`);
        client.disconnect();
        return;
      }

      // Verify JWT
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Attach user info to socket
      client.user = payload;
      client.tenantId = payload.tenantId;

      // Join tenant room automatically
      if (payload.tenantId) {
        client.join(`tenant:${payload.tenantId}`);
        this.logger.debug(`Client ${client.id} joined tenant room: ${payload.tenantId}`);
      }

      this.logger.log(`Client connected: ${client.id} (User: ${payload.email})`);

      // Emit connection success
      client.emit(SOCKET_EVENTS.CLIENT_CONNECTED, {
        socketId: client.id,
        tenantId: payload.tenantId,
      });
    } catch (error) {
      this.logger.warn(`Connection rejected: Invalid token - ${error.message}`);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Subscribe to tenant room for real-time updates
   */
  @SubscribeMessage(SOCKET_EVENTS.JOIN_TENANT_ROOM)
  handleJoinTenant(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { tenantId: string },
  ) {
    // Verify user has access to this tenant
    if (!this.canAccessTenant(client, data.tenantId)) {
      return { error: 'Access denied' };
    }

    client.join(`tenant:${data.tenantId}`);
    this.logger.debug(`Client ${client.id} joined tenant room: ${data.tenantId}`);

    return { success: true, room: `tenant:${data.tenantId}` };
  }

  /**
   * Leave tenant room
   */
  @SubscribeMessage(SOCKET_EVENTS.LEAVE_TENANT_ROOM)
  handleLeaveTenant(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { tenantId: string },
  ) {
    client.leave(`tenant:${data.tenantId}`);
    this.logger.debug(`Client ${client.id} left tenant room: ${data.tenantId}`);

    return { success: true };
  }

  /**
   * Emit reading to specific tenant room
   */
  emitReading(tenantId: string, reading: any) {
    this.server.to(`tenant:${tenantId}`).emit(SOCKET_EVENTS.READING_NEW, reading);
  }

  /**
   * Emit batch of readings to tenant room
   */
  emitReadingBatch(tenantId: string, readings: any[]) {
    this.server.to(`tenant:${tenantId}`).emit(SOCKET_EVENTS.READING_BATCH, readings);
  }

  /**
   * Emit alarm to tenant room
   */
  emitAlarm(tenantId: string, alarm: any) {
    this.server.to(`tenant:${tenantId}`).emit(SOCKET_EVENTS.ALARM_NEW, alarm);
  }

  /**
   * Emit meter status change
   */
  emitMeterStatusChange(tenantId: string, data: { meterId: string; status: string }) {
    this.server.to(`tenant:${tenantId}`).emit(SOCKET_EVENTS.METER_STATUS_CHANGED, data);
  }

  /**
   * Emit dashboard update
   */
  emitDashboardUpdate(tenantId: string, data: any) {
    this.server.to(`tenant:${tenantId}`).emit(SOCKET_EVENTS.DASHBOARD_UPDATE, data);
  }

  /**
   * Subscribe to Redis pub/sub for cross-instance communication
   */
  private subscribeToRedisChannels() {
    // Subscribe to pattern for all tenant readings
    const subscriber = this.redisService.getSubscriber();

    subscriber.psubscribe('tenant:*:readings');
    subscriber.psubscribe('tenant:*:alarms');

    subscriber.on('pmessage', (pattern, channel, message) => {
      try {
        const data = JSON.parse(message);
        const tenantId = channel.split(':')[1];

        // Forward to Socket.IO room
        this.server.to(`tenant:${tenantId}`).emit(data.event, data.data);
      } catch (error) {
        this.logger.error(`Error processing Redis message: ${error.message}`);
      }
    });

    this.logger.log('Subscribed to Redis channels for real-time updates');
  }

  /**
   * Check if client can access tenant
   */
  private canAccessTenant(client: AuthenticatedSocket, tenantId: string): boolean {
    if (!client.user) return false;

    // Platform admins can access all tenants
    // For others, check tenant path hierarchy
    // This is a simplified check - in production, verify against user's tenant assignments
    return client.user.tenantId === tenantId;
  }
}

