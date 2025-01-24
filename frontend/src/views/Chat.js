import { View } from "../core/View";
import { State } from "../core/State";
import "../styles/dashboard/chat.css"

export class ChatView extends View {
  constructor() {
    super();
    this.currentUser = null;
    this.messages = new Map();
    this.blockedUsers = new Set();
    this.onlineUsers = new Set();
    this.isEmojiPickerOpen = false;
  }

  async render() {
    const container = document.createElement('div');
    container.className = 'valorant-chat-container';

    const usersList = document.createElement('div');
    usersList.className = 'chat-users-list';
    usersList.innerHTML = `
      <div class="chat-search">
        <input type="text" class="chat-search-input" placeholder="Search agents...">
      </div>
    `;

    const sampleUsers = [
      { id: 1, name: 'Phoenix', status: 'online', avatar: '', lastMessage: 'Ready for the next match?' },
      { id: 2, name: 'Jett', status: 'away', avatar: '', lastMessage: 'Watch this!' },
      { id: 3, name: 'Viper', status: 'offline', avatar: '', lastMessage: 'Welcome to my world!' }
    ];

    sampleUsers.forEach(user => {
      if (!this.blockedUsers.has(user.id)) {
        usersList.appendChild(this.createUserElement(user));
      }
    });

    const chatContainer = document.createElement('div');
    chatContainer.className = 'chat-window-container';
    chatContainer.innerHTML = `
      <div class="chat-window">
        <div class="chat-window-empty">
          <div class="empty-state">
            <svg viewBox="0 0 24 24" width="48" height="48">
              <path fill="#ff4655" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            </svg>
            <h2>Select an agent to start chatting</h2>
          </div>
        </div>
      </div>
    `;

    container.appendChild(usersList);
    container.appendChild(chatContainer);
    return container;
  }

  formatMessageText(text) {
    return text.split(/(.{50})/).filter(Boolean).join('\n');
  }


  createUserElement(user) {
    const userElement = document.createElement('div');
    userElement.className = 'chat-user';
    userElement.dataset.userId = user.id;
    userElement.innerHTML = `
      <div class="chat-user-avatar-wrapper">
        <img src="${user.avatar}" alt="" class="chat-user-avatar">
        <div class="chat-user-status ${user.status}"></div>
      </div>
      <div class="chat-user-info">
        <h3 class="chat-user-name">${user.name}</h3>
        <p class="chat-user-last-message">${this.formatMessageText(user.lastMessage)}</p>
      </div>
      <div class="chat-user-actions">
        <button class="user-action-btn block-btn" data-user-id="${user.id}">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="#a0a0a0" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z"/>
          </svg>
        </button>
      </div>
    `;

    const blockBtn = userElement.querySelector('.block-btn');
    this.addListener(blockBtn, 'click', (e) => {
      e.stopPropagation();
      this.blockUser(user.id);
    });

    this.addListener(userElement, 'click', () => this.loadChatWindow(user));
    return userElement;
  }

  async loadChatWindow(user) {
    if (this.blockedUsers.has(user.id)) return;

    this.currentUser = user;
    const chatWindow = this.$('.chat-window');
    // Add active class for mobile
    chatWindow.classList.add('active');

    const backButton = `
    <button class="chat-back-btn">
      <svg viewBox="0 0 24 24" width="24" height="24">
        <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
      </svg>
    </button>
  `;

    chatWindow.innerHTML = `
  <div class="chat-header">
    ${window.innerWidth <= 768 ? backButton : ''}
    <img src="${user.avatar}" alt="" class="chat-header-avatar">
        <div class="chat-header-info">
          <h2>${user.name}</h2>
          <div class="chat-header-status">${user.status}</div>
        </div>
        <div class="chat-header-actions">
          <button class="more-actions-btn">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="#a0a0a0" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
          <div class="actions-dropdown">
            <button class="dropdown-action block-user">Block User</button>
            <button class="dropdown-action clear-chat">Clear Chat</button>
          </div>
        </div>
      </div>
      
      <div class="chat-messages"></div>
      
       <div class="chat-input-area">
      <div class="chat-input-actions">
        <div class="emoji-picker">
          <button class="chat-emoji-btn">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="#a0a0a0" d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-5-7h10v2H7v-2zm2-4a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm6 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/>
            </svg>
          </button>
          <div class="emoji-dropdown"></div>
        </div>
      </div>
      <input type="text" class="chat-input" placeholder="Type a message...">
      <button class="chat-send-btn">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path fill="white" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    </div>
    `;

    if (window.innerWidth <= 768) {
      const backBtn = chatWindow.querySelector('.chat-back-btn');
      this.addListener(backBtn, 'click', () => {
        chatWindow.classList.remove('active');
      });
    }
    const emojiBtn = chatWindow.querySelector('.chat-emoji-btn');
    this.addListener(emojiBtn, 'click', (e) => {
      e.stopPropagation();
      this.toggleEmojiPicker();
    });

    this.setupChatEventListeners();
    await this.loadMessages(user.id);
  }

  setupChatEventListeners() {
    const input = this.$('.chat-input');
    const sendBtn = this.$('.chat-send-btn');
    const emojiBtn = this.$('.chat-emoji-btn');
    const moreActionsBtn = this.$('.more-actions-btn');
    const actionsDropdown = this.$('.actions-dropdown');

    this.addListener(input, 'keypress', (e) => {
      if (e.key === 'Enter') this.handleSendMessage();
    });

    this.addListener(sendBtn, 'click', this.handleSendMessage.bind(this));
    this.addListener(emojiBtn, 'click', this.toggleEmojiPicker.bind(this));

    this.addListener(moreActionsBtn, 'click', () => {
      actionsDropdown.classList.toggle('show');
    });

    this.addListener(this.$('.block-user'), 'click', () => {
      this.blockUser(this.currentUser.id);
      actionsDropdown.classList.remove('show');
    });

    this.addListener(this.$('.clear-chat'), 'click', () => {
      this.clearChat(this.currentUser.id);
      actionsDropdown.classList.remove('show');
    });


    if (emojiBtn) {
      this.addListener(emojiBtn, 'click', (e) => {
        e.stopPropagation();
        this.toggleEmojiPicker();
      });
    }
  }

