import { View } from '../core/View';
import { wsManager } from '../utils/WebSocketManager';
import { userState } from '../utils/UserState';
import { State } from '../core/State';
import { MessageHandler } from '../utils/MessageHandler';
import "../styles/dashboard/chat.css"

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

        this.messageHandler = new MessageHandler({ duration: 4000 });
        
        this.handleMessage = this.handleMessage.bind(this);
        this.handleStatusChange = this.handleStatusChange.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.handleStateChange = this.handleStateChange.bind(this);
        
        this.unsubscribe = this.chatState.subscribe(this.handleStateChange);
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

    renderConversationsSidebar() {
        return `
            <div class="conversations-sidebar">
                <div class="conversations-header">
                    <h2>Conversations</h2>
                </div>
                <div class="search-container">
                    <input type="text" class="search-input" placeholder="Search users..." autocomplete="off">
                    ${this.chatState.getState().isSearching ? '<div class="searching-indicator">Searching...</div>' : ''}
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

    renderConversationItem(conversation) {
        const unreadCount = conversation.unread_count || 0;
        return `
            <div class="conversation-item ${this.activeChatInfo.chatId === conversation.user_id ? 'active' : ''}" 
                 data-user-id="${conversation.user_id}">
                <div class="user-avatar">${this.getInitials(conversation.username)}</div>
                <div class="conversation-info">
                    <div class="user-name">${this.sanitizeHTML(conversation.username)}</div>
                    <div class="last-message">${this.sanitizeHTML(conversation.last_message)}</div>
                </div>
                <div class="conversation-meta">
                    <div class="last-time">${this.formatDate(conversation.last_message_time)}</div>
                    ${unreadCount > 0 ? `<div class="unread-count">${unreadCount}</div>` : ''}
                </div>
            </div>
        `;
    }

    renderChatMain() {
        const { conversations } = this.chatState.getState();
        const currentChat = conversations.find(c => c.user_id === this.activeChatInfo.chatId);
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
                    <div class="user-status">
                        <span class="status-indicator ${chat.is_online ? 'online' : 'offline'}"></span>
                        ${chat.is_online ? 'Online' : `Last seen ${this.formatLastSeen(chat.last_seen)}`}
                    </div>
                </div>
            </div>
        `;
    }

    renderMessagesList() {
        console.log(this.chatState.getState())
        return `
            <div class="messages-list">
                ${this.chatState.getState().messages.map(msg => this.renderMessage(msg)).join('')}
            </div>
        `;
    }

    renderMessage(message) {
        const isOwnMessage = message.sender === this.params.id;
        return `
            <div class="chat-message ${isOwnMessage ? 'own-message' : ''}" data-message-id="${message.id}">
                <div class="message-container">
                    <div class="message-content">
                        <div class="message-text">${this.sanitizeHTML(message.content)}</div>
                        <div class="message-metadata">
                            <span class="message-time">${this.formatDate(message.timestamp)}</span>
                            ${this.getMessageStatusIcon("delivered", isOwnMessage)}
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
        if (searchResults.length === 0) {
            return '<div class="no-results">No users found</div>';
        }
        
        return searchResults.map(user => `
            <div class="search-result-item" data-user-id="${user.id}">
                <div class="user-avatar">
                    <img src="${user.avatar_url}" alt="User avatar" />
                </div>
                <div class="user-info">
                    <div class="user-name">${this.sanitizeHTML(user.username)}</div>
                    <div class="user-status ${user.is_online ? 'online' : 'offline'}">
                        ${user.is_online ? 'Online' : 'Offline'}
                    </div>
                </div>
            </div>
        `).join('');
    }

    getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    formatLastSeen(lastSeen) {
        if (!lastSeen) return 'Never';
    
        const now = new Date();
        const lastSeenDate = new Date(lastSeen);
        const diffInSeconds = Math.floor((now - lastSeenDate) / 1000);
    
        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 604800) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        } else {
            return lastSeenDate.toLocaleDateString();
        }
    }

    getMessageStatusIcon(status, isOwnMessage) {
        if (!isOwnMessage) return '';
        const icons = {
            sending: '🕒',
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

    searchUsers(query) {
        if (query.length < 2) {
            this.chatState.setState({ searchResults: [], isSearching: false });
            return;
        }
        
        this.chatState.setState({ isSearching: true });
        
        setTimeout(() => {
            userState.searchUsers(query, {
                exclude_friends: false,
                exclude_blocked: true
            }).then(response => {
                this.chatState.setState({ 
                    searchResults: response.results || [],
                    isSearching: false
                });
                this.updateSearchResultsUI();
            }).catch(error => {
                this.messageHandler.error('Failed to search users');
                this.chatState.setState({ isSearching: false });
            });
        }, 300);
    }
    
    updateSearchResultsUI() {
        const searchResultsContainer = this.$('.search-results');
        if (searchResultsContainer) {
            searchResultsContainer.innerHTML = this.renderSearchResults();
        }
    }

    debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
    
    setupEventListeners() {
        const searchInput = this.$('.search-input');
        const searchResultsContainer = this.$('.search-results');
        
        if (searchInput) {
            const debouncedSearch = this.debounce((value) => {
                this.searchUsers(value);
            }, 300);

            searchInput.addEventListener('input', (e) => {
                const value = e.target.value.trim();
                if (value.length >= 2) {
                    debouncedSearch(value);
                    searchResultsContainer.style.display = 'block';
                } else {
                    searchResultsContainer.style.display = 'none';
                    this.chatState.setState({ searchResults: [], isSearching: false });
                }
            });

            document.addEventListener('click', (e) => {
                if (!searchInput.contains(e.target) && !searchResultsContainer.contains(e.target)) {
                    searchResultsContainer.style.display = 'none';
                }
            });
        }

        if (searchResultsContainer) {
            searchResultsContainer.addEventListener('click', (e) => {
                const searchResultItem = e.target.closest('.search-result-item');
                if (searchResultItem) {
                    const userId = searchResultItem.dataset.userId;
                    this.startNewConversation(userId);
                    searchResultsContainer.style.display = 'none';
                    if (searchInput) {
                        searchInput.value = '';
                    }
                }
            });
        }

        const newChatBtn = this.$('.new-chat-btn');
        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => {
                this.chatState.setState({ searchResults: [], isSearching: true });
                const searchInput = this.$('.search-input');
                if (searchInput) {
                    searchInput.focus();
                }
            });
        }

        const chatForm = this.$('.chat-form');
        if (chatForm) {
            chatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const input = this.$('.chat-input-text');
                if (input && input.value.trim()) {
                    this.sendMessage(input.value.trim());
                    input.value = '';
                }
            });
        }

        const conversationsList = this.$('.conversations-list');
        if (conversationsList) {
            conversationsList.addEventListener('click', (e) => {
                const conversationItem = e.target.closest('.conversation-item');
                if (conversationItem) {
                    const userId = conversationItem.dataset.userId;
                    this.loadChatHistory(userId);
                }
            });
        }
    }
    
    async startNewConversation(userId) {
        this.chatState.setState({ searchResults: [], isSearching: false });
        
         const searchInput = this.$('.search-input');
        if (searchInput) {
            searchInput.value = '';
        }
        
        this.router.navigate(`/dashboard/chat/${userId}`);
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
        this.updateSearchResultsUI();
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
            const currentUserId = state.user?.id;
            this.chatState.setState({ currentUserId });
    
            await wsManager.connectToChat(`user_${currentUserId}`);
    
            const userId = this.params.id;

            if (userId) {
                await this.loadChatHistory(userId);
            }
    
            wsManager.onMessage(this.handleMessage);
            wsManager.onStatusChange(this.handleStatusChange);
    
            this.messageHandler.success('Chat initialized successfully');
        } catch (error) {
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
            this.messageHandler.error('Could not load chat history');
        } finally {
            this.chatState.setState({ isLoading: false });
        }
    }

    updateMessageStatus(timestamp, status) {
        this.chatState.setState(prevState => ({
            messages: prevState.messages.map(msg => 
                msg.time === timestamp ? { ...msg, status: status } : msg
            )
        }));
    }
    
    async sendMessage(content) {
        if (!this.activeChatInfo.chatId) {
            console.error('No active chat selected');
            return;
        }
    
        if (!content.trim() || !this.activeChatInfo.chatId) return;
    
        try {
            const message = {
                content,
                sender: this.chatState.getState().currentUserId,
                receiver: this.activeChatInfo.receiverId,
                time: new Date().toISOString(),
                status: 'sending'
            };
    
            this.chatState.setState(prevState => ({
                messages: [...prevState.messages, message]
            }));
    
            const sent = wsManager.sendMessage(this.activeChatInfo.chatId, content, this.activeChatInfo.receiverId);
    
            if (sent) {
                this.updateMessageStatus(message.time, 'sent');
            } else {
                this.updateMessageStatus(message.time, 'failed');
            }
    
            this.scrollToBottom();
        } catch (error) {
            this.messageHandler.error('Failed to send message. Please try again.');
        }
    }
    
    handleMessage(chatId, message) {
        if (chatId === this.activeChatInfo.chatId) {
            this.chatState.setState(prevState => ({
                messages: [...prevState.messages, message]
            }));
            this.scrollToBottom();
            
            wsManager.sendReadReceipt(chatId, message.id);
        } else {
            this.updateUnreadCount(chatId);
        }
    
        this.updateConversationLastMessage(chatId, message);
    }
    
    handleStatusChange(chatId, status) {
        const statusElement = this.$('.chat-header .connection-status');
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = `connection-status ${status}`;
        }
    }
    
    async afterMount() {
        await this.initialize();
        this.setupEventListeners();
        this.refreshInterval = setInterval(() => {
            this.updateConversations();
        }, 30000);
    }
    
    cleanup() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        if (this.chatState.getState().currentUserId) {
            wsManager.disconnect(`user_${this.chatState.getState().currentUserId}`);
        }
        if (this.activeChatInfo.chatId) {
            wsManager.disconnect(this.activeChatInfo.chatId);
        }
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
}