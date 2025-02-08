import { View } from '../core/View';
import { wsManager } from '../utils/WebSocketManager';
import { userState } from '../utils/UserState';
import { State } from '../core/State';
import { MessageHandler } from '../utils/MessageHandler';
import "../styles/dashboard/chat.css";

export class ChatView extends View {
    constructor(params = {}) {
        super();
        this.params = params;
        this.activeChatInfo = {
            chatId: params.id || null,
            senderId: null,
            receiverId: null
        };
        
        this.chatState = new State({
            conversations: [],
            messages: [],
            currentUserId: null,
            isLoading: false,
            searchResults: [],
            isSearching: false
        });

        this.messageHandler = new MessageHandler({
            duration: 4000
        });
        
        this.handleMessage = this.handleMessage.bind(this);
        this.handleStatusChange = this.handleStatusChange.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.handleStateChange = this.handleStateChange.bind(this);
        
        this.unsubscribe = this.chatState.subscribe(this.handleStateChange);
    }

    handleStateChange(newState) {
        const conversationsList = this.$('.conversations-list');
        if (conversationsList && newState.conversations !== this.conversations) {
            conversationsList.innerHTML = newState.conversations.length > 0 
                ? newState.conversations.map(conv => this.renderConversationItem(conv)).join('')
                : this.renderEmptyState();
        }

        const messagesList = this.$('.messages-list');
        if (messagesList && newState.messages !== this.messages) {
            messagesList.innerHTML = newState.messages.map(msg => this.renderMessage(msg)).join('');
            this.scrollToBottom();
        }

        this.updateLoadingState(newState.isLoading);
    }

    updateLoadingState(isLoading) {
        const loadingIndicator = this.$('.loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = isLoading ? 'block' : 'none';
        }
    }

    async initialize() {
        try {
            this.chatState.setState({ isLoading: true });
            const state = userState.getState();
            this.chatState.setState({ currentUserId: state.user?.id });
            await this.updateConversations();

            if (this.activeChatId) {
                await this.loadChatHistory(this.activeChatId);
            }

            wsManager.onMessage(this.handleMessage);
            wsManager.onStatusChange(this.handleStatusChange);

            if (this.chatState.getState().currentUserId) {
                await wsManager.connectToChat(`user_${this.chatState.getState().currentUserId}`);
            }
            
            this.messageHandler.success('Chat initialized successfully');
        } catch (error) {
            console.error('Failed to initialize chat:', error);
            this.messageHandler.error('Failed to initialize chat. Please refresh the page.');
        } finally {
            this.chatState.setState({ isLoading: false });
        }
    }

    async updateConversations() {
        try {
            const response = await userState.http.get('/chat/list/');
            if (response && Array.isArray(response)) {
                this.chatState.setState({ conversations: response });
            }
        } catch (error) {
            console.error('Failed to update conversations:', error);
            this.messageHandler.error('Could not load conversations');
        }
    }

    async loadChatHistory(userId) {
        try {
            this.chatState.setState({ isLoading: true });
            
            const conversation = this.chatState.getState().conversations
                .find(conv => conv.user_id === userId);
            
            if (conversation) {
                this.activeChatInfo = {
                    chatId: userId,
                    senderId: this.chatState.getState().currentUserId,
                    receiverId: userId
                };
            }

            const response = await userState.http.get(`/chat/${userId}/messages/`);
            
            if (response) {
                this.chatState.setState({ messages: response });
                this.scrollToBottom();
            }
        } catch (error) {
            console.error('Failed to load chat history:', error);
            this.messageHandler.error('Could not load chat history');
        } finally {
            this.chatState.setState({ isLoading: false });
        }
    }

    async sendMessage(content) {}

    handleMessage(chatId, message) {}

