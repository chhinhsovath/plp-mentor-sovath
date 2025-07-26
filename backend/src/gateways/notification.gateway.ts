import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OnEvent } from '@nestjs/event-emitter';
import { WsJwtGuard } from '../guards/ws-jwt.guard';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private readonly connectedClients = new Map<string, Set<string>>();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        throw new WsException('No token provided');
      }

      const payload = await this.jwtService.verifyAsync(token);
      client.userId = payload.sub;
      client.user = payload;

      // Join user-specific room
      client.join(`user:${client.userId}`);
      
      // Track connected clients
      if (!this.connectedClients.has(client.userId)) {
        this.connectedClients.set(client.userId, new Set());
      }
      this.connectedClients.get(client.userId)!.add(client.id);

      this.logger.log(`Client connected: ${client.id} (User: ${client.userId})`);
    } catch (error) {
      this.logger.error('Connection failed:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const userClients = this.connectedClients.get(client.userId);
      if (userClients) {
        userClients.delete(client.id);
        if (userClients.size === 0) {
          this.connectedClients.delete(client.userId);
        }
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Send notification to specific user
  @OnEvent('notification.created')
  handleNotificationCreated(payload: { userId: string; notification: any }) {
    this.server.to(`user:${payload.userId}`).emit('notification', payload.notification);
  }

  // Handle notification read event
  @OnEvent('notification.read')
  handleNotificationRead(payload: { userId: string; notificationId: string }) {
    this.server.to(`user:${payload.userId}`).emit('notification-read', {
      id: payload.notificationId,
    });
  }

  // Handle multiple notifications read
  @OnEvent('notifications.read')
  handleNotificationsRead(payload: { userId: string; notificationIds: string[] }) {
    this.server.to(`user:${payload.userId}`).emit('notifications-read', {
      ids: payload.notificationIds,
    });
  }

  // Handle all notifications read
  @OnEvent('notifications.all-read')
  handleAllNotificationsRead(payload: { userId: string }) {
    this.server.to(`user:${payload.userId}`).emit('all-notifications-read');
  }

  // Handle notification deleted
  @OnEvent('notification.deleted')
  handleNotificationDeleted(payload: { userId: string; notificationId: string }) {
    this.server.to(`user:${payload.userId}`).emit('notification-deleted', {
      id: payload.notificationId,
    });
  }

  // Subscribe to notification updates
  @SubscribeMessage('subscribe')
  @UseGuards(WsJwtGuard)
  handleSubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { type?: string },
  ) {
    // Additional subscription logic if needed
    return { event: 'subscribed', data: { type: data.type } };
  }

  // Unsubscribe from notifications
  @SubscribeMessage('unsubscribe')
  @UseGuards(WsJwtGuard)
  handleUnsubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { type?: string },
  ) {
    // Additional unsubscription logic if needed
    return { event: 'unsubscribed', data: { type: data.type } };
  }

  // Get connection status
  @SubscribeMessage('status')
  @UseGuards(WsJwtGuard)
  handleStatus(@ConnectedSocket() client: AuthenticatedSocket) {
    return {
      event: 'status',
      data: {
        connected: true,
        userId: client.userId,
        clientId: client.id,
      },
    };
  }

  // Broadcast to all connected clients of a user
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Broadcast to multiple users
  sendToUsers(userIds: string[], event: string, data: any) {
    userIds.forEach((userId) => {
      this.sendToUser(userId, event, data);
    });
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.connectedClients.size;
  }

  // Check if user is connected
  isUserConnected(userId: string): boolean {
    return this.connectedClients.has(userId);
  }
}