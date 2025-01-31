import { View } from '../core/View';
import { userState } from '../utils/UserState';
import "../styles/dashboard/friends.css"

export class FriendsView extends View {
    constructor() {
        super();
        this.friends = [];
        this.friendRequests = [];
        this.searchQuery = '';
        this.searchResults = [];
        this.isSearching = false;
        this.error = null;
        this.loading = true;
    }

    async render() {
        const container = document.createElement('div');
        container.className = 'friends-page valorant-theme';
        container.innerHTML = `
            <div class="friends-container">
                <!-- Header Section -->
                <div class="friends-header">
                    <div class="header-title">
                        <span class="online-count">0 Online</span>
                    </div>
                    <div class="header-actions">
                        <div class="search-bar">
                            <input type="text" class="valorant-input" placeholder="Search friends or add new...">
                            <i class="fas fa-search search-icon"></i>
                        </div>
                        <button class="valorant-btn add-friend-btn">
                            <i class="fas fa-user-plus"></i>
                            ADD FRIEND
                        </button>
                    </div>
                </div>

                <!-- Search Results Section -->
                <div class="search-results-section" style="display: none;">
                    <h2 class="valorant-subheading">SEARCH RESULTS</h2>
                    <div class="search-results-list"></div>
                </div>

                <!-- Friend Requests Section -->
                <div class="friend-requests-section">
                    <h2 class="valorant-subheading">FRIEND REQUESTS</h2>
                    <div class="requests-list"></div>
                </div>

                <!-- Online Friends Section -->
                <div class="online-friends-section">
                    <h2 class="valorant-subheading">ONLINE</h2>
                    <div class="online-friends-list"></div>
                </div>

                <!-- Offline Friends Section -->
                <div class="offline-friends-section">
                    <h2 class="valorant-subheading">OFFLINE</h2>
                    <div class="offline-friends-list"></div>
                </div>

                <!-- Add Friend Modal -->
                <div class="modal" id="addFriendModal">
                    <div class="modal-content">
                        <h2 class="valorant-heading">ADD FRIEND</h2>
                        <input type="text" class="valorant-input" placeholder="Enter username">
                        <div class="modal-actions">
                            <button class="valorant-btn cancel-btn">CANCEL</button>
                            <button class="valorant-btn send-request-btn">SEND REQUEST</button>
                        </div>
                    </div>
                </div>

                <!-- Loading State -->
                <div class="loading-overlay ${this.loading ? 'active' : ''}">
                    <div class="loading-spinner"></div>
                </div>
            </div>
        `;

        return container;
    }

    async afterMount() {
        this.setupEventListeners();
        await this.loadFriends();
    }

    async setupEventListeners() {
        const searchInput = this.$('.search-bar input');
        let searchTimeout;
        this.addListener(searchInput, 'input', (e) => {
            clearTimeout(searchTimeout);
            this.searchQuery = e.target.value.trim();
            
            if (this.searchQuery.length === 0) {
                this.resetSearch();
                return;
            }

            searchTimeout = setTimeout(() => {
                if (this.searchQuery.length > 0) {
                    this.performSearch();
                }
            }, 500);
        });

        const addFriendBtn = this.$('.add-friend-btn');
        const modal = this.$('#addFriendModal');
        const cancelBtn = this.$('.cancel-btn');
        const sendRequestBtn = this.$('.send-request-btn');

        this.addListener(addFriendBtn, 'click', () => {
            modal.classList.add('active');
        });

        this.addListener(cancelBtn, 'click', () => {
            modal.classList.remove('active');
        });

        this.addListener(sendRequestBtn, 'click', async () => {
            const username = this.$('.modal-content input').value;
            await this.sendFriendRequest(username);
            modal.classList.remove('active');
        });
    }

