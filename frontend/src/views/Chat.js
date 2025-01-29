import { View } from '../core/View';
import { wsManager } from '../utils/WebSocketManager';
import { userState } from '../utils/UserState';

export class ChatView extends View {
    constructor(chatId) {
        super();
        this.chatId = chatId;
        this.messages = [];
        this.hasMoreMessages = true;
        this.isLoadingMore = false;
        this.page = 0;
        this.messagesPerPage = 50;
        this.connectionStatus = 'disconnected';
        this.error = null;

        this.handleMessage = this.handleMessage.bind(this);
        this.handleStatus = this.handleStatus.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    async render() {
        const container = document.createElement('div');
        container.className = 'chat-container';
        container.innerHTML = `
            <div class="chat-status-bar"></div>
            <div class="chat-error"></div>
            <div class="chat-messages">
                <div class="load-more-container">
                    <button class="load-more-btn">Load more messages</button>
                </div>
                <div class="messages-list"></div>
            </div>
            <form class="chat-form">
                <div class="chat-input-container">
                    <input type="text" class="chat-input" placeholder="Type your message...">
                    <button type="submit" class="chat-send-btn" disabled>
                        <svg class="send-icon" viewBox="0 0 24 24" width="24" height="24">
                            <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </form>
        `;

        return container;
    }

    async afterMount() {
        // Cache DOM elements
        this.statusBar = this.$('.chat-status-bar');
        this.errorElement = this.$('.chat-error');
        this.messagesContainer = this.$('.chat-messages');
        this.messagesList = this.$('.messages-list');
        this.loadMoreBtn = this.$('.load-more-btn');
        this.form = this.$('.chat-form');
        this.input = this.$('.chat-input');
        this.sendButton = this.$('.chat-send-btn');

        // Set up event listeners
        this.setupEventListeners();

        // Load initial messages and connect to WebSocket
        await this.loadInitialMessages();
        this.connectWebSocket();
    }

    async setupEventListeners() {
        // Form submission
        this.addListener(this.form, 'submit', this.handleSubmit);

        // Input validation
        this.addListener(this.input, 'input', () => {
            this.sendButton.disabled = !this.input.value.trim() || 
                this.connectionStatus !== 'connected';
        });

        // Scroll handling for infinite scroll
        this.addListener(this.messagesContainer, 'scroll', this.handleScroll);

        // Load more button
        this.addListener(this.loadMoreBtn, 'click', () => this.loadMoreMessages());
    }

    async loadInitialMessages() {
        // try {
        //     const response = await userState.http.get(`/chat/${this.chatId}/messages/`);
        //     this.messages = response.messages.reverse();
        //     this.hasMoreMessages = response.messages.length < response.total_count;
        //     this.renderMessages();
        //     this.scrollToBottom();
        // } catch (err) {
        //     this.showError('Failed to load messages');
        // }
    }

    connectWebSocket() {
        wsManager.connectToChat(this.chatId);
        wsManager.onMessage(this.handleMessage);
        wsManager.onStatusChange(this.handleStatus);
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
        // if (this.isLoadingMore || !this.hasMoreMessages) return;

        // this.isLoadingMore = true;
        // this.loadMoreBtn.textContent = 'Loading...';
        // this.loadMoreBtn.disabled = true;

        // try {
        //     const nextPage = this.page + 1;
        //     const response = await userState.http.get(
        //         `/chat/${this.chatId}/messages/?offset=${nextPage * this.messagesPerPage}&limit=${this.messagesPerPage}`
        //     );
            
        //     this.messages = [...response.messages.reverse(), ...this.messages];
        //     this.hasMoreMessages = response.total_count > (nextPage + 1) * this.messagesPerPage;
        //     this.page = nextPage;
            
        //     this.renderMessages();
        //     this.loadMoreBtn.style.display = this.hasMoreMessages ? 'block' : 'none';
        // } catch (err) {
        //     this.showError('Failed to load more messages');
        // } finally {
        //     this.isLoadingMore = false;
        //     this.loadMoreBtn.textContent = 'Load more messages';
        //     this.loadMoreBtn.disabled = false;
        // }
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
                statusText = 'Connecting...';
                statusClass = 'status-connecting';
                break;
            case 'error':
                statusText = 'Connection error';
                statusClass = 'status-error';
                break;
            case 'disconnected':
                statusText = 'Disconnected';
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

    showError(message) {
        this.error = message;
        this.errorElement.textContent = message;
        this.errorElement.style.display = 'block';
    }

    hideError() {
        this.error = null;
        this.errorElement.style.display = 'none';
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleTimeString();
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    async beforeUnmount() {
        wsManager.disconnect(this.chatId);
        wsManager.removeMessageCallback(this.handleMessage);
        wsManager.removeStatusCallback(this.handleStatus);
    }
}