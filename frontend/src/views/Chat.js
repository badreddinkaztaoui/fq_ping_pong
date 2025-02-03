import { View } from '../core/View';
import { wsManager } from '../utils/WebSocketManager';
import { userState } from '../utils/UserState';
import { Http } from '../utils/Http';
import { friendsStore } from '../utils/FriendsState';
import "../styles/dashboard/chat.css"

export class ChatView extends View {
    constructor(params = {}) {
        super();
        this.friends = [];
        this.currentChatId = params.id || null;
        this.messages = new Map();
        this.pendingMessages = new Set();
        this.connectionState = {
            status: 'disconnected',
            lastAttempt: null,
            error: null
        };
        
        this.http = new Http(userState);
        
        this.handleMessage = this.handleMessage.bind(this);
        this.handleStatus = this.handleStatus.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.initializeChat = this.initializeChat.bind(this);
    }

    async afterMount() {
        this.initializeElements();
        await this.loadFriends();
        
        if (this.currentChatId) {
            await this.initializeChat();
        }
    }

    async render() {
        const container = document.createElement('div');
        container.className = 'chat-layout valorant-theme';
        container.innerHTML = `
            <div class="friends-sidebar">
                <div class="friends-header">
                    <h2>Friends</h2>
                </div>
                <div class="friends-list">
                    <div class="friends-loading">Loading friends...</div>
                </div>
            </div>
            <div class="chat-main ${!this.currentChatId ? 'no-chat-selected' : ''}">
                ${!this.currentChatId ? this.renderNoChatSelected() : this.renderChatInterface()}
            </div>
        `;
        return container;
    }

    initializeElements() {
        this.friendsList = this.$('.friends-list');
        
        if (this.currentChatId) {
            this.messagesList = this.$('.messages-list');
            this.form = this.$('.chat-form');
            this.input = this.$('.chat-input');
            this.sendButton = this.$('.chat-send-btn');

            this.setupChatEventListeners();
        }
    }

    async initializeChat() {
        try {
            await this.loadInitialMessages();
            this.initializeWebSocket();
        } catch (error) {
            console.error('Failed to initialize chat:', error);
        }
    }

    initializeWebSocket() {
        wsManager.removeMessageCallback(this.handleMessage);
        wsManager.removeStatusCallback(this.handleStatus);
        
        wsManager.onMessage(this.handleMessage);
        wsManager.onStatusChange(this.handleStatus);
        
        if (this.connectionState.status === 'disconnected') {
            wsManager.connectToChat(this.currentChatId);
        }
    }

    async loadInitialMessages() {
        try {
            const response = await this.http.get(`/chat/${this.currentChatId}/messages/`);
            response.messages.reverse().forEach(message => {
                this.messages.set(message.id, message);
            });
            this.renderMessages();
        } catch (error) {
            if (error.message?.includes('Authentication required')) {
                window.location.href = '/login';
                return;
            }
            throw error;
        }
    }

    setupChatEventListeners() {
        if (this.form) {
            this.addListener(this.form, 'submit', this.handleSubmit);
        }
        if (this.input) {
            this.addListener(this.input, 'input', () => this.handleInputChange());
        }
    }

    renderNoChatSelected() {
        return `
            <div class="no-chat-message">
                <h3>Select a friend to start chatting</h3>
            </div>
        `;
    }

    renderChatInterface() {
        return `
            <div class="chat-container">
                <div class="chat-header">
                    <div class="chat-status">${this.connectionState.status}</div>
                </div>
                <div class="messages-list"></div>
                <form class="chat-form">
                    <input type="text" 
                           class="chat-input" 
                           placeholder="Type a message..."
                           ${this.connectionState.status === 'connected' ? '' : 'disabled'}>
                    <button type="submit" 
                            class="chat-send-btn" 
                            ${this.connectionState.status === 'connected' ? '' : 'disabled'}>
                        Send
                    </button>
                </form>
            </div>
        `;
    }

    async loadFriends() {
        try {
            const friends = await friendsStore.loadFriends();
            this.friends = friends;
            
            this.unsubscribeFriends = friendsStore.subscribe(updatedFriends => {
                this.friends = updatedFriends;
                this.renderFriendsList();
            });
            
            this.renderFriendsList();
        } catch (error) {
            console.error('Failed to load friends:', error);
        }
    }

    renderFriendsList() {
        if (!this.friends?.length) {
            this.friendsList.innerHTML = '<div class="no-friends">No friends found</div>';
            return;
        }
    
        this.friendsList.innerHTML = this.friends.map(friend => `
            <div class="friend-item ${this.currentChatId === friend.friend.id ? 'active' : ''}" 
                 data-friendship-id="${friend.friend.id}">
                <div class="friend-info">
                    <div class="friend-name">${friend.friend.username}</div>
                    <div class="friend-status ${friend.friend.status || 'offline'}"></div>
                </div>
            </div>
        `).join('');
    
        this.setupFriendHandlers();
    }

