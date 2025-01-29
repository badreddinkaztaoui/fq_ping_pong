import { View } from "../core/View";
import { userState } from "../utils/UserState";
import { wsManager } from "../utils/WebSocketManager";
import { Http } from "../utils/Http";
import "../styles/dashboard/chat.css";

export class ChatView extends View {
    constructor() {
        super();
        this.currentChatId = null;
        this.currentUser = null;
        this.messages = new Map();
        this.onlineUsers = new Set();
        this.http = new Http();
        this.lastSeenMessageId = null;
        this.messageStatus = new Map(); // Track message delivery status

        this.handleWebSocketMessage = this.handleWebSocketMessage.bind(this);
        // this.handleWebSocketStatus = this.handleWebSocketStatus.bind(this);
        this.handleSendMessage = this.handleSendMessage.bind(this);
        // this.handleChatClick = this.handleChatClick.bind(this);
        this.handleUserPresence = this.handleUserPresence.bind(this);
    }

    async init() {
        const state = userState.getState();
        this.currentUser = state.user;

        // Set up WebSocket message handlers
        wsManager.onMessage(this.handleWebSocketMessage);
        // wsManager.onStatusChange(this.handleWebSocketStatus);
        wsManager.onUserPresence(this.handleUserPresence);

        await this.loadChats();
    }

    async loadChats() {
        try {
            const response = await this.http.get('/chat/list/', {
                headers: this.getAuthHeaders()
            });
            
            const chats = response.chats;
            chats.forEach(chat => {
                this.messages.set(chat.id, []);
                if (chat.last_message) {
                    this.messageStatus.set(chat.last_message.id, chat.last_message.status);
                }
            });

            return chats;
        } catch (error) {
            console.error('Failed to load chats:', error);
            if (error.status === 401) {
                window.router.navigate('/login');
            }
            return [];
        }
    }

    getAuthHeaders() {
        const token = userState.getWebSocketToken();
        return {
            'Authorization': `Bearer ${token}`
        };
    }

    async connectWebSocket(chatId) {
        const token = userState.getWebSocketToken();
        const wsUrl = `ws://${window.location.host}/ws/chat/${chatId}/?token=${token}`;
        
        try {
            await wsManager.connect(chatId, wsUrl);
        } catch (error) {
            console.error('WebSocket connection failed:', error);
            // Show connection error in UI
            this.showConnectionError();
        }
    }

