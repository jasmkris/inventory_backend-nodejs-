import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { redisService } from './redis';
import WebSocket from 'ws';

export class WebSocketService {
  private io: Server;
  private userSessions: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) throw new Error('Authentication required');

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        socket.data.userId = decoded.userId;

        // Store user session
        if (!this.userSessions.has(decoded.userId)) {
          this.userSessions.set(decoded.userId, new Set());
        }
        this.userSessions.get(decoded.userId)!.add(socket.id);

        next();
      } catch (err) {
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Room subscription
      socket.on('subscribe-room', (roomId) => {
        socket.join(`room:${roomId}`);
        this.notifyRoomSubscription(roomId, socket.data.userId, true);
      });

      socket.on('unsubscribe-room', (roomId) => {
        socket.leave(`room:${roomId}`);
        this.notifyRoomSubscription(roomId, socket.data.userId, false);
      });

      // Real-time object tracking
      socket.on('track-object', (objectId) => {
        socket.join(`object:${objectId}`);
      });

      socket.on('untrack-object', (objectId) => {
        socket.leave(`object:${objectId}`);
      });

      // User presence
      socket.on('set-status', async (status) => {
        await redisService.set(`user:status:${socket.data.userId}`, status);
        this.broadcastUserStatus(socket.data.userId, status);
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private async handleDisconnect(socket: any) {
    const userId = socket.data.userId;
    if (userId && this.userSessions.has(userId)) {
      this.userSessions.get(userId)!.delete(socket.id);
      
      // If no more active sessions, update user status
      if (this.userSessions.get(userId)!.size === 0) {
        this.userSessions.delete(userId);
        await redisService.set(`user:status:${userId}`, 'offline');
        this.broadcastUserStatus(userId, 'offline');
      }
    }
  }

  // Notification methods
  notifyObjectUpdate(objectId: string, data: any) {
    this.io.to(`object:${objectId}`).emit('object-updated', data);
    this.invalidateCache(`object:${objectId}`);
  }

  notifyObjectMove(fromRoomId: string, toRoomId: string, data: any) {
    this.io.to(`room:${fromRoomId}`).emit('object-removed', data);
    this.io.to(`room:${toRoomId}`).emit('object-added', data);
    this.invalidateCache(`room:${fromRoomId}`);
    this.invalidateCache(`room:${toRoomId}`);
  }

  notifyRoomUpdate(roomId: string, data: any) {
    this.io.to(`room:${roomId}`).emit('room-updated', data);
    this.invalidateCache(`room:${roomId}`);
  }

  notifyHistoryUpdate(data: any) {
    this.io.emit('history-updated', data);
    this.invalidateCache('history:*');
  }

  private notifyRoomSubscription(roomId: string, userId: string, joined: boolean) {
    this.io.to(`room:${roomId}`).emit('room-presence', {
      roomId,
      userId,
      action: joined ? 'joined' : 'left',
      timestamp: new Date()
    });
  }

  private broadcastUserStatus(userId: string, status: string) {
    this.io.emit('user-status', {
      userId,
      status,
      timestamp: new Date()
    });
  }

  private async invalidateCache(pattern: string) {
    await redisService.invalidatePattern(pattern);
  }

  notifyBatchUpdate(notification: any): void {
    this.broadcast('batch_update', notification);
  }

  private broadcast(event: string, data: any): void {
    if (!this.io) return;
    this.io.emit(event, data);
  }

  notifySystemAlert(notification: any): void {
    this.broadcast('system_alert', notification);
  }
}
