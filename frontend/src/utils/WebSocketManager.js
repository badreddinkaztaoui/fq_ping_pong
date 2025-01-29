import { userState } from './UserState';

export class WebSocketManager {
  constructor() {
    this.connections = new Map();
    this.messageCallbacks = new Set();
    this.statusCallbacks = new Set();
    this.reconnectTimeouts = new Map();
    this.maxReconnectAttempts = 5;
  }

  async connectToChat(chatId) {
    if (this.connections.has(chatId)) {
      return;
    }

    try {
      const token = await userState.getWebSocketToken();
      const ws = new WebSocket(`${this.getWebSocketURL()}/ws/chat/${chatId}/?token=${token}`);
      
      ws.onopen = () => this.handleOpen(chatId);
      ws.onclose = (event) => this.handleClose(chatId, event);
      ws.onerror = (error) => this.handleError(chatId, error);
      ws.onmessage = (event) => this.handleMessage(chatId, event);
      
      this.connections.set(chatId, {
        socket: ws,
        reconnectAttempts: 0,
        status: 'connecting'
      });
      
    } catch (error) {
      console.error(`Failed to connect to chat ${chatId}:`, error);
      this.notifyStatusChange(chatId, 'error');
    }
  }

  getWebSocketURL() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NODE_ENV === 'production' 
      ? window.location.host
      : 'localhost:8000';
    return `${protocol}//${host}`;
  }

  handleOpen(chatId) {
    const connection = this.connections.get(chatId);
    if (connection) {
      connection.reconnectAttempts = 0;
      connection.status = 'connected';
      this.notifyStatusChange(chatId, 'connected');
    }
  }

  handleClose(chatId, event) {
    const connection = this.connections.get(chatId);
    if (connection) {
      connection.status = 'disconnected';
      this.notifyStatusChange(chatId, 'disconnected');
      
      // Clear any existing reconnection timeout
      if (this.reconnectTimeouts.has(chatId)) {
        clearTimeout(this.reconnectTimeouts.get(chatId));
      }

      if (connection.reconnectAttempts < this.maxReconnectAttempts) {
        const timeout = setTimeout(() => {
          this.reconnect(chatId);
        }, this.getBackoffTime(connection.reconnectAttempts));
        
        this.reconnectTimeouts.set(chatId, timeout);
      }
    }
  }

  handleError(chatId, error) {
    console.error(`WebSocket error in chat ${chatId}:`, error);
    this.notifyStatusChange(chatId, 'error');
  }

  handleMessage(chatId, event) {
    try {
      const data = JSON.parse(event.data);
      this.notifyMessageReceived(chatId, data);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  async reconnect(chatId) {
    const connection = this.connections.get(chatId);
    if (connection) {
      connection.reconnectAttempts++;
      connection.status = 'connecting';
      this.notifyStatusChange(chatId, 'connecting');
      
      await this.connectToChat(chatId);
    }
  }

  getBackoffTime(attempt) {
    return Math.min(30000, 2000 * Math.pow(2, attempt));
  }

  send(chatId, message) {
    const connection = this.connections.get(chatId);
    if (connection?.socket?.readyState === WebSocket.OPEN) {
      connection.socket.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  disconnect(chatId) {
    const connection = this.connections.get(chatId);
    if (connection) {
      if (this.reconnectTimeouts.has(chatId)) {
        clearTimeout(this.reconnectTimeouts.get(chatId));
        this.reconnectTimeouts.delete(chatId);
      }
      
      if (connection.socket) {
        connection.socket.close();
      }
      
      this.connections.delete(chatId);
    }
  }

  disconnectAll() {
    for (const chatId of this.connections.keys()) {
      this.disconnect(chatId);
    }
  }

  onMessage(callback) {
    this.messageCallbacks.add(callback);
  }

  onStatusChange(callback) {
    this.statusCallbacks.add(callback);
  }

  removeMessageCallback(callback) {
    this.messageCallbacks.delete(callback);
  }

  removeStatusCallback(callback) {
    this.statusCallbacks.delete(callback);
  }

  notifyMessageReceived(chatId, message) {
    this.messageCallbacks.forEach(callback => callback(chatId, message));
  }

  notifyStatusChange(chatId, status) {
    this.statusCallbacks.forEach(callback => callback(chatId, status));
  }

  getConnectionStatus(chatId) {
    return this.connections.get(chatId)?.status || 'disconnected';
  }
}

export const wsManager = new WebSocketManager();