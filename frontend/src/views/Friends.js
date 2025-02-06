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
                        <button class="valorant-btn add-friend-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                <circle cx="8.5" cy="7" r="4"/>
                                <line x1="20" y1="8" x2="20" y2="14"/>
                                <line x1="23" y1="11" x2="17" y2="11"/>
                            </svg>
                            ADD FRIEND
                        </button>
                    </div>
                </div>
    
                <!-- Tabs Navigation -->
                <div class="tabs-nav">
                    <button class="tab-button active" data-tab="online">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <circle cx="12" cy="12" r="4"/>
                        </svg>
                        Online
                    </button>
                    <button class="tab-button" data-tab="offline">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <circle cx="12" cy="12" r="1"/>
                        </svg>
                        Offline
                    </button>
                    <button class="tab-button" data-tab="requests">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="8.5" cy="7" r="4"/>
                            <path d="M22 12h-6"/>
                            <path d="M19 15l3-3-3-3"/>
                        </svg>
                        Requests
                    </button>
                    <button class="tab-button" data-tab="blocked">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                        </svg>
                        Blocked
                    </button>
                </div>
    
                <!-- Tab Contents -->
                <div class="tab-content active" data-tab="online">
                    <div class="online-friends-list"></div>
                </div>
    
                <div class="tab-content" data-tab="offline">
                    <div class="offline-friends-list"></div>
                </div>
    
                <div class="tab-content" data-tab="requests">
                    <div class="requests-list"></div>
                </div>
    
                <div class="tab-content" data-tab="blocked">
                    <div class="blocked-users-list"></div>
                </div>
    
                <!-- Add Friend Modal -->
               <div class="modal" id="addFriendModal">
                    <div class="modal-content">
                        <div class="modal-header">
                            Add Friend
                        </div>
                        <div class="search-container">
                            <input type="text" 
                                   class="search-input valorant-input" 
                                   placeholder="Search for players..."
                                   autocomplete="off">
                            <div class="search-results"></div>
                        </div>
                        <div class="modal-actions">
                            <button class="cancel-btn">Cancel</button>
                        </div>
                    </div>
                </div>
    
                <!-- Loading State -->
                <div class="loading-overlay">
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
        const modal = this.$('#addFriendModal');
        const addFriendBtn = this.$('.add-friend-btn');
        const cancelBtn = this.$('.cancel-btn');
        const searchInput = this.$('.search-input');

        // Enhanced search handling with debounce
        let searchTimeout;
        this.addListener(searchInput, 'input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();

            if (query.length === 0) {
                this.clearSearchResults();
                return;
            }

            searchTimeout = setTimeout(() => {
                this.performSearch(query);
            }, 300); // Reduced debounce time for better responsiveness
        });

        // Modal controls
        this.addListener(addFriendBtn, 'click', () => {
            modal.classList.add('active');
            searchInput.focus(); // Auto-focus search input
        });

        this.addListener(cancelBtn, 'click', () => {
            this.closeModal();
        });

        // Close modal on outside click
        this.addListener(modal, 'click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // Setup tab navigation
        const tabButtons = this.$$('.tab-button');
        const tabContents = this.$$('.tab-content');

        tabButtons.forEach(button => {
            this.addListener(button, 'click', () => {
                const targetTab = button.dataset.tab;
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                button.classList.add('active');
                this.$(`.tab-content[data-tab="${targetTab}"]`).classList.add('active');
            });
        });
    }

    closeModal() {
        const modal = this.$('#addFriendModal');
        modal.classList.remove('active');
        this.$('.search-input').value = '';
        this.clearSearchResults();
    }

    clearSearchResults() {
        const resultsContainer = this.$('.search-results');
        resultsContainer.innerHTML = '';
        this.searchResults = [];
    }

    async performSearch(query) {
        try {
            if (query.length < 2) return;

            this.loading = true;
            this.$('.loading-overlay').classList.add('active');

            const response = await userState.searchUsers(query, {
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
        const resultsContainer = this.$('.search-results');

        if (!this.searchResults.length) {
            resultsContainer.innerHTML = `
                <div class="no-results" style="padding: 16px; text-align: center; color: var(--valorant-gray);">
                    No players found
                </div>`;
            return;
        }

        resultsContainer.innerHTML = this.searchResults.map(user => `
            <div class="search-result-card" data-user-id="${user.id}">
                <div class="user-info">
                    <img src="${user.avatar_url || '/default-avatar.png'}" 
                         alt="${user.username}"
                         onerror="this.src='/default-avatar.png'">
                    <div class="user-details">
                        <span class="username">${user.username}</span>
                        ${user.display_name ? `<span class="display-name">${user.display_name}</span>` : ''}
                    </div>
                </div>
                <div class="search-result-actions">
                    ${user.is_friend
                ? '<span class="friend-status">Already Friends</span>'
                : `<button class="valorant-btn send-request-btn" data-user-id="${user.id}">
                            Add Friend
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
            this.$('.loading-overlay').classList.add('active');

            const [friends, requests] = await Promise.all([
                userState.getFriends(),
                userState.getFriendRequests()
            ]);

            this.friends = friends
            this.friendRequests = requests
            this.renderLists();

        } catch (err) {
            console.error('Failed to load friends:', err);
            this.showError('Failed to load friends');
        } finally {
            this.loading = false;
            if (this.$('.loading-overlay'))
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
        if (!requestsList) return;

        try {
            if (!this.friendRequests || !this.friendRequests.length) {
                requestsList.innerHTML = `
                    <div class="no-requests">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M20 8v6M23 11h-6"/>
                        </svg>
                        <span>No pending requests</span>
                    </div>`;
                return;
            }

            requestsList.innerHTML = this.friendRequests.map(request => {
                if (!request || !request.user) return '';

                const avatarUrl = request.user.avatar_url || '/default-avatar.png';


                return `
                    <div class="friend-request-card" data-request-id="${request.id}">
                        <div class="user-info">
                            <div class="avatar-wrapper">
                                <img src="${avatarUrl}" 
                                     alt="${request.user.username}"
                                     onerror="this.src='/default-avatar.png'">
                            </div>
                            <div class="user-details">
                                <span class="username">${request.user.username}</span>
                                <span class="time">
                                    <svg class="time-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="10"/>
                                        <path d="M12 6v6l4 2"/>
                                    </svg>
                                    Sent ${this.formatTime(request.created_at)}
                                </span>
                            </div>
                        </div>
                        <div class="request-actions">
                            <button class="valorant-btn accept-btn" data-request-id="${request.id}">
                                <svg class="action-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 6L9 17l-5-5"/>
                                </svg>
                                ACCEPT
                            </button>
                            <button class="valorant-btn reject-btn" data-request-id="${request.id}">
                                <svg class="action-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                                REJECT
                            </button>
                        </div>
                    </div>
                `;
            }).filter(Boolean).join('');

            if (requestsList.innerHTML.trim() === '') {
                requestsList.innerHTML = `
                    <div class="no-requests">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M20 8v6M23 11h-6"/>
                        </svg>
                        <span>No valid requests found</span>
                    </div>`;
            }

            this.setupRequestButtons();
        } catch (err) {
            console.error('Error rendering friend requests:', err);
            requestsList.innerHTML = `
                <div class="error-state">
                    <span>Error loading friend requests</span>
                </div>`;
        }
    }

    renderFriends() {
        const onlineList = this.$('.online-friends-list');
        const offlineList = this.$('.offline-friends-list');
        if (!onlineList || !offlineList) {
            console.error('Required DOM elements not found');
            return;
        }
        const onlineFriends = this.friends.filter(f => f.friend.online);
        const offlineFriends = this.friends.filter(f => !f.friend.online);

        // SVG icons definitions
        const svgIcons = {
            message: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>`,
            remove: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="18" y1="8" x2="23" y2="13"/>
                <line x1="23" y1="8" x2="18" y2="13"/>
            </svg>`,
            block: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>`
        };

        const renderList = (friends, container) => {
            if (!friends.length) {
                container.innerHTML = `
                    <div class="no-friends">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        <span>No friends found</span>
                    </div>`;
                return;
            }

            container.innerHTML = friends
                .filter(f => f.friend.username.toLowerCase().includes(this.searchQuery.toLowerCase()))
                .map(f => `
                    <div class="friend-card" data-friend-id="${f.friend.id}">
                        <div class="friend-info">
                            <div class="avatar-wrapper">
                                <img src="${f.friend.avatar_url || '/default-avatar.png'}" alt="${f.friend.username}">
                                <span class="status-dot ${f.friend.online ? 'online' : 'offline'}"></span>
                            </div>
                            <div class="friend-details">
                                <span class="friend-name">${f.friend.username}</span>
                                <span class="friend-status">${f.friend.status || 'In Menu'}</span>
                            </div>
                        </div>
                        <div class="friend-actions">
                            <button class="action-btn message-btn" title="Send Message">
                                ${svgIcons.message}
                            </button>
                            <button class="action-btn remove-btn" title="Remove Friend">
                                ${svgIcons.remove}
                            </button>
                            <button class="action-btn block-btn" title="Block User">
                                ${svgIcons.block}
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
                console.log(friendId)
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
        const onlineCount = this.friends.filter(user => user.friend.online).length;
        if (this.$('.online-count'))
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