    async performSearch() {
        try {
            this.isSearching = true;
            this.loading = true;
            this.$('.loading-overlay').classList.add('active');

            // Perform search, excluding friends and blocked users
            const response = await userState.searchUsers(this.searchQuery, {
                exclude_friends: false,
                exclude_blocked: true,
                limit: 10
            });

            this.searchResults = response.results;
            this.renderSearchResults();
        } catch (err) {
            console.error('Search failed:', err);
            this.showError('Failed to perform search');
        } finally {
            this.loading = false;
            this.$('.loading-overlay').classList.remove('active');
        }
    }

    renderSearchResults() {
        const searchResultsSection = this.$('.search-results-section');
        const searchResultsList = this.$('.search-results-list');

        if (!this.searchResults.length) {
            searchResultsSection.style.display = 'none';
            return;
        }

        searchResultsSection.style.display = 'block';
        
        searchResultsList.innerHTML = this.searchResults.map(user => `
            <div class="search-result-card" data-user-id="${user.id}">
                <div class="user-info">
                    <img src="${user.avatar_url || '/default-avatar.png'}" alt="${user.username}">
                    <div class="user-details">
                        <span class="username">${user.username}</span>
                        <span class="display-name">${user.display_name || ''}</span>
                    </div>
                </div>
                <div class="search-result-actions">
                    ${user.is_friend 
                        ? `<span class="friend-status">Friends</span>` 
                        : `<button class="valorant-btn send-request-btn" data-user-id="${user.id}">
                            ADD FRIEND
                           </button>`
                    }
                </div>
            </div>
        `).join('');

        this.setupSearchResultActions();
    }

    setupSearchResultActions() {
        const sendRequestBtns = this.$$('.search-result-actions .send-request-btn');
        
        sendRequestBtns.forEach(btn => {
            this.addListener(btn, 'click', async (e) => {
                const userId = btn.dataset.userId;
                try {
                    await userState.sendFriendRequest(userId);
                    this.showSuccess('Friend request sent successfully');
                    this.performSearch(); // Refresh search results
                } catch (err) {
                    this.showError('Failed to send friend request');
                }
            });
        });
    }

    resetSearch() {
        this.isSearching = false;
        this.searchResults = [];
        const searchResultsSection = this.$('.search-results-section');
        searchResultsSection.style.display = 'none';
        this.renderLists();
    }

    async loadFriends() {
        try {
            this.loading = true;
            const [friends, requests] = await Promise.all([
                userState.getFriends(),
                userState.getFriendRequests()
            ]);

            this.friends = friends;
            this.friendRequests = requests;
            this.renderLists();
        } catch (err) {
            console.error('Failed to load friends:', err);
            this.showError('Failed to load friends');
        } finally {
            this.loading = false;
            this.$('.loading-overlay').classList.remove('active');
        }
    }

    renderLists() {
        // If searching, don't render standard friends list
        if (this.isSearching) return;

        this.renderFriendRequests();
        this.renderFriends();
        this.updateOnlineCount();
    }

    renderFriendRequests() {
        const requestsList = this.$('.requests-list');

        if (!this.friendRequests.length) {
            requestsList.innerHTML = '<div class="no-requests">No pending requests</div>';
            return;
        }

        requestsList.innerHTML = this.friendRequests.map(request => `
            <div class="friend-request-card" data-request-id="${request.id}">
                <div class="user-info">
                    <img src="${request.user.avatar_url || '/default-avatar.png'}" alt="${request.user.username}">
                    <div class="user-details">
                        <span class="username">${request.user.username}</span>
                        <span class="time">Sent ${this.formatTime(request.created_at)}</span>
                    </div>
                </div>
                <div class="request-actions">
                    <button class="valorant-btn accept-btn" data-request-id="${request.id}">ACCEPT</button>
                    <button class="valorant-btn reject-btn" data-request-id="${request.id}">REJECT</button>
                </div>
            </div>
        `).join('');

        this.setupRequestButtons();
    }

