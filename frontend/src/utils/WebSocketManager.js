import { userState } from './UserState';

const MessageTypes = {
    MESSAGE: 'message',
    READ_RECEIPT: 'read_receipt',
    ERROR: 'error',
    STATUS: 'status'
};

class MessageQueue {
    constructor() {
        this.messages = [];
    }

    addMessage(message) {
        this.messages.push(message);
    }

    async sendQueuedMessages(socket) {
        const messages = [...this.messages];
        for (const message of messages) {
            try {
                if (socket.readyState === WebSocket.OPEN) {
                    await new Promise((resolve) => {
                        socket.send(JSON.stringify(message));
                        resolve();
                    });
                    this.messages.shift();
                } else {
                    break;
                }
            } catch (error) {
                console.error('Failed to send queued message:', error);
                break;
            }
        }
    }

    clearQueue() {
        this.messages = [];
    }
}

export class WebSocketManager {
    constructor() {
        this.connection = null;
        this.messageCallbacks = new Set();
        this.statusCallbacks = new Set();
        this.reconnectTimeout = null;
        this.maxReconnectAttempts = 5;
        this.reconnectAttempts = 0;
        this.messageQueue = new MessageQueue();
    }

    getWebSocketURL() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = process.env.NODE_ENV === 'production' ? window.location.host : 'localhost:8000';
        return `${protocol}//${host}/ws/chat/`;
    }

    async connect() {
        if (this.connection) return;

        try {
            const token = await userState.getWebSocketToken();
            if (!token) {
                this.notifyStatusChange('authentication_failed');
                return;
            }

            const wsUrl = `${this.getWebSocketURL()}?token=${encodeURIComponent(token)}`;
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => this.handleOpen(ws);
            ws.onclose = (event) => this.handleClose(event);
            ws.onerror = (error) => this.handleError(error);
            ws.onmessage = (event) => this.handleMessage(event);

            this.connection = {
                socket: ws,
                status: 'connecting'
            };

        } catch (error) {
            console.error('Failed to connect:', error);
            this.notifyStatusChange('error');
        }
    }

    async handleOpen(socket) {
        if (this.connection) {
            this.reconnectAttempts = 0;
            this.connection.status = 'connected';
            
            socket.send(JSON.stringify({
                type: MessageTypes.STATUS,
                status: 'online'
            }));
            
            this.notifyStatusChange('connected');
            await this.messageQueue.sendQueuedMessages(socket);
        }
    }

    handleClose(event) {
        const skipReconnectCodes = [4001, 4002, 4003];
        
        if (skipReconnectCodes.includes(event.code)) {
            this.notifyStatusChange('auth_error');
            return;
        }

        this.connection.status = 'disconnected';
        this.notifyStatusChange('disconnected');

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectTimeout = setTimeout(() => {
                this.reconnect();
            }, this.getBackoffTime());
        } else {
            this.notifyStatusChange('max_retries_exceeded');
        }
    }

    handleError(error) {
        console.error('WebSocket error:', error);
        this.notifyStatusChange('error');
    }

    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            
            if (data.type === MessageTypes.ERROR) {
                console.error(`Server error: ${data.message}`);
                this.notifyStatusChange('server_error');
                return;
            }
            
            if (data.type === MessageTypes.READ_RECEIPT) {
                this.notifyReadReceipt(data);
                return;
            }

            this.notifyMessageReceived(data);
        } catch (error) {
            console.error('Failed to parse message:', error);
            this.notifyStatusChange('parse_error');
        }
    }

    async reconnect() {
        this.reconnectAttempts++;
        this.connection.status = 'connecting';
        this.notifyStatusChange('connecting');
        await this.connect();
    }

    getBackoffTime() {
        const baseDelay = 1000;
        const maxDelay = 30000;
        const jitter = Math.random() * 1000;
        return Math.min(maxDelay, baseDelay * Math.pow(2, this.reconnectAttempts) + jitter);
    }

    sendMessage(receiverId, content) {
        const message = {
            type: MessageTypes.MESSAGE,
            content,
            receiver_id: receiverId
        };

        if (this.connection?.socket?.readyState === WebSocket.OPEN) {
            this.connection.socket.send(JSON.stringify(message));
            return true;
        }

        this.messageQueue.addMessage(message);
        return false;
    }

    sendReadReceipt(messageId) {
        const message = {
            type: MessageTypes.READ_RECEIPT,
            message_id: messageId
        };

        if (this.connection?.socket?.readyState === WebSocket.OPEN) {
            this.connection.socket.send(JSON.stringify(message));
            return true;
        }
        return false;
    }

    disconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.connection?.socket) {
            this.connection.socket.close();
        }

        this.messageQueue.clearQueue();
        this.connection = null;
        this.reconnectAttempts = 0;
    }

    onMessage(callback) {
        this.messageCallbacks.add(callback);
        return () => this.messageCallbacks.delete(callback);
    }

    onStatusChange(callback) {
        this.statusCallbacks.add(callback);
        return () => this.statusCallbacks.delete(callback);
    }

    notifyMessageReceived(message) {
        this.messageCallbacks.forEach(callback => callback(message));
    }

    notifyReadReceipt(data) {
        this.messageCallbacks.forEach(callback => {
            if (callback.onReadReceipt) {
                callback.onReadReceipt(data.message_id, data.user_id);
            }
        });
    }

    notifyStatusChange(status) {
        this.statusCallbacks.forEach(callback => {
            try {
                callback(status);
            } catch (error) {
                console.error('Error in status callback:', error);
            }
        });
    }

    getConnectionStatus() {
        return this.connection?.status || 'disconnected';
    }
}

export const wsManager = new WebSocketManager();