    async loadChatHistory(chatId) {
        try {
            const response = await this.http.get(`/chat/${chatId}/messages/`, {
                headers: this.getAuthHeaders()
            });
            
            this.messages.set(chatId, response.messages);
            this.renderMessages(chatId);
            
            // Update last seen message
            if (response.messages.length > 0) {
                this.lastSeenMessageId = response.messages[response.messages.length - 1].id;
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    }

    handleWebSocketMessage(event) {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
            case 'chat_message':
                this.handleNewMessage(data.message);
                break;
            case 'message_ack':
                this.handleMessageAck(data);
                break;
            case 'user_joined':
            case 'user_left':
                this.handleUserPresence(data);
                break;
            case 'error':
                this.handleError(data);
                break;
        }
    }

    handleNewMessage(message) {
        const messages = this.messages.get(message.chat_id) || [];
        messages.push(message);
        this.messages.set(message.chat_id, messages);
        
        // Update message status
        this.messageStatus.set(message.id, message.status);
        
        if (this.currentChatId === message.chat_id) {
            this.renderMessages(message.chat_id);
            // Update last seen for current user's messages
            if (message.sender_id === this.currentUser.id) {
                this.lastSeenMessageId = message.id;
            }
        }
    }

    handleMessageAck(data) {
        const { message_id, status } = data;
        this.messageStatus.set(message_id, status);
        this.updateMessageStatus(message_id, status);
    }

    handleUserPresence(data) {
        const { user_id, type } = data;
        if (type === 'user_joined') {
            this.onlineUsers.add(user_id);
        } else if (type === 'user_left') {
            this.onlineUsers.delete(user_id);
        }
        this.updatePresenceIndicators();
    }

    updatePresenceIndicators() {
        this.$$('.status-indicator').forEach(indicator => {
            const userId = indicator.closest('.chat-item').dataset.userId;
            indicator.classList.toggle('online', this.onlineUsers.has(userId));
        });
    }

    createMessageElement(message) {
        const isSender = message.sender_id === this.currentUser.id;
        const status = this.messageStatus.get(message.id) || message.status;
        
        return `
            <div class="message ${isSender ? 'message-sent' : 'message-received'}" 
                 data-message-id="${message.id}">
                <div class="message-content">${message.content}</div>
                <div class="message-footer">
                    <span class="message-time">
                        ${new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                    ${isSender ? `
                        <span class="message-status ${status}">
                            ${this.getStatusIcon(status)}
                        </span>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getStatusIcon(status) {
        switch (status) {
            case 'sent': return '✓';
            case 'delivered': return '✓✓';
            case 'read': return '✓✓';
            default: return '';
        }
    }

    updateMessageStatus(messageId, status) {
        const messageEl = this.$(`[data-message-id="${messageId}"]`);
        if (messageEl) {
            const statusEl = messageEl.querySelector('.message-status');
            if (statusEl) {
                statusEl.className = `message-status ${status}`;
                statusEl.innerHTML = this.getStatusIcon(status);
            }
        }
    }

    async handleSendMessage() {
        const input = this.$('.chat-input');
        const content = input.value.trim();

        if (!content || !this.currentChatId) return;

        try {
            // Send message through WebSocket
            wsManager.send(this.currentChatId, {
                type: 'chat_message',
                message: content
            });

            input.value = '';
            
        } catch (error) {
            console.error('Failed to send message:', error);
            this.showSendError();
        }
    }

    showConnectionError() {
        const errorBar = document.createElement('div');
        errorBar.className = 'error-bar';
        errorBar.textContent = 'Connection lost. Attempting to reconnect...';
        this.$('.chat-main').prepend(errorBar);
    }

    showSendError() {
        const input = this.$('.chat-input');
        input.classList.add('error');
        setTimeout(() => input.classList.remove('error'), 2000);
    }

    async render() {
        // Check authentication first
        if (!userState.getState().isAuthenticated) {
            window.router.navigate('/login');
            return document.createElement('div');
        }

        const container = document.createElement('div');
        container.className = 'chat-container';

        // Load chats before rendering
        const chats = await this.loadChats();

        container.innerHTML = `
            <div class="chat-sidebar">
                <div class="chat-sidebar-header">
                    <h2>Chats</h2>
                    <button class="new-chat-btn">New Chat</button>
                </div>
                <div class="chat-list">
                    ${chats.map(chat => this.createChatListItem(chat)).join('')}
                </div>
            </div>
            <div class="chat-main">
                ${this.currentChatId ? this.createChatMainContent() : this.createEmptyChatState()}
            </div>
        `;

        // After initial render, set up event listeners
        this.setupEventListeners();

        return container;
    }

    createChatListItem(chat) {
        // Determine the other user in the chat
        const otherUserId = chat.user1_id === this.currentUser.id ? chat.user2_id : chat.user1_id;
        const isActive = chat.id === this.currentChatId;
        const lastMessage = chat.last_message;

        return `
            <div class="chat-item ${isActive ? 'active' : ''}" 
                 data-chat-id="${chat.id}"
                 data-user-id="${otherUserId}">
                <div class="chat-item-avatar">
                    <img src="/api/auth/users/${otherUserId}/avatar/" alt="User avatar">
                    <span class="status-indicator ${this.onlineUsers.has(otherUserId) ? 'online' : 'offline'}"></span>
                </div>
                <div class="chat-item-info">
                    <div class="chat-item-name">
                        ${chat.user1_id === this.currentUser.id ? chat.user2_name : chat.user1_name}
                    </div>
                    <div class="chat-item-last-message">
                        ${lastMessage ? this.formatLastMessage(lastMessage) : 'No messages yet'}
                    </div>
                </div>
                ${chat.unread_count ? `
                    <div class="unread-count">${chat.unread_count}</div>
                ` : ''}
            </div>
        `;
    }

    createChatMainContent() {
        return `
            <div class="chat-header">
                ${this.createChatHeader()}
            </div>
            <div class="chat-messages">
                <div class="chat-messages-container"></div>
            </div>
            <div class="chat-input-area">
                <input type="text" 
                       class="chat-input" 
                       placeholder="Type a message..." 
                       ${!this.currentChatId ? 'disabled' : ''}>
                <button class="chat-send-btn" 
                        ${!this.currentChatId ? 'disabled' : ''}>
                    Send
                </button>
            </div>
        `;
    }

    createChatHeader() {
        const currentChat = this.getCurrentChat();
        if (!currentChat) return '';

        const otherUserId = currentChat.user1_id === this.currentUser.id 
            ? currentChat.user2_id 
            : currentChat.user1_id;
        const otherUserName = currentChat.user1_id === this.currentUser.id 
            ? currentChat.user2_name 
            : currentChat.user1_name;

        return `
            <div class="chat-header-info">
                <h3>${otherUserName}</h3>
                <span class="status-text">
                    ${this.onlineUsers.has(otherUserId) ? 'Online' : 'Offline'}
                </span>
            </div>
            <div class="chat-header-actions">
                <button class="clear-chat-btn">Clear Chat</button>
            </div>
        `;
    }

    createEmptyChatState() {
        return `
            <div class="empty-chat-state">
                <div class="empty-chat-icon">💬</div>
                <h3>Select a chat to start messaging</h3>
                <p>Or start a new conversation using the New Chat button</p>
            </div>
        `;
    }

    formatLastMessage(message) {
        const maxLength = 30;
        const content = message.content;
        return content.length > maxLength 
            ? content.substring(0, maxLength) + '...' 
            : content;
    }

    getCurrentChat() {
        const chats = Array.from(this.messages.keys());
        return chats.find(chat => chat.id === this.currentChatId);
    }

    setupEventListeners() {
        // Chat list click handlers
        this.$('.chat-item').forEach(item => {
            this.addListener(item, 'click', () => 
                this.handleChatClick(item.dataset.chatId)
            );
        });

        // New chat button handler
        const newChatBtn = this.$('.new-chat-btn');
        if (newChatBtn) {
            this.addListener(newChatBtn, 'click', this.handleNewChat.bind(this));
        }

        // Message input handlers
        const input = this.$('.chat-input');
        const sendBtn = this.$('.chat-send-btn');
        
        if (input && sendBtn) {
            this.addListener(input, 'keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSendMessage();
                }
            });

            this.addListener(sendBtn, 'click', this.handleSendMessage);
        }

        // Clear chat handler
        const clearChatBtn = this.$('.clear-chat-btn');
        if (clearChatBtn) {
            this.addListener(clearChatBtn, 'click', this.handleClearChat.bind(this));
        }
    }

    cleanup() {
        wsManager.removeMessageCallback(this.handleWebSocketMessage);
        // wsManager.removeStatusCallback(this.handleWebSocketStatus);
        wsManager.removeUserPresenceCallback(this.handleUserPresence);
        wsManager.disconnectAll();
    }
}