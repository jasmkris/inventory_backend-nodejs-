import { WebSocketService } from './websocket';
import { Server as HttpServer } from 'http';
import { notificationService } from './notification';

let instance: WebSocketService | null = null;

export const initializeWebSocket = (server: HttpServer): WebSocketService => {
  if (!instance) {
    instance = new WebSocketService(server);
    notificationService.setWebSocketService(instance);
  }
  return instance;
};

export const getWebSocketService = (): WebSocketService => {
  if (!instance) {
    throw new Error('WebSocket service not initialized');
  }
  return instance;
};

export default {
  initialize: initializeWebSocket,
  getInstance: getWebSocketService
}; 