  blockUser(userId) {
    this.blockedUsers.add(userId);
    if (this.currentUser?.id === userId) {
      this.$('.chat-window').innerHTML = `
        <div class="chat-window-empty">
          <div class="empty-state">
            <svg viewBox="0 0 24 24" width="48" height="48">
              <path fill="#ff4655" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z"/>
            </svg>
            <h2>User Blocked</h2>
          </div>
        </div>
      `;
    }

    const userElement = this.$(`.chat-user[data-user-id="${userId}"]`);
    if (userElement) {
      userElement.remove();
    }
  }

  clearChat(userId) {
    this.messages.delete(userId);
    const messagesContainer = this.$('.chat-messages');
    if (messagesContainer) {
      messagesContainer.innerHTML = '';
    }
  }

  async handleSendMessage() {
    const input = this.$('.chat-input');
    const message = input.value.trim();

    if (message && this.currentUser) {
      const messageObj = {
        id: Date.now(),
        text: message,
        timestamp: new Date(),
        type: 'sent'
      };

      if (!this.messages.has(this.currentUser.id)) {
        this.messages.set(this.currentUser.id, []);
      }
      this.messages.get(this.currentUser.id).push(messageObj);
      this.renderMessage(messageObj);
      input.value = '';
    }
  }

  renderMessage(message) {
    const messagesContainer = this.$('.chat-messages');
    if (!messagesContainer) return;

    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${message.type}`;
    messageElement.dataset.messageId = message.id;

    messageElement.innerHTML = `
      <div class="message-content">${message.status === 'deleted' ? 'Message deleted' : this.formatMessageText(message.text)}</div>
      <div class="chat-message-time">${message.timestamp.toLocaleTimeString()}</div>
      ${message.type === 'sent' && !message.status ? `
        <button class="delete-message-btn" data-message-id="${message.id}">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      ` : ''}
    `;

    if (message.type === 'sent') {
      const deleteBtn = messageElement.querySelector('.delete-message-btn');
      this.addListener(deleteBtn, 'click', () => this.deleteMessage(message.id));
    }

    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  deleteMessage(messageId) {
    if (!this.currentUser) return;

    const messages = this.messages.get(this.currentUser.id) || [];
    const messageIndex = messages.findIndex(m => m.id === messageId);

    if (messageIndex !== -1) {
      messages[messageIndex].status = 'deleted';
      const messageElement = this.$(`.chat-message[data-message-id="${messageId}"]`);
      if (messageElement) {
        messageElement.querySelector('.message-content').textContent = 'Message deleted';
        messageElement.querySelector('.delete-message-btn')?.remove();
        messageElement.classList.add('deleted');
      }
    }
  }

  toggleEmojiPicker() {
    const picker = this.$('.emoji-dropdown');
    if (!picker) return;

    this.isEmojiPickerOpen = !this.isEmojiPickerOpen;
    picker.classList.toggle('show');

    if (this.isEmojiPickerOpen) {
      this.renderEmojis();
    }
  }

  closeEmojiPicker() {
    this.isEmojiPickerOpen = false;
    const picker = this.$('.emoji-dropdown');
    if (picker) picker.classList.remove('show');
  }

  renderEmojis() {
    const emojis = ['🎯', '🎮', '⚔️', '🏆', '💣', '🔥', '😈', '👻', '💀', '🤖', '👾', '🦹', '♥️'];
    const picker = this.$('.emoji-dropdown');
    picker.innerHTML = '';

    emojis.forEach(emoji => {
      const btn = document.createElement('button');
      btn.className = 'emoji-option';
      btn.textContent = emoji;
      btn.dataset.emoji = emoji;
      this.addListener(btn, 'click', () => {
        const input = this.$('.chat-input');
        input.value += emoji;
        this.closeEmojiPicker();
        input.focus();
      });
      picker.appendChild(btn);
    });
  }

  async loadMessages(userId) {
    if (!this.messages.has(userId)) {
      this.messages.set(userId, [
        { id: 1, text: 'Hey there!', timestamp: new Date(Date.now() - 300000), type: 'received' },
        { id: 2, text: 'Hi! How are you?', timestamp: new Date(Date.now() - 240000), type: 'sent' }
      ]);
    }

    const messages = this.messages.get(userId);
    messages.forEach(msg => this.renderMessage(msg));
  }

  async handleSearch(e) {
    const query = e.target.value.toLowerCase();
    const users = this.$('.chat-user');

    users.forEach(user => {
      const name = user.querySelector('.chat-user-name').textContent.toLowerCase();
      const shouldShow = name.includes(query) && !this.blockedUsers.has(parseInt(user.dataset.userId));
      user.style.display = shouldShow ? 'flex' : 'none';
    });
  }

  async setupEventListeners() {
    const searchInput = this.$('.chat-search-input');
    this.addListener(searchInput, 'input', this.handleSearch.bind(this));

    // Simulate online/offline updates
    setInterval(() => {
      const userStatuses = this.$('.chat-user-status');
      userStatuses.forEach(status => {
        const random = Math.random();
        if (random < 0.3) status.className = 'chat-user-status offline';
        else if (random < 0.6) status.className = 'chat-user-status away';
        else status.className = 'chat-user-status online';
      });
    }, 5000);
  }
}