    renderFriends() {
        const onlineList = this.$('.online-friends-list');
        const offlineList = this.$('.offline-friends-list');

        const onlineFriends = this.friends.filter(f => f.friend.online);
        const offlineFriends = this.friends.filter(f => !f.friend.online);

        const renderList = (friends, container) => {
            if (!friends.length) {
                container.innerHTML = '<div class="no-friends">No friends found</div>';
                return;
            }

            container.innerHTML = friends
                .filter(f => f.friend.username.toLowerCase().includes(this.searchQuery.toLowerCase()))
                .map(f => `
                    <div class="friend-card" data-friend-id="${f.friend.id}">
                        <div class="friend-info">
                            <img src="${f.friend.avatar_url || '/default-avatar.png'}" alt="${f.friend.username}">
                            <div class="friend-details">
                                <span class="friend-name">${f.friend.username}</span>
                                <span class="friend-status">${f.friend.status || 'In Menu'}</span>
                            </div>
                        </div>
                        <div class="friend-actions">
                            <button class="action-btn message-btn" title="Send Message">
                                <i class="fas fa-comment"></i>
                            </button>
                            <button class="action-btn remove-btn" title="Remove Friend">
                                <i class="fas fa-user-minus"></i>
                            </button>
                            <button class="action-btn block-btn" title="Block User">
                                <i class="fas fa-ban"></i>
                            </button>
                        </div>
                    </div>
                `).join('');
        };

        renderList(onlineFriends, onlineList);
        renderList(offlineFriends, offlineList);

        this.setupFriendActions();
    }

    setupFriendActions() {
        const messageBtns = this.$$('.message-btn');
        const removeBtns = this.$$('.remove-btn');
        const blockBtns = this.$$('.block-btn');

        messageBtns.forEach(btn => {
            this.addListener(btn, 'click', (e) => {
                const friendId = e.target.closest('.friend-card').dataset.friendId;
                this.router.navigate(`/dashboard/chat/${friendId}`);
            });
        });

        removeBtns.forEach(btn => {
            this.addListener(btn, 'click', async (e) => {
                const friendId = e.target.closest('.friend-card').dataset.friendId;
                await this.removeFriend(friendId);
            });
        });

        blockBtns.forEach(btn => {
            this.addListener(btn, 'click', async (e) => {
                const friendId = e.target.closest('.friend-card').dataset.friendId;
                await this.blockFriend(friendId);
            });
        });
    }

    setupRequestButtons() {
        const acceptBtns = this.$$('.accept-btn');
        const rejectBtns = this.$$('.reject-btn');

        acceptBtns.forEach(btn => {
            this.addListener(btn, 'click', async () => {
                const requestId = btn.dataset.requestId;
                await userState.acceptFriendRequest(requestId);
                await this.loadFriends();
            });
        });

        rejectBtns.forEach(btn => {
            this.addListener(btn, 'click', async () => {
                const requestId = btn.dataset.requestId;
                await userState.rejectFriendRequest(requestId);
                await this.loadFriends();
            });
        });
    }

    async removeFriend(friendshipId) {
        try {
            await userState.removeFriend(friendshipId);
            await this.loadFriends();
        } catch (err) {
            this.showError('Failed to remove friend');
        }
    }

    async blockFriend(userId) {
        try {
            await userState.blockUser(userId);
            await this.loadFriends();
        } catch (err) {
            this.showError('Failed to block user');
        }
    }

    async sendFriendRequest(username) {
        try {
            await userState.sendFriendRequest(username);
            this.showSuccess('Friend request sent successfully');
        } catch (err) {
            this.showError('Failed to send friend request');
        }
    }

    updateOnlineCount() {
        const onlineCount = this.friends.filter(f => f.friend.online).length;
        this.$('.online-count').textContent = `${onlineCount} Online`;
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString();
    }

    showError(message) {
        console.error(message);
    }

    showSuccess(message) {
        console.log(message);
    }
}