    async startChat(friendId) {
        if (this.currentChatId) {
            wsManager.removeMessageCallback(this.handleMessage);
            wsManager.removeStatusCallback(this.handleStatus);
            wsManager.disconnect(this.currentChatId);
        }
    
        try {
            const response = await this.http.post('/chat/start/', {
                friend_id: friendId
            });
            
            const chatId = response.id;
            if (!chatId) {
                throw new Error('Failed to get chat ID from server');
            }
    
            window.history.pushState({}, '', `/dashboard/chat/${chatId}`);
            this.currentChatId = chatId;
            this.messages = new Map();
            this.pendingMessages = new Set();
            this.connectionState = {
                status: 'disconnected',
                lastAttempt: null,
                error: null
            };
    
            const newContent = await this.render();
            this.element.innerHTML = newContent.innerHTML;
            
            this.initializeElements();
            await this.initializeChat();
    
            const activeFriend = this.friendsList.querySelector('.friend-item.active');
            if (activeFriend) {
                activeFriend.classList.remove('active');
            }
    
            const newActiveFriend = this.friendsList.querySelector(`[data-friendship-id="${friendId}"]`);
            if (newActiveFriend) {
                newActiveFriend.classList.add('active');
            }
    
        } catch (error) {
            if (error.message?.includes('Authentication required')) {
                window.location.href = '/login';
                return;
            }
            console.error('Failed to start chat:', error);
        }
    }
    
    setupFriendHandlers() {
        const friendItems = this.friendsList.querySelectorAll('.friend-item');
        friendItems.forEach(item => {
            const friendId = item.dataset.friendshipId;
            this.addListener(item, 'click', () => {
                if (this.currentChatId === friendId) return;
                this.startChat(friendId);
            });
        });
    }

    async loadInitialMessages() {
        try {
            const response = await this.http.get(`/chat/${this.currentChatId}/messages/`);
            response.messages.reverse().forEach(message => {
                this.messages.set(message.id, message);
            });
            this.renderMessages();
        } catch (error) {
            if (error.message?.includes('Authentication required')) {
                window.location.href = '/login';
            }
        }
    }

    renderMessages() {
        this.messagesList.innerHTML = '';
        Array.from(this.messages.values()).forEach(message => {
            this.renderMessage(message);
        });
        this.scrollToBottom();
    }

    renderMessage(message) {
        const messageElement = document.createElement('div');
        const isOwnMessage = message.sender_id === userState.getState().user?.id;
        
        messageElement.className = `chat-message ${isOwnMessage ? 'own-message' : 'other-message'}`;
        messageElement.innerHTML = `
            <div class="message-content">
                <div class="message-text">${message.content}</div>
                <div class="message-time">${this.formatTime(message.timestamp)}</div>
            </div>
        `;

        this.messagesList.appendChild(messageElement);
        this.scrollToBottom();
    }

    formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    scrollToBottom() {
        this.messagesList.scrollTop = this.messagesList.scrollHeight;
    }

    async handleSubmit(e) {
        e.preventDefault();
        const content = this.input.value.trim();
        if (!content) return;

        const messageId = Date.now().toString();
        const message = {
            id: messageId,
            content,
            sender_id: userState.getState().user?.id,
            timestamp: new Date().toISOString()
        };

        try {
            this.messages.set(messageId, message);
            this.renderMessage(message);
            this.input.value = '';
            
            await wsManager.send(this.currentChatId, {
                type: 'chat_message',
                message: content
            });
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    }

    handleMessage(chatId, data) {
        if (chatId !== this.currentChatId) return;
        if (data.type === 'chat_message') {
            this.messages.set(data.message.id, data.message);
            this.renderMessage(data.message);
        }
    }

    handleStatus(chatId, status) {
        if (chatId !== this.currentChatId) return;
        this.connectionState.status = status;
        this.updateConnectionStatus();
    }

    updateConnectionStatus() {
        const statusElement = this.element.querySelector('.chat-status');
        if (statusElement) {
            statusElement.textContent = this.connectionState.status;
            statusElement.className = `chat-status ${this.connectionState.status}`;
        }

        if (this.input) {
            this.input.disabled = this.connectionState.status !== 'connected';
        }
        if (this.sendButton) {
            this.sendButton.disabled = this.connectionState.status !== 'connected';
        }
    }

    initializeElements() {
        this.friendsList = this.$('.friends-list');
        
        if (this.currentChatId) {
            this.messagesList = this.$('.messages-list');
            this.form = this.$('.chat-form');
            this.input = this.$('.chat-input');
            this.sendButton = this.$('.chat-send-btn');

            this.addListener(this.form, 'submit', this.handleSubmit);
        }
    }

    async afterMount() {
        this.initializeElements();
        await this.loadFriends();
        
        if (this.currentChatId) {
            await this.initializeChat();
        }
    }

    beforeUnmount() {
        if (this.currentChatId) {
            wsManager.removeMessageCallback(this.handleMessage);
            wsManager.removeStatusCallback(this.handleStatus);
            wsManager.disconnect(this.currentChatId);
        }

        if (this.unsubscribeFriends) {
            this.unsubscribeFriends();
        }
    }
}