    handleStatusChange(chatId, status) {
        const statusElement = this.$('.chat-header .connection-status');
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = `connection-status ${status}`;
        }
    }

    async startNewConversation(userId) {}

    async searchUsers(query) {
        if (query.length < 2) return;
        
        try {
            this.chatState.setState({ isSearching: true });
            const response = await userState.searchUsers(query, {
                exclude_friends: false,
                exclude_blocked: true
            });
            
            this.chatState.setState({ 
                searchResults: response.results || [],
                isSearching: false
            });
            
            const searchResultsContainer = this.$('.search-results');
            if (searchResultsContainer) {
                searchResultsContainer.innerHTML = this.renderSearchResults();
            }
        } catch (error) {
            console.error('Failed to search users:', error);
            this.messageHandler.error('Failed to search users');
            this.chatState.setState({ isSearching: false });
        }
    }

    render() {
        const container = document.createElement('div');
        container.className = 'chat-layout';
        container.innerHTML = `
            ${this.renderConversationsSidebar()}
            ${this.renderChatMain()}
            <div class="loading-indicator" style="display: none;">Loading...</div>
        `;
        return container;
    }

    renderConversationItem(conversation) {
        return `
            <div class="conversation-item ${this.activeChatId === conversation.user_id ? 'active' : ''}" 
                 data-user-id="${conversation.user_id}">
                <div class="conversation-info">
                    <div class="user-name">${this.sanitizeHTML(conversation.username)}</div>
                    <div class="last-message">${this.sanitizeHTML(conversation.last_message)}</div>
                    <div class="last-time">${this.formatDate(conversation.last_message_time)}</div>
                </div>
            </div>
        `;
    }

    renderConversationsSidebar() {
        return `
            <div class="conversations-sidebar">
                <div class="conversations-header">
                    <h2>Conversations</h2>
                </div>
                <div class="search-container" style="display: none;">
                    <input type="text" class="search-input" placeholder="Search users..." autocomplete="off">
                    <div class="search-results"></div>
                </div>
                <div class="conversations-list">
                    ${this.chatState.getState().conversations.length > 0 
                        ? this.chatState.getState().conversations.map(conv => this.renderConversationItem(conv)).join('')
                        : this.renderEmptyState()}
                </div>
                <button class="new-chat-btn">New Chat</button>
            </div>
        `;
    }

    renderChatMain() {
        const { conversations } = this.chatState.getState();
        const currentChat = conversations.find(c => c.user_id === this.activeChatId);
        return `
            <div class="chat-main">
                ${currentChat ? this.renderChatHeader(currentChat) : ''}
                ${this.renderMessagesList()}
                ${this.renderChatForm()}
            </div>
        `;
    }

    renderChatHeader(chat) {
        return `
            <div class="chat-header">
                <div class="chat-info">
                    <div class="user-name">${this.sanitizeHTML(chat.username)}</div>
                    <div class="connection-status">connected</div>
                </div>
            </div>
        `;
    }

    renderMessagesList() {
        return `
            <div class="messages-list">
                ${this.chatState.getState().messages.map(msg => this.renderMessage(msg)).join('')}
            </div>
        `;
    }

    renderMessage(message) {
        const isOwnMessage = message.senderId === this.chatState.getState().currentUserId;
        return `
            <div class="chat-message ${isOwnMessage ? 'own-message' : ''}" data-message-id="${message.id}">
                <div class="message-container">
                    <div class="message-content">
                        <div class="message-text">${this.sanitizeHTML(message.content)}</div>
                        <div class="message-metadata">
                            <span class="message-time">${this.formatDate(message.timestamp)}</span>
                            ${this.getMessageStatusIcon(message.status, isOwnMessage)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderChatForm() {
        return `
            <form class="chat-form">
                <input type="text" class="chat-input-text" placeholder="Type a message...">
                <button type="submit" class="chat-send-btn">Send</button>
            </form>
        `;
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">💭</div>
                <h3>No Conversations Yet</h3>
                <p>Start chatting with other users by clicking the "New Chat" button above.</p>
            </div>
        `;
    }

    renderSearchResults() {
        const { searchResults } = this.chatState.getState();
        return searchResults.length > 0 
            ? searchResults.map(user => `
                <div class="search-result-item" data-user-id="${user.id}">
                    <div class="user-info">
                        <div class="user-name">${this.sanitizeHTML(user.username)}</div>
                    </div>
                </div>
            `).join('')
            : '<div class="no-results">No users found</div>';
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    getMessageStatusIcon(status, isOwnMessage) {
        if (!isOwnMessage) return '';
        const icons = {
            sent: '✓',
            delivered: '✓✓',
            read: '✓✓'
        };
        return icons[status] || '';
    }

    sanitizeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }

    scrollToBottom() {
        const messagesList = this.$('.messages-list');
        if (messagesList) {
            messagesList.scrollTop = messagesList.scrollHeight;
        }
    }

    async afterMount() {
        await this.initialize();
        this.setupEventListeners();
        this.refreshInterval = setInterval(() => {
            this.updateConversations();
        }, 30000);
    }

    setupEventListeners() {}

    cleanup() {
        if (this.currentUserId) {
            wsManager.disconnect(`user_${this.currentUserId}`);
        }
    }
}