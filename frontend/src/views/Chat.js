import { View } from '../core/View';
import "../styles/dashboard/chat.css"

export class ChatView extends View {
    constructor(params = {}) {
        super();
        // Mock data for demonstration purposes
        this.friends = [
            { id: 1, username: 'Alice', status: 'online', lastLogin: '2025-02-06T10:30:00Z' },
            { id: 2, username: 'Bob', status: 'offline', lastLogin: '2025-02-05T15:45:00Z' },
            { id: 3, username: 'Charlie', status: 'online', lastLogin: '2025-02-06T11:20:00Z' }
        ];

        this.messages = [
            { id: 1, content: 'Hey, how are you?', senderId: 1, timestamp: '2025-02-06T10:30:00Z', status: 'read' },
            { id: 2, content: 'I\'m good, thanks! How about you?', senderId: 'currentUser', timestamp: '2025-02-06T10:31:00Z', status: 'delivered' },
            { id: 3, content: 'Great! Want to play a game later?', senderId: 1, timestamp: '2025-02-06T10:32:00Z', status: 'sent' }
        ];

        // Current user's ID for message alignment
        this.currentUserId = 'currentUser';
    }

    async render() {
        // Create the main container
        const container = document.createElement('div');
        container.className = 'chat-layout';
        
        // Render the complete chat interface
        container.innerHTML = `
            ${this.renderFriendsSidebar()}
            ${this.renderChatMain()}
        `;

        return container;
    }

    renderFriendsSidebar() {
        return `
            <div class="friends-sidebar">
                <div class="friends-header">
                    <h2>Friends</h2>
                </div>
                <div class="friends-list">
                    ${this.friends.map(friend => this.renderFriendItem(friend)).join('')}
                </div>
            </div>
        `;
    }

    renderFriendItem(friend) {
        return `
            <div class="friend-item" data-friend-id="${friend.id}">
                <div class="friend-info">
                    <div class="friend-name">${this.sanitizeHTML(friend.username)}</div>
                    <div class="friend-status ${friend.status}"></div>
                </div>
            </div>
        `;
    }

    renderChatMain() {
        // For demonstration, we'll show the chat interface with the first friend
        const currentFriend = this.friends[0];
        
        return `
            <div class="chat-main">
                <div class="chat-container">
                    ${this.renderChatHeader(currentFriend)}
                    ${this.renderMessagesList()}
                    ${this.renderChatForm()}
                </div>
            </div>
        `;
    }

    renderChatHeader(friend) {
        return `
            <div class="chat-header">
                <div class="friend-chat-info">
                    <div class="friend-name-status">
                        <div class="friend-name">${this.sanitizeHTML(friend.username)}</div>
                        <div class="friend-status ${friend.status}"></div>
                    </div>
                    <div class="friend-activity">
                        ${this.formatLastSeen(friend.lastLogin)}
                    </div>
                </div>
            </div>
        `;
    }

    renderMessagesList() {
        return `
            <div class="messages-list">
                ${this.messages.map(message => this.renderMessage(message)).join('')}
            </div>
            <div class="typing-indicator" style="display: none;">Someone is typing...</div>
        `;
    }

    renderMessage(message) {
        const isOwnMessage = message.senderId === this.currentUserId;
        const statusIcon = this.getMessageStatusIcon(message.status, isOwnMessage);
        
        return `
            <div class="chat-message ${isOwnMessage ? 'own-message' : ''}" data-message-id="${message.id}">
                <div class="message-container">
                    <div class="message-content">
                        <div class="message-text">${this.sanitizeHTML(message.content)}</div>
                        <div class="message-metadata">
                            <span class="message-time">${this.formatDate(message.timestamp)}</span>
                            <span class="message-status">${statusIcon}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderChatForm() {
        return `
            <form class="chat-form">
                <input type="text" 
                       class="chat-input-text" 
                       placeholder="Type a message...">
                <button type="submit" 
                        class="chat-send-btn">
                    Send
                </button>
            </form>
        `;
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        return date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    formatLastSeen(dateString) {
        if (!dateString) return 'Last seen: Unknown';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Last seen: Unknown';
        
        const now = new Date();
        const diff = now - date;
        
        if (diff < 5 * 60 * 1000) return 'Online';
        if (diff < 24 * 60 * 60 * 1000) return `Last seen today at ${this.formatDate(dateString)}`;
        if (diff < 48 * 60 * 60 * 1000) return 'Last seen yesterday';
        return `Last seen on ${date.toLocaleDateString()}`;
    }

    getMessageStatusIcon(status, isOwnMessage) {
        if (!isOwnMessage) return '';
        
        switch(status) {
            case 'sent': return '✓';
            case 'delivered': return '✓✓';
            case 'read': return '✓✓';
            default: return '';
        }
    }

    sanitizeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }

    async afterMount() {
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        this.messagesList = this.$('.messages-list');
        this.chatForm = this.$('.chat-form');
        this.chatInput = this.$('.chat-input');
        this.sendButton = this.$('.chat-send-btn');
    }

    async setupEventListeners() {
        if (this.chatForm) {
            this.addListener(this.chatForm, 'submit', (e) => {
                e.preventDefault();
                this.chatInput.value = '';
            });
        }

        const friendItems = this.$$('.friend-item');
        friendItems.forEach(item => {
            this.addListener(item, 'click', () => {
                friendItems.forEach(fi => fi.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }
}