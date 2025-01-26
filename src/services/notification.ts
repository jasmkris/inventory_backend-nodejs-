import { WebSocketService } from './websocket';
import { redisService } from './redis';
import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';
// import { getWebSocketService } from './wsService';

export class NotificationService extends EventEmitter {
  private ws!: WebSocketService;
  private prisma: PrismaClient;
  private readonly NOTIFICATION_TTL = 86400; // 24 hours
  private readonly MAX_RECENT_NOTIFICATIONS = 1000;

  // constructor(ws: WebSocketService) {
  constructor() {
    super();
    // this.ws = ws;
    this.prisma = new PrismaClient();
    this.setupEventHandlers();
  }

  setWebSocketService(ws: WebSocketService) {
    this.ws = ws;
  }

  private setupEventHandlers() {
    this.on('notification', this.handleNotification.bind(this));
    this.on('error', this.handleError.bind(this));
  }

  private async handleNotification(notification: any) {
    try {
      await this.storeNotification(notification);
      await this.broadcastNotification(notification);
      await this.processNotificationSideEffects(notification);
    } catch (error) {
      this.emit('error', error);
    }
  }

  private async handleError(error: Error) {
    console.error('Notification Error:', error);
    await this.notifySystemAlert({
      type: 'ERROR',
      message: 'Notification system error',
      details: error.message
    });
  }

  async notifyObjectChange(data: {
    objectId: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'MOVE' | 'TRANSIT' | 'REMOVE';
    userId: string;
    details: any;
  }) {
    const notification = {
      type: 'OBJECT_CHANGE',
      ...data,
      timestamp: new Date()
    };

    this.emit('notification', notification);
  }

  async notifyBatchOperation(data: {
    action: string;
    items: string[];
    userId: string;
    details: any;
  }) {
    const notification = {
      type: 'BATCH_OPERATION',
      ...data,
      timestamp: new Date()
    };

    this.emit('notification', notification);
  }

  async notifySystemAlert(data: {
    type: 'ERROR' | 'WARNING' | 'INFO';
    message: string;
    details?: any;
  }) {
    const notification = {
      ...data,
      type: 'SYSTEM_ALERT',
      timestamp: new Date()
    };

    this.emit('notification', notification);
  }

  private async storeNotification(notification: any) {
    try {
      // Ensure timestamp exists and is a valid Date
      const timestamp = notification.details?.timestamp 
        ? new Date(notification.details.timestamp) 
        : new Date();

      // Store in Redis with proper timestamp
      const key = `notification:${timestamp.getTime()}:${notification.userId}`;
      await redisService.set(key, JSON.stringify(notification), this.NOTIFICATION_TTL);
      
      // Add to recent notifications sorted set
      await redisService.addToSortedSet('recent_notifications', key, Number(timestamp.getTime()));
      
      // Prune old notifications
      await this.pruneOldNotifications();
    } catch (error) {
      console.error('Error storing notification:', error);
      this.emit('error', error);
    }
  }

  private async broadcastNotification(notification: any) {
    switch (notification.type) {
      case 'OBJECT_CHANGE':
        this.ws.notifyObjectUpdate(notification.details.roomId, notification);
        break;
      case 'BATCH_OPERATION':
        this.ws.notifyBatchUpdate(notification);
        break;
      case 'SYSTEM_ALERT':
        this.ws.notifySystemAlert(notification);
        break;
    }
  }

  private async processNotificationSideEffects(notification: any) {
    // Handle specific notification types
    if (notification.type === 'OBJECT_CHANGE' && notification.action === 'DELETE') {
      await this.handleObjectDeletion(notification);
    }
  }

  private async handleObjectDeletion(notification: any) {
    // Cleanup related data
    await Promise.all([
      redisService.invalidatePattern(`object:${notification.objectId}:*`),
      this.prisma.history.updateMany({
        where: { objectId: notification.objectId },
        data: { createdAt: new Date() }
      })
    ]);
  }

  private async pruneOldNotifications() {
    const count = await redisService.sortedSetCount('recent_notifications');
    if (count > this.MAX_RECENT_NOTIFICATIONS) {
      const toRemove = count - this.MAX_RECENT_NOTIFICATIONS;
      await redisService.removeOldestFromSortedSet('recent_notifications', toRemove);
    }
  }

  async getRecentNotifications(limit = 50) {
    const keys = await redisService.getRecentFromSortedSet('recent_notifications', limit);
    const notifications = await Promise.all(
      keys.map(key => redisService.get(key))
    );
    return notifications.filter(Boolean);
  }

  async getUserNotifications(userId: string, limit = 50) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  async notify(notification: any) {
    try {
      // Ensure notification has required fields
      const enrichedNotification = {
        ...notification,
        details: {
          ...notification.details,
          timestamp: new Date()
        }
      };

      this.emit('notification', enrichedNotification);
      if (enrichedNotification.userId) {
        this.ws.sendToUser(enrichedNotification.userId, 'notification', enrichedNotification);
      }
    } catch (error) {
      console.error('Notification error:', error);
      this.emit('error', error);
    }
  }
}

export const notificationService = new NotificationService(); 