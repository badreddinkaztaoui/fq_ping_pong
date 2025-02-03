import { View } from '../core/View';
import { wsManager } from '../utils/WebSocketManager';
import { userState } from '../utils/UserState';
import "../styles/dashboard/chat.css"
import { Http } from '../utils/Http';

export class ChatView extends View {
    constructor(params = {}) {
        super();
        this.friends = [];
        this.currentChatId = params.id || null;
        this.messages = [];
        this.connectionStatus = 'disconnected';
        this.error = null;
        this.http = new Http(userState);

        this.handleMessage = this.handleMessage.bind(this);
        this.handleStatus = this.handleStatus.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    async render() {
        const container = document.createElement('div');
        container.className = 'chat-layout valorant-theme';
        container.innerHTML = `
            <div class="friends-sidebar">
                <div class="friends-header">
                    <div class="friends-search">
                        <input type="text" placeholder="Search friends..." class="valorant-input">
                    </div>
                </div>
                <div class="friends-list">
                    <div class="friends-loading">Loading friends...</div>
                </div>
            </div>
            <div class="chat-main ${!this.currentChatId ? 'no-chat-selected' : ''}">
                ${!this.currentChatId ? `
                    <div class="no-chat-message">
                        <h3>Select a friend to start chatting</h3>
                    </div>
                ` : `
                    <div class="chat-container">
                        <div class="chat-header">
                            <div class="chat-status"></div>
                            <div class="chat-error"></div>
                        </div>
                        <div class="messages-list"></div>
                        <form class="chat-form">
                            <input type="text" class="chat-input" placeholder="Type a message...">
                            <button type="submit" class="chat-send-btn" disabled>Send</button>
                        </form>
                    </div>
                `}
            </div>
        `;
        return container;
    }

    async afterMount() {
        this.friendsList = this.$('.friends-list');
        
        if (this.currentChatId) {
            this.setupChatElements();
        }
        
        await this.loadFriends();
        
        if (this.currentChatId) {
            await this.loadInitialMessages();
            this.connectWebSocket();
        }
    }

    setupChatElements() {
        this.statusBar = this.$('.chat-status');
        this.errorElement = this.$('.chat-error');
        this.messagesList = this.$('.messages-list');
        this.form = this.$('.chat-form');
        this.input = this.$('.chat-input');
        this.sendButton = this.$('.chat-send-btn');

        this.addListener(this.form, 'submit', this.handleSubmit);
        this.addListener(this.input, 'input', () => {
            this.sendButton.disabled = !this.input.value.trim() || 
                this.connectionStatus !== 'connected';
        });
    }

    async loadFriends() {
        try {
            const friends = await userState.getFriends();
            this.friends = friends;
            this.renderFriendsList();
        } catch (err) {
            this.showError('Failed to load friends');
        }
    }

    renderFriendsList() {
        if (!this.friends?.length) {
            this.friendsList.innerHTML = '<div class="no-friends"><p>No friends found</p></div>';
            return;
        }

        this.friendsList.innerHTML = this.friends.map(friend => `
            <div class="friend-item ${this.currentChatId === friend.friendship_id ? 'active' : ''}" 
                 data-friend-id="${friend.friend.id}">
                <div class="friend-info">
                    <div class="friend-name">${friend.friend.username}</div>
                    <div class="friend-status">${friend.friend.online ? 'Online' : 'Offline'}</div>
                </div>
            </div>
        `).join('');

        this.setupFriendHandlers();
    }

    setupFriendHandlers() {
        this.friendsList.querySelectorAll('.friend-item').forEach(item => {
            this.addListener(item, 'click', () => {
                const friendId = item.dataset.friendId;
                this.startChat(friendId);
            });
        });
    }

    async startChat(friendId) {
        try {
            const response = await this.http.post('/chat/start/', {
                friend_id: friendId
            });
            
            if (response.id) {
                window.history.pushState({}, '', `/chat/${response.id}`);
                this.currentChatId = response.id;
                
                const newContent = await this.render();
                this.element.innerHTML = newContent.innerHTML;
                
                this.setupChatElements();
                
                try {
                    await this.loadInitialMessages();
                    this.connectWebSocket();
                } catch (err) {
                    console.error('Failed to initialize chat:', err);
                    this.showError('Failed to load messages. Please try refreshing.');
                }
            }
        } catch (err) {
            console.error('Chat error:', err);
            
            if (err.message.includes('Authentication required')) {
                window.location.href = '/login';
                return;
            }
            
            this.showError(err.message || 'Failed to start chat');
        }
    }

    connectWebSocket() {
        if (!this.currentChatId) return;
        
        wsManager.disconnect(this.currentChatId);
        wsManager.onMessage(this.handleMessage);
        wsManager.onStatusChange(this.handleStatus);
        wsManager.connectToChat(this.currentChatId);
    }

    showError(message) {
        if (this.errorElement) {
            this.error = message;
            this.errorElement.textContent = message;
            this.errorElement.style.display = 'block';
        }
    }

    handleMessage(chatId, message) {
        if (chatId === this.currentChatId) {
            this.messages.push(message);
            this.renderMessage(message);
        }
    }

    handleStatus(chatId, status) {
        if (chatId === this.currentChatId) {
            this.connectionStatus = status;
            this.updateStatusBar();
            
            if (this.sendButton) {
                this.sendButton.disabled = !this.input?.value.trim() || 
                    status !== 'connected';
            }
        }
    }

    updateStatusBar() {
        if (!this.statusBar) return;
        
        let statusText = '';
        switch (this.connectionStatus) {
            case 'connecting':
                statusText = 'Connecting...';
                break;
            case 'disconnected':
                statusText = 'Disconnected';
                break;
            case 'error':
                statusText = 'Connection error';
                break;
            default:
                this.statusBar.style.display = 'none';
                return;
        }
        
        this.statusBar.textContent = statusText;
        this.statusBar.style.display = 'block';
    }

    async loadInitialMessages() {
        try {
            if (!this.currentChatId) return;
            
            const response = await this.http.get(`/chat/${this.currentChatId}/messages/`);
            this.messages = response.messages.reverse();
            this.renderMessages();
        } catch (err) {
            if (err.message.includes('Authentication required')) {
                window.location.href = '/login';
                return;
            }
            this.showError('Failed to load messages');
        }
    }

    renderMessages() {
        this.messagesList.innerHTML = '';
        this.messages.forEach(message => this.renderMessage(message));
    }

    renderMessage(message) {
        const messageElement = document.createElement('div');
        const isOwnMessage = message.sender_id === userState.getState().user?.id;
        
        messageElement.className = `chat-message ${isOwnMessage ? 'own-message' : 'other-message'}`;
        messageElement.innerHTML = `
            <div class="message-content">
                <div class="message-text">${message.content}</div>
                <div class="message-time">${new Date(message.created_at).toLocaleTimeString()}</div>
            </div>
        `;

        this.messagesList.appendChild(messageElement);
    }

    async handleSubmit(e) {
        e.preventDefault();
        const message = this.input.value.trim();
        if (!message) return;
    
        try {
            const success = wsManager.send(this.currentChatId, {
                type: 'chat_message',
                message: message
            });
    
            if (!success) {
                await this.http.post(`/chat/${this.currentChatId}/send/`, {
                    content: message
                });
            }
    
            this.input.value = '';
            this.sendButton.disabled = true;
        } catch (err) {
            if (err.message.includes('Authentication required')) {
                window.location.href = '/login';
                return;
            }
            this.showError('Failed to send message');
        }
    }

    beforeUnmount() {
        if (this.currentChatId) {
            wsManager.removeMessageCallback(this.handleMessage);
            wsManager.removeStatusCallback(this.handleStatus);
            wsManager.disconnect(this.currentChatId);
        }
    }
}