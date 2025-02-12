import { View } from "../core/View";
import { wsManager } from "../utils/WebSocketManager";
import { userState } from "../utils/UserState";
import { State } from "../core/State";
import { MessageHandler } from "../utils/MessageHandler";
import "../styles/dashboard/chat.css";

export class ChatView extends View {
  constructor(params = {}) {
    super();
    this.chatState = new State({
      conversations: [],
      messages: [],
      currentUserId: null,
      isLoading: false,
      searchResults: [],
      isSearching: false,
      selectedConversation: null,
    });

    this.messageHandler = new MessageHandler({ duration: 4000 });

    this.handleMessage = this.handleMessage.bind(this);
    this.handleStatusChange = this.handleStatusChange.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.handleStateChange = this.handleStateChange.bind(this);

    this.unsubscribe = this.chatState.subscribe(this.handleStateChange);
  }

  render() {
    const container = document.createElement("div");
    container.className = "chat-layout";
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
          ${
            this.chatState.getState().isSearching
              ? '<div class="searching-indicator">Searching...</div>'
              : ""
          }
          <div class="search-results"></div>
        </div>
        <div class="conversations-list"></div>
        <button class="new-chat-btn">New Chat</button>
      </div>
    `;
  }

  renderConversationsList() {
    const { conversations } = this.chatState.getState();
    const conversationsList = this.$(".conversations-list");
    if (conversationsList) {
      conversationsList.innerHTML =
        conversations.length > 0
          ? conversations
              .map((conv) => this.renderConversationItem(conv))
              .join("")
          : this.renderEmptyState();
    }
  }

  renderConversationItem(conversation) {
    if (!conversation) return "";
    const unreadCount = conversation?.unread_count || 0;
    return `
            <div class="conversation-item" 
                 data-user-id="${conversation.user_id}">
                <div class="user-avatar-conv">
                    <img src="${
                      conversation.user?.avatar_url
                    }" alt="User avatar" />
                </div>
                <div class="conversation-info">
                    <div class="user-name">${this.sanitizeHTML(
                      conversation.user?.username
                    )}</div>
                    <div class="last-message">${this.sanitizeHTML(
                      this.truncate(conversation.last_message)
                    )}</div>
                </div>
                <div class="conversation-meta">
                    <div class="last-time">${this.formatDate(
                      conversation.last_message_time
                    )}</div>
                    ${
                      unreadCount > 0
                        ? `<div class="unread-count">${unreadCount}</div>`
                        : ""
                    }
                </div>
            </div>
        `;
  }

  renderNoConversationSelected() {
    return `
      <div class="no-conversation-selected">
        Select a conversation to start chat
      </div>
    `;
  }

  renderChatMain() {
    return `
      <div class="chat-main">
        <div class="chat-header"></div>
        ${this.renderMessagesList()}
        <form class="chat-form"></form>
      </div>
    `;
  }

  renderChatForm(conversation) {
    const chatForm = this.$(".chat-form");
    if (chatForm && conversation) {
      chatForm.innerHTML = `
        <input type="text" class="chat-input-text" placeholder="Type a message...">
        <button type="submit" class="chat-send-btn">Send</button>
      `;
    }
  }

  renderChatHeader(conversation) {
    const chatHeader = this.$(".chat-header");
    if (chatHeader && conversation) {
      chatHeader.innerHTML = `
        <div class="chat-info">
          <div>
            <div class="user-name">${this.sanitizeHTML(
              conversation.user?.username
            )}</div>
            <div class="user-status">
              <span class="status-indicator ${
                conversation.user?.is_online ? "online" : "offline"
              }"></span>
              ${
                conversation.user?.is_online
                  ? "Online"
                  : `Last seen ${this.formatLastSeen(
                      conversation.user?.last_seen
                    )}`
              }
            </div>
          </div>
          <div class="chat-actions"> 
            <button class="game-invite-btn">Play</button>

            <button class="chat-menu-btn">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="12" cy="5" r="1"></circle>
                <circle cx="12" cy="19" r="1"></circle>
              </svg>
            </button>
            <div class="chat-menu">
              <div class="chat-menu-item" data-action="block">Block User</div>
              <div class="chat-menu-item" data-action="unBlock">Unblock</div>
            </div>
          </div>
        </div>
      `;

      this.setupMenuEventListeners();
    }
  }

  inviteToGame() {
    const inviteButton = this.$(".game-invite-btn");
    if (inviteButton) {
      inviteButton.addEventListener("click", () => {
        alert("Game invite feature coming soon!");
      });
    }
  }

  setupMenuEventListeners() {
    const menuButton = this.$(".chat-menu-btn");
    const menu = this.$(".chat-menu");

    if (menuButton && menu) {
      menuButton.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.classList.toggle("active");
      });

      menu.addEventListener("click", (e) => {
        const menuItem = e.target.closest(".chat-menu-item");
        if (menuItem) {
          const action = menuItem.dataset.action;
          this.handleMenuAction(action);
          menu.classList.remove("active");
        }
      });

      document.addEventListener("click", (e) => {
        if (!menuButton.contains(e.target) && !menu.contains(e.target)) {
          menu.classList.remove("active");
        }
      });
    }

    this.inviteToGame();
  }

  async handleMenuAction(action) {
    const selectedConversation = this.chatState.getState().selectedConversation;
    if (!selectedConversation) return;

    switch (action) {
      case "block":
        try {
          await userState.http.post(`/chat/block/`, {
            user_id: selectedConversation.user_id,
          });
          this.messageHandler.success("User blocked successfully");
          await this.updateConversations();
        } catch (error) {
          this.messageHandler.error("Failed to block user");
        }
      case "unBlock":
        try {
          await userState.http.delete(`/chat/block/`, {
            user_id: selectedConversation.user_id,
          });
          this.messageHandler.success("User unblocked successfully");
          await this.updateConversations();
        } catch (error) {
          this.messageHandler.error("Failed to unblock user");
        }
        break;
    }
  }

  renderMessagesList() {
    return `
      <div class="messages-list">
        ${this.chatState
          .getState()
          .messages.map((msg) => this.renderMessage(msg))
          .join("")}
      </div>
    `;
  }

  truncate(message) {
    return message.substring(0, 12) + "...";
  }

  renderMessage(message) {
    const isOwnMessage = message.receiver === userState.state.user.id;
    return `
            <div class="chat-message ${
              isOwnMessage ? "own-message" : ""
            }" data-message-id="${message.id}">
                <div class="message-container">
                    <div class="message-content">
                        <div class="message-text">${this.sanitizeHTML(
                          message.content
                        )}</div>
                        <div class="message-metadata">
                            <span class="message-time">${this.formatDate(
                              message.timestamp
                            )}</span>
                            ${this.getMessageStatusIcon(
                              "delivered",
                              isOwnMessage
                            )}
                        </div>
                    </div>
                </div>
            </div>
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

    return searchResults
      .map(
        (user) => `
            <div class="search-result-item" data-user-id="${user.id}">
                <div class="user-avatar">
                    <img src="${user.avatar_url}" alt="User avatar" />
                </div>
                <div class="user-info">
                    <div class="user-name">${this.sanitizeHTML(
                      user.username
                    )}</div>
                    <div class="user-status ${
                      user.is_online ? "online" : "offline"
                    }">
                        ${user.is_online ? "Online" : "Offline"}
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  }

  formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  formatLastSeen(lastSeen) {
    if (!lastSeen) return "Never";

    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInSeconds = Math.floor((now - lastSeenDate) / 1000);

    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    } else {
      return lastSeenDate.toLocaleDateString();
    }
  }

  getMessageStatusIcon(status, isOwnMessage) {
    if (!isOwnMessage) return "";
    const icons = {
      sending: "🕒",
      sent: "✓",
      delivered: "✓✓",
      read: "✓✓",
    };
    return icons[status] || "";
  }

  sanitizeHTML(str) {
    const temp = document.createElement("div");
    temp.textContent = str;
    return temp.innerHTML;
  }

  scrollToBottom() {
    const messagesList = this.$(".messages-list");
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
      userState
        .searchUsers(query, {
          exclude_friends: false,
          exclude_blocked: true,
        })
        .then((response) => {
          this.chatState.setState({
            searchResults: response.results || [],
            isSearching: false,
          });
          this.updateSearchResultsUI();
        })
        .catch((error) => {
          this.messageHandler.error("Failed to search users");
          this.chatState.setState({ isSearching: false });
        });
    }, 300);
  }

  updateSearchResultsUI() {
    const searchResultsContainer = this.$(".search-results");
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
    const searchInput = this.$(".search-input");
    const searchResultsContainer = this.$(".search-results");

    if (searchInput) {
      const debouncedSearch = this.debounce((value) => {
        this.searchUsers(value);
      }, 300);

      searchInput.addEventListener("input", (e) => {
        const value = e.target.value.trim();
        if (value.length >= 2) {
          debouncedSearch(value);
          searchResultsContainer.style.display = "block";
        } else {
          searchResultsContainer.style.display = "none";
          this.chatState.setState({ searchResults: [], isSearching: false });
        }
      });

      document.addEventListener("click", (e) => {
        if (
          !searchInput.contains(e.target) &&
          !searchResultsContainer.contains(e.target)
        ) {
          searchResultsContainer.style.display = "none";
        }
      });
    }

    if (searchResultsContainer) {
      searchResultsContainer.addEventListener("click", (e) => {
        const searchResultItem = e.target.closest(".search-result-item");
        if (searchResultItem) {
          const userId = searchResultItem.dataset.userId;

          const results = this.chatState.getState().searchResults;
          const user = results.find((user) => user.id === userId);

          this.startNewConversation(user);
          searchResultsContainer.style.display = "none";
          if (searchInput) {
            searchInput.value = "";
          }
        }
      });
    }

    const newChatBtn = this.$(".new-chat-btn");
    if (newChatBtn) {
      newChatBtn.addEventListener("click", () => {
        this.chatState.setState({ searchResults: [], isSearching: true });
        const searchInput = this.$(".search-input");
        if (searchInput) {
          searchInput.focus();
        }
      });
    }

    const chatForm = this.$(".chat-form");
    if (chatForm) {
      chatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = this.$(".chat-input-text");
        if (input && input.value.trim()) {
          this.sendMessage(input.value.trim());

          input.value = "";
        }
      });
    }

    const conversationsList = this.$(".conversations-list");
    if (conversationsList) {
      conversationsList.addEventListener("click", (e) => {
        const conversationItem = e.target.closest(".conversation-item");
        if (conversationItem) {
          const userId = conversationItem.dataset.userId;
          const selectedConversation = this.chatState
            .getState()
            .conversations.find((conv) => conv.user_id === userId);
          if (selectedConversation) {
            this.chatState.setState({ selectedConversation });
            this.loadChatHistory(selectedConversation);
          }
        }
      });
    }
  }

  async startNewConversation(user) {
    if (!user) return;

    const prevConversations = this.chatState.getState().conversations;

    const formattedDateTime = new Date()
      .toISOString()
      .slice(0, 16)
      .replace("T", " ");

    const newConversation = {
      user_id: user?.id,
      user,
      last_message: "",
      last_message_time: formattedDateTime,
    };

    this.chatState.setState({
      selectedConversation: newConversation,
      conversations: [...prevConversations, newConversation],
      searchResults: [],
      isSearching: false,
    });

    const searchInput = this.$(".search-input");
    if (searchInput) {
      searchInput.value = "";
    }
  }

  updateLoadingState(isLoading) {
    const loadingIndicator = this.$(".loading-indicator");
    if (loadingIndicator) {
      loadingIndicator.style.display = isLoading ? "block" : "none";
    }
  }

  async initialize() {
    try {
      this.chatState.setState({ isLoading: true });

      const state = userState.getState();
      const currentUserId = state.user?.id;
      this.chatState.setState({ currentUserId });

      await wsManager.connect();

      wsManager.onMessage(this.handleMessage);
      wsManager.onStatusChange(this.handleStatusChange);

      await this.updateConversations();
      this.renderConversationsList();

      this.messageHandler.success("Chat initialized successfully");
    } catch (error) {
      console.error("Chat initialization error:", error);
      this.messageHandler.error(
        "Failed to initialize chat. Please refresh the page."
      );
    } finally {
      this.chatState.setState({ isLoading: false });
    }
  }

  async updateConversations() {
    try {
      const response = await userState.http.get("/chat/list/");
      if (response && Array.isArray(response)) {
        this.chatState.setState({ conversations: response });
        this.renderConversationsList();
      }
    } catch (error) {
      this.messageHandler.error("Could not load conversations");
    }
  }

  async loadChatHistory(selectedConversation) {
    try {
      this.chatState.setState({ isLoading: true, selectedConversation });

      const response = await userState.http.get(
        `/chat/${selectedConversation.user_id}/messages/`
      );

      if (response) {
        this.chatState.setState({ messages: response });
        this.scrollToBottom();
      }

      this.renderChatHeader(selectedConversation);
      this.renderChatForm(selectedConversation);
    } catch (error) {
      this.messageHandler.error("Could not load chat history");
    } finally {
      this.chatState.setState({ isLoading: false });
    }
  }

  handleStateChange(newState) {
    const messagesList = this.$(".messages-list");
    if (messagesList && newState.messages !== this.messages) {
      messagesList.innerHTML = newState.messages
        .map((msg) => this.renderMessage(msg))
        .join("");
      this.scrollToBottom();
    }

    if (newState.selectedConversation !== this.selectedConversation) {
      this.renderChatHeader(newState.selectedConversation);
      this.renderChatForm(newState.selectedConversation);
    }

    this.renderConversationsList();

    this.updateLoadingState(newState.isLoading);
    this.updateSearchResultsUI();
  }

  updateMessageStatus(timestamp, status) {
    this.chatState.setState((prevState) => ({
      messages: prevState.messages.map((msg) =>
        msg.time === timestamp ? { ...msg, status: status } : msg
      ),
    }));
  }

  sendMessage(content) {
    if (!content.trim()) return;

    const receiverId = this.chatState.getState().selectedConversation.user_id;
    const senderId = this.chatState.getState().currentUserId;

    try {
      const message = {
        content,
        sender: senderId,
        receiver: receiverId,
        time: new Date().toISOString(),
        status: "sending",
      };

      const sent = wsManager.sendMessage(receiverId, content);

      this.updateMessageStatus(message.time, sent ? "sent" : "failed");

      this.scrollToBottom();
    } catch (error) {
      this.messageHandler.error("Failed to send message. Please try again.");
    }
  }

  handleMessage(message) {
    switch (message.type) {
      case "message":
        this.handleChatMessage(message);
        break;
      case "read_receipt":
        this.handleReadReceipt(message);
        break;
      case "status":
        this.handleUserStatus(message);
        break;
    }
  }

  handleChatMessage(message) {
    this.chatState.setState({
      messages: [...this.chatState.getState().messages, message],
    });

    this.renderConversationsList();

    this.scrollToBottom();

    wsManager.sendReadReceipt(message.id);

    this.updateConversations();
  }

  handleReadReceipt(data) {
    this.updateMessageStatus(data.message_id, "read");
  }

  handleUserStatus(data) {
    this.chatState.setState((prevState) => ({
      conversations: prevState.conversations.map((conv) =>
        conv.user_id === data.user_id
          ? { ...conv, is_online: data.status === "online" }
          : conv
      ),
    }));
  }

  handleStatusChange(status) {
    const statusElement = this.$(".chat-header .connection-status");
    if (statusElement) {
      statusElement.textContent = status;
      statusElement.className = `connection-status ${status}`;
    }

    if (status === "disconnected") {
      wsManager.connect();
    }
  }

  async afterMount() {
    await this.initialize();
    this.setupEventListeners();
  }

  cleanup() {
    wsManager.disconnect();

    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
