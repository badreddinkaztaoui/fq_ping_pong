import { userState } from './UserState';

class MessageQueue {
    constructor() {
        this.queues = new Map();
    }

    addMessage(chatId, message) {
        if (!this.queues.has(chatId)) {
            this.queues.set(chatId, []);
        }
        this.queues.get(chatId).push(message);
    }

    async sendQueuedMessages(chatId, socket) {
        const messages = this.queues.get(chatId) || [];
        while (messages.length > 0) {
            const message = messages.shift();
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify(message));
            } else {
                messages.unshift(message);
                break;
            }
        }
    }

    clearQueue(chatId) {
        this.queues.delete(chatId);
    }
}

export class WebSocketManager {
    constructor() {
        this.connections = new Map();
        this.messageCallbacks = new Set();
        this.statusCallbacks = new Set();
        this.reconnectTimeouts = new Map();
        this.maxReconnectAttempts = 5;
        this.messageQueue = new MessageQueue();
        
        userState.subscribe(this.handleAuthStateChange.bind(this));
    }

    handleAuthStateChange(state) {
        if (state.isAuthenticated && state.user) {
            this.initializeUserConnection(state.user.id);
        } else {
            this.disconnectAll();
        }
    }

    async initializeUserConnection(userId) {
        if (!userId) return;
        
        const userChannelId = `user_${userId}`;
        await this.connectToChat(userChannelId);
    }

    getWebSocketURL() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = process.env.NODE_ENV === 'production'
            ? window.location.host
            : 'localhost:8000';
        return `${protocol}//${host}`;
    }

    async authenticateWebSocket() {
        try {
            const token = await userState.getWebSocketToken();
            if (!token) {
                throw new Error('Failed to obtain WebSocket token');
            }
            return token;
        } catch (error) {
            console.error('WebSocket authentication failed:', error);
            throw error;
        }
    }

    async connectToChat(chatId) {
        if (!chatId || typeof chatId !== 'string') {
            console.error('Invalid chat ID:', chatId);
            this.notifyStatusChange(chatId, 'error');
            return;
        }

        if (this.connections.has(chatId)) {
            return;
        }

        try {
            console.log(`Initiating WebSocket connection for chat ${chatId}`);
            const token = await this.authenticateWebSocket();
            
            if (!token) {
                console.error('Failed to obtain WebSocket token');
                this.notifyStatusChange(chatId, 'authentication_failed');
                return;
            }

            const wsUrl = `${this.getWebSocketURL()}/ws/chat/${encodeURIComponent(chatId)}/?token=${encodeURIComponent(token)}`;
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => this.handleOpen(chatId, ws);
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

    async handleOpen(chatId, socket) {
        const connection = this.connections.get(chatId);
        if (connection) {
            connection.reconnectAttempts = 0;
            connection.status = 'connected';
            
            this.notifyStatusChange(chatId, 'connected');
            await this.messageQueue.sendQueuedMessages(chatId, socket);
        }
    }

    handleClose(chatId, event) {
        const connection = this.connections.get(chatId);
        if (connection) {
            connection.status = 'disconnected';
            this.notifyStatusChange(chatId, 'disconnected');
    
            if (this.reconnectTimeouts.has(chatId)) {
                clearTimeout(this.reconnectTimeouts.get(chatId));
            }
    
            const skipReconnectCodes = [4001, 4002, 4003];
            if (skipReconnectCodes.includes(event.code)) {
                console.log(`WebSocket closed with code ${event.code}, skipping reconnection`);
                this.notifyStatusChange(chatId, 'auth_error');
                return;
            }
    
            if (connection.reconnectAttempts < this.maxReconnectAttempts) {
                const timeout = setTimeout(() => {
                    this.reconnect(chatId);
                }, this.getBackoffTime(connection.reconnectAttempts));
    
                this.reconnectTimeouts.set(chatId, timeout);
            } else {
                this.notifyStatusChange(chatId, 'max_retries_exceeded');
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
            
            if (data.type === 'read_receipt') {
                this.handleReadReceipt(chatId, data);
                return;
            }

            this.notifyMessageReceived(chatId, data);
        } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
        }
    }

    handleReadReceipt(chatId, data) {
        this.messageCallbacks.forEach(callback => {
            if (callback.onReadReceipt) {
                callback.onReadReceipt(chatId, data.message_id, data.user_id);
            }
        });
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
        this.messageQueue.addMessage(chatId, message);
        return false;
    }

    sendMessage(chatId, content, receiverId) {
        return this.send(chatId, {
            type: 'message',
            content,
            receiver_id: receiverId
        });
    }

    sendReadReceipt(chatId, messageId) {
        return this.send(chatId, {
            type: 'read_receipt',
            message_id: messageId
        });
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

            this.messageQueue.clearQueue(chatId);
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
        return () => this.messageCallbacks.delete(callback);
    }

    onStatusChange(callback) {
        this.statusCallbacks.add(callback);
        return () => this.statusCallbacks.delete(callback);
    }

    notifyMessageReceived(chatId, message) {
        this.messageCallbacks.forEach(callback => callback(chatId, message));
    }

    notifyStatusChange(chatId, status) {
        this.statusCallbacks.forEach(callback => {
            try {
                callback(chatId, status);
            } catch (error) {
                console.error('Error in status callback:', error);
            }
        });
    }

    getConnectionStatus(chatId) {
        return this.connections.get(chatId)?.status || 'disconnected';
    }
}

export const wsManager = new WebSocketManager();