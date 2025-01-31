import { View } from '../core/View';
import { wsManager } from '../utils/WebSocketManager';
import { userState } from '../utils/UserState';
import "../styles/dashboard/chat.css"
import { Http } from '../utils/Http';

export class ChatView extends View {
    constructor(params = {}) {
        super();
        this.friends = [];
        this.friendRequests = [];
        this.currentChatId = params.id || null;
        this.messages = [];
        this.hasMoreMessages = true;
        this.isLoadingMore = false;
        this.page = 0;
        this.messagesPerPage = 50;
        this.connectionStatus = 'disconnected';
        this.error = null;
        this.http = new Http(userState)

        this.handleMessage = this.handleMessage.bind(this);
        this.handleStatus = this.handleStatus.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.showError = this.showError.bind(this);
        this.hideError = this.hideError.bind(this);
    }

    showError(message) {
        if (this.errorElement) {
            this.error = message;
            this.errorElement.textContent = message;
            this.errorElement.style.display = 'block';
        } else {
            console.error('Error element not found:', message);
        }
    }

    hideError() {
        if (this.errorElement) {
            this.error = null;
            this.errorElement.style.display = 'none';
        }
    }

    renderFriendsList() {
        if (!this.friendsList) {
            console.error('Friends list element not found');
            return;
        }

        if (!this.friends?.length) {
            this.friendsList.innerHTML = `
                <div class="no-friends">
                    <p>NO AGENTS FOUND</p>
                </div>
            `;
            return;
        }

        this.friendsList.innerHTML = this.friends.map(friend => `
            <div class="friend-item ${this.currentChatId === friend.friendship_id ? 'active' : ''}" 
                 data-friend-id="${friend.friend.id}" 
                 data-friendship-id="${friend.friendship_id}">
                <div class="friend-avatar">
                    <img src="${friend.friend.avatar_url || '/default-avatar.png'}" alt="${friend.friend.username}">
                    <span class="status-indicator ${friend.friend.online ? 'online' : 'offline'}"></span>
                </div>
                <div class="friend-info">
                    <div class="friend-name">${friend.friend.username}</div>
                    <div class="friend-status">${friend.friend.online ? 'ONLINE' : 'OFFLINE'}</div>
                </div>
                <div class="friend-actions">
                    <button class="action-btn remove-friend" data-friendship-id="${friend.friendship_id}">
                        <i class="fas fa-user-minus"></i>
                    </button>
                    <button class="action-btn block-friend" data-user-id="${friend.friend.id}">
                        <i class="fas fa-ban"></i>
                    </button>
                </div>
            </div>
        `).join('');

        this.setupFriendHandlers();
    }

