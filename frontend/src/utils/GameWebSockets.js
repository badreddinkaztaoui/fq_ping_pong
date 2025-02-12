import { userState } from './UserState';

const MessageTypes = {
    GAME_STATE: 'game_state_update',
    PLAYER_MOVE: 'move',
    MATCH_FOUND: 'match_found',
    SCORE_UPDATE: 'score_update',
    GAME_END: 'game_end'
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
            if (socket.readyState === WebSocket.OPEN) {
                await new Promise((resolve) => {
                    socket.send(JSON.stringify(message));
                    resolve();
                });
                this.messages.shift();
            } else {
                break;
            }
        }
    }

    clearQueue() {
        this.messages = [];
    }
}

export class GameWebSocketManager {
    constructor() {
        this.connection = null;
        this.gameStateCallbacks = new Set();
        this.matchFoundCallbacks = new Set();
        this.scoreUpdateCallbacks = new Set();
        this.statusCallbacks = new Set();
        this.gameEndCallbacks = new Set();
        this.reconnectTimeout = null;
        this.maxReconnectAttempts = 5;
        this.reconnectAttempts = 0;
        this.messageQueue = new MessageQueue();
        this._playerRole = null;
        this.isConnecting = false;
    }

    getWebSocketURL() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = process.env.NODE_ENV === 'production' ? window.location.host : 'localhost:8000';
        return `${protocol}//${host}/ws/game/`;
    }

    async connect() {
        if (this.isConnecting || (this.connection?.status === 'connected')) {
            return;
        }

        this.isConnecting = true;
        try {
            const token = await userState.getWebSocketToken();
            if (!token) {
                this.notifyStatusChange('authentication_failed');
                this.isConnecting = false;
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
            this.isConnecting = false;
        }
    }

    handleOpen(socket) {
        if (this.connection) {
            this.reconnectAttempts = 0;
            this.connection.status = 'connected';
            this.notifyStatusChange('connected');
            console.log('WebSocket connection established');
            this.messageQueue.sendQueuedMessages(socket);
        }
        this.isConnecting = false;
    }

    handleClose(event) {
        console.log('WebSocket connection closed:', event.code, event.reason);
        const skipReconnectCodes = [1000, 4001, 4002, 4003];
        
        if (skipReconnectCodes.includes(event.code)) {
            this.notifyStatusChange('closed');
            this.isConnecting = false;
            return;
        }

        if (this.connection) {
            this.connection.status = 'disconnected';
            this.notifyStatusChange('disconnected');
        }

        this._playerRole = null;
        this.isConnecting = false;

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

            switch(data.type) {
                case MessageTypes.GAME_STATE:
                    this.notifyGameStateUpdate(data.data);
                    break;
                case MessageTypes.MATCH_FOUND:
                    this._playerRole = data.role;
                    this.notifyMatchFound(data);
                    break;
                case MessageTypes.SCORE_UPDATE:
                    this.notifyScoreUpdate(data.score);
                    break;
                case MessageTypes.GAME_END:
                    this.notifyGameEnd(data);
                    this._playerRole = null;
                    break;
                default:
                    console.warn('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Failed to parse message:', error);
        }
    }

    getBackoffTime() {
        const baseDelay = 1000;
        const maxDelay = 30000;
        const jitter = Math.random() * 1000;
        return Math.min(maxDelay, baseDelay * Math.pow(2, this.reconnectAttempts) + jitter);
    }

    onGameStateUpdate(callback) {
        this.gameStateCallbacks.add(callback);
        return () => this.gameStateCallbacks.delete(callback);
    }

    onMatchFound(callback) {
        this.matchFoundCallbacks.add(callback);
        return () => this.matchFoundCallbacks.delete(callback);
    }

    onScoreUpdate(callback) {
        this.scoreUpdateCallbacks.add(callback);
        return () => this.scoreUpdateCallbacks.delete(callback);
    }

    onStatusChange(callback) {
        this.statusCallbacks.add(callback);
        return () => this.statusCallbacks.delete(callback);
    }

    onGameEnd(callback) {
        this.gameEndCallbacks.add(callback);
        return () => this.gameEndCallbacks.delete(callback);
    }

    notifyGameStateUpdate(gameState) {
        this.gameStateCallbacks.forEach(callback => {
            try {
                if (typeof callback === 'function')
                    callback(gameState);
            } catch (error) {
                console.error('Error in game state callback:', error);
            }
        });
    }

    notifyMatchFound(data) {
        this.matchFoundCallbacks.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Error in match found callback:', error);
            }
        });
    }

    notifyScoreUpdate(score) {
        this.scoreUpdateCallbacks.forEach(callback => {
            try {
                callback(score);
            } catch (error) {
                console.error('Error in score update callback:', error);
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

    notifyGameEnd(data) {
        this.gameEndCallbacks.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Error in game end callback:', error);
            }
        });
    }

    getConnectionStatus() {
        return this.connection?.status || 'disconnected';
    }

    sendPlayerMove(yPosition) {
        if (!this._playerRole) {
            console.warn('Cannot send move: player role not assigned');
            return false;
        }

        const message = {
            type: MessageTypes.PLAYER_MOVE,
            y_position: yPosition
        };

        if (this.connection?.socket?.readyState === WebSocket.OPEN) {
            this.connection.socket.send(JSON.stringify(message));
            return true;
        }

        this.messageQueue.addMessage(message);
        return false;
    }

    getPlayerRole() {
        return this._playerRole;
    }

    async reconnect() {
        this.reconnectAttempts++;
        if (this.connection) {
            this.connection.status = 'connecting';
        }
        this.notifyStatusChange('connecting');
        await this.connect();
    }

    disconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.connection?.socket) {
            this.connection.socket.close(1000, 'Normal closure');
        }

        this.messageQueue.clearQueue();
        this.connection = null;
        this.reconnectAttempts = 0;
        this._playerRole = null;
        this.isConnecting = false;
    }
}

export const gameWsManager = new GameWebSocketManager();