    renderFriendRequests() {
        if (!this.friendRequests?.length) {
            if (this.requestsElement) {
                this.requestsElement.innerHTML = '';
            }
            return;
        }

        const requestsHtml = `
            <div class="requests-header">
                <h3 class="valorant-subheading">PENDING REQUESTS</h3>
            </div>
            ${this.friendRequests.map(request => `
                <div class="friend-request-item">
                    <div class="friend-avatar">
                        <img src="${request.user.avatar_url || '/default-avatar.png'}" alt="${request.user.username}">
                    </div>
                    <div class="friend-info">
                        <div class="friend-name">${request.user.username}</div>
                    </div>
                    <div class="friend-request-actions">
                        <button class="accept-btn" data-friendship-id="${request.id}">ACCEPT</button>
                        <button class="reject-btn" data-friendship-id="${request.id}">REJECT</button>
                    </div>
                </div>
            `).join('')}
        `;

        if (this.requestsElement) {
            this.requestsElement.innerHTML = requestsHtml;
            this.setupRequestHandlers();
        }
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
                <div class="friends-sections">
                    <div class="friend-requests"></div>
                    <div class="friends-list">
                        <div class="friends-loading">Loading agents...</div>
                    </div>
                </div>
            </div>
            <div class="chat-main ${!this.currentChatId ? 'no-chat-selected' : ''}">
                ${!this.currentChatId ? `
                    <div class="no-chat-message">
                        <div class="valorant-logo"></div>
                        <h3>SELECT AN AGENT TO START CHATTING</h3>
                    </div>
                ` : `
                    <div class="chat-container">
                        <div class="chat-header">
                            <div class="chat-status-bar"></div>
                            <div class="chat-error"></div>
                        </div>
                        <div class="chat-messages">
                            <div class="load-more-container">
                                <button class="load-more-btn valorant-btn">VIEW PREVIOUS MESSAGES</button>
                            </div>
                            <div class="messages-list"></div>
                        </div>
                        <form class="chat-form">
                            <div class="chat-input-container">
                                <input type="text" class="chat-input valorant-input" placeholder="Type your message...">
                                <button type="submit" class="chat-send-btn valorant-btn" disabled>
                                    <svg class="send-icon" viewBox="0 0 24 24" width="24" height="24">
                                        <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </button>
                            </div>
                        </form>
                    </div>
                `}
            </div>
        `;
        return container;
    }

    async afterMount() {
        this.friendsList = this.$('.friends-list');
        this.friendRequests = this.$('.friend-requests');
        
        if (this.currentChatId) {
            this.setupChatElements();
        }
        
        await this.loadFriends();
        
        if (this.currentChatId) {
            await this.loadInitialMessages();
            this.connectWebSocket();
        }

        const searchInput = this.$('.friends-search input');
        if (searchInput) {
            this.addListener(searchInput, 'input', (e) => {
                this.filterFriends(e.target.value);
            });
        }
    }

    filterFriends(query) {
        const items = this.friendsList.querySelectorAll('.friend-item');
        items.forEach(item => {
            const name = item.querySelector('.friend-name').textContent.toLowerCase();
            if (name.includes(query.toLowerCase())) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }


    setupRequestHandlers() {
        this.friendRequests.querySelectorAll('.accept-btn').forEach(btn => {
            this.addListener(btn, 'click', async (e) => {
                const friendshipId = e.target.dataset.friendshipId;
                try {
                    await userState.acceptFriendRequest(friendshipId);
                    await this.loadFriends();
                } catch (err) {
                    this.showError('Failed to accept request');
                }
            });
        });

        this.friendRequests.querySelectorAll('.reject-btn').forEach(btn => {
            this.addListener(btn, 'click', async (e) => {
                const friendshipId = e.target.dataset.friendshipId;
                try {
                    await userState.rejectFriendRequest(friendshipId);
                    await this.loadFriends();
                } catch (err) {
                    this.showError('Failed to reject request');
                }
            });
        });
    }

    setupFriendHandlers() {
        this.friendsList.querySelectorAll('.friend-item').forEach(item => {
            this.addListener(item, 'click', () => {
                const friendId = item.dataset.friendId;
                this.startChat(friendId);
            });
        });

        this.friendsList.querySelectorAll('.remove-friend').forEach(btn => {
            this.addListener(btn, 'click', async (e) => {
                e.stopPropagation();
                const friendshipId = btn.dataset.friendshipId;
                try {
                    await userState.removeFriend(friendshipId);
                    await this.loadFriends();
                } catch (err) {
                    this.showError('Failed to remove friend');
                }
            });
        });

        this.friendsList.querySelectorAll('.block-friend').forEach(btn => {
            this.addListener(btn, 'click', async (e) => {
                e.stopPropagation();
                const userId = btn.dataset.userId;
                try {
                    await userState.blockUser(userId);
                    await this.loadFriends();
                } catch (err) {
                    this.showError('Failed to block user');
                }
            });
        });
    }

    setupChatElements() {
        this.statusBar = this.$('.chat-status-bar');
        this.errorElement = this.$('.chat-error');
        this.messagesContainer = this.$('.chat-messages');
        this.messagesList = this.$('.messages-list');
        this.loadMoreBtn = this.$('.load-more-btn');
        this.form = this.$('.chat-form');
        this.input = this.$('.chat-input');
        this.sendButton = this.$('.chat-send-btn');

        this.setupChatEventListeners();
    }

    setupChatEventListeners() {
        this.addListener(this.form, 'submit', this.handleSubmit);
        
        this.addListener(this.input, 'input', () => {
            this.sendButton.disabled = !this.input.value.trim() || 
                this.connectionStatus !== 'connected';
        });
        
        this.addListener(this.messagesContainer, 'scroll', this.handleScroll);
        this.addListener(this.loadMoreBtn, 'click', () => this.loadMoreMessages());
    }

    async loadFriends() {
        try {
            const friends = await userState.getFriends();
            this.friends = friends;
            this.renderFriendsList();
        } catch (err) {
            this.showError('Failed to load friends list');
        }
    }

    connectWebSocket() {
        if (!this.currentChatId) {
            console.error('No chat ID available for WebSocket connection');
            return;
        }

        wsManager.disconnect(this.currentChatId);
        wsManager.onMessage(this.handleMessage);
        wsManager.onStatusChange(this.handleStatus);
        wsManager.connectToChat(this.currentChatId);
    }

    beforeUnmount() {
        if (this.currentChatId) {
            wsManager.removeMessageCallback(this.handleMessage);
            wsManager.removeStatusCallback(this.handleStatus);
            wsManager.disconnect(this.currentChatId);
        }
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
                
                await this.loadInitialMessages();
                this.connectWebSocket();
            }
        } catch (err) {
            console.error('Failed to start chat:', err);
            this.showError('Failed to start chat');
        }
    }


    handleMessage(msgChatId, message) {
        if (msgChatId === this.chatId) {
            this.messages.push(message);
            this.renderMessage(message);
            this.scrollToBottom();
        }
    }

    handleStatus(statusChatId, status) {
        if (statusChatId === this.chatId) {
            this.connectionStatus = status;
            this.updateStatusBar();
            this.sendButton.disabled = !this.input.value.trim() || status !== 'connected';
            
            if (status === 'error') {
                this.showError('Connection error occurred');
            } else {
                this.hideError();
            }
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        const message = this.input.value.trim();
        if (!message) return;

        try {
            const success = wsManager.send(this.chatId, {
                type: 'chat_message',
                message: message
            });

            if (!success) {
                this.showError('Failed to send message - not connected');
                return;
            }

            this.input.value = '';
            this.sendButton.disabled = true;
        } catch (err) {
            this.showError('Failed to send message');
        }
    }

    async handleScroll() {
        const { scrollTop } = this.messagesContainer;
        if (scrollTop === 0) {
            await this.loadMoreMessages();
        }
    }

    async loadMoreMessages() {
        if (this.isLoadingMore || !this.hasMoreMessages) return;
        
        try {
            this.isLoadingMore = true;
            const offset = this.messages.length;
            
            const response = await this.http.get(`/chat/${this.currentChatId}/messages/?offset=${offset}&limit=${this.messagesPerPage}`);
            
            if (response.messages.length < this.messagesPerPage) {
                this.hasMoreMessages = false;
                this.loadMoreBtn.style.display = 'none';
            }
            
            this.messages = [...response.messages.reverse(), ...this.messages];
            
            const scrollHeight = this.messagesContainer.scrollHeight;
            this.renderMessages();
            const newScrollHeight = this.messagesContainer.scrollHeight;
            this.messagesContainer.scrollTop = newScrollHeight - scrollHeight;
            
        } catch (error) {
            this.showError('Failed to load messages');
        } finally {
            this.isLoadingMore = false;
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
                <div class="message-text">${this.escapeHtml(message.content)}</div>
                <div class="message-time">${this.formatTimestamp(message.created_at)}</div>
            </div>
        `;

        this.messagesList.appendChild(messageElement);
    }

    updateStatusBar() {
        let statusText = '';
        let statusClass = '';

        switch (this.connectionStatus) {
            case 'connecting':
                statusText = 'CONNECTING...';
                statusClass = 'status-connecting';
                break;
            case 'error':
                statusText = 'CONNECTION ERROR';
                statusClass = 'status-error';
                break;
            case 'disconnected':
                statusText = 'DISCONNECTED';
                statusClass = 'status-disconnected';
                break;
            default:
                this.statusBar.style.display = 'none';
                return;
        }

        this.statusBar.textContent = statusText;
        this.statusBar.className = `chat-status-bar ${statusClass}`;
        this.statusBar.style.display = 'block';
    }
}