import { View } from '../core/View';
import { userState } from '../utils/UserState';
import { MessageHandler } from '../utils/MessageHandler';
import "../styles/dashboard/friends.css"

export class FriendsView extends View {
    constructor() {
        super();
        this.toast = new MessageHandler()
        this.state = {
            friends: [],
            friendRequests: [],
            searchQuery: '',
            searchResults: [],
            activeTab: 'online',
            error: null,
            loading: true
        };
    
        this.CONFIG = {
            DEBOUNCE_DELAY: 300,
            MIN_SEARCH_LENGTH: 2,
            SEARCH_LIMIT: 10
        };
    
        this.handleSearchInput = this.handleSearchInput.bind(this);
        this.handleSearchInput = this.debounce(this.handleSearchInput, this.CONFIG.DEBOUNCE_DELAY);
        this.handleTabChange = this.handleTabChange.bind(this);
    }

    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }

    async render() {
        const container = document.createElement('div');
        container.className = 'friends-page valorant-theme';
        
        container.innerHTML = `
            <div class="friends-container">
                ${this.renderHeader()}
                ${this.renderTabs()}
                ${this.renderContent()}
                ${this.renderModal()}
                <div class="loading-overlay">
                    <div class="loading-spinner"></div>
                </div>
            </div>
        `;

        return container;
    }

    renderHeader() {
        const onlineCount = this.state.friends.filter(f => f.friend.is_online).length;
        return `
            <div class="friends-header">
                <div class="header-title">
                    <span class="online-count">${onlineCount} Online</span>
                </div>
                <div class="header-actions">
                    <button class="valorant-btn add-friend-btn" data-action="openModal">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" 
                             stroke="currentColor" stroke-width="2" 
                             stroke-linecap="round" stroke-linejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="8.5" cy="7" r="4"/>
                            <line x1="20" y1="8" x2="20" y2="14"/>
                            <line x1="23" y1="11" x2="17" y2="11"/>
                        </svg>
                        ADD FRIEND
                    </button>
                </div>
            </div>
        `;
    }

    renderTabs() {
        const tabs = [
            { id: 'online', icon: 'circle', label: 'Online' },
            { id: 'offline', icon: 'circle-dot', label: 'Offline' },
            { id: 'requests', icon: 'user-plus', label: 'Requests' },
            { id: 'blocked', icon: 'slash', label: 'Blocked' }
        ];

        return `
            <div class="tabs-nav">
                ${tabs.map(tab => `
                    <button class="tab-button ${this.state.activeTab === tab.id ? 'active' : ''}" 
                            data-tab="${tab.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" 
                             stroke="currentColor" stroke-width="2" 
                             stroke-linecap="round" stroke-linejoin="round">
                            ${this.getTabIcon(tab.icon)}
                        </svg>
                        ${tab.label}
                    </button>
                `).join('')}
            </div>
        `;
    }

    renderEmptyState(type) {
        const states = {
            friends: {
                icon: 'user-plus',
                message: 'No friends found'
            },
            requests: {
                icon: 'user-plus',
                message: 'No pending requests'
            },
            blocked: {
                icon: 'slash',
                message: 'No blocked users'
            }
        };

        const state = states[type];
        return `
            <div class="no-${type}">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" 
                     stroke="currentColor" stroke-width="1.5" 
                     stroke-linecap="round" stroke-linejoin="round">
                    ${this.getTabIcon(state.icon)}
                </svg>
                <span>${state.message}</span>
            </div>
        `;
    }

    updateBlockedList() {
        const blockedList = this.$('.blocked-list');
        if (!blockedList) return;

        if (!this.state.blockedUsers?.length) {
            blockedList.innerHTML = this.renderEmptyState('blocked');
            return;
        }

        blockedList.innerHTML = this.state.blockedUsers
            .map(user => this.renderBlockedCard(user))
            .join('');
    }

    renderBlockedCard(user) {
        return `
            <div class="blocked-card" data-user-id="${user.id}">
                <div class="user-info">
                    <div class="avatar-wrapper">
                        <img src="${user.avatar_url || '/default-avatar.png'}" 
                             alt="${user.username}"
                             onerror="this.src='/default-avatar.png'">
                    </div>
                    <div class="user-details">
                        <span class="username">${user.username}</span>
                    </div>
                </div>
                <div class="blocked-actions">
                    <button class="valorant-btn unblock-btn" 
                            data-action="unblockFriend" 
                            data-user-id="${user.id}">
                        UNBLOCK
                    </button>
                </div>
            </div>
        `;
    }

    getTabIcon(icon) {
        const icons = {
            circle: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/>',
            'circle-dot': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="1"/>',
            'user-plus': '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/>',
            slash: '<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>'
        };
        return icons[icon] || icons.circle;
    }

    renderModal() {
        return `
            <div class="modal" id="addFriendModal">
                <div class="modal-content">
                    <div class="modal-header">Add Friend</div>
                    <div class="search-container">
                        <input type="text" 
                               class="search-input valorant-input" 
                               placeholder="Search for players..."
                               autocomplete="off">
                        <div class="search-results"></div>
                    </div>
                    <div class="modal-actions">
                        <button class="cancel-btn" data-action="closeModal">Cancel</button>
                    </div>
                </div>
            </div>
        `;
    }

    async setupEventListeners() {
        this.addListener(this.element, 'click', (e) => {
            const target = e.target.closest('[data-action]');
            if (target) {
                const action = target.dataset.action;
                this.handleAction(action, target);
            }
        });

        const tabButtons = this.$$('.tab-button');
        tabButtons.forEach(button => {
            this.addListener(button, 'click', () => {
                this.handleTabChange(button.dataset.tab);
            });
        });

        const searchInput = this.$('.search-input');
        if (searchInput) {
            this.addListener(searchInput, 'input', this.handleSearchInput);
        }
    }

    async handleAction(action, target) {
        const actions = {
            openModal: () => this.openModal(),
            closeModal: () => this.closeModal(),
            sendRequest: () => this.sendFriendRequest(target.dataset.userId),
            blockUser: () => this.blockFriend(target.dataset.friendId),
            unblockFriend: () => this.unblockFriend(target.dataset.friendId),
            acceptRequest: () => this.acceptFriendRequest(target.dataset.requestId),
            rejectRequest: () => this.rejectFriendRequest(target.dataset.requestId),
        };

        if (actions[action]) {
            try {
                await actions[action]();
            } catch (error) {
                this.toast.error(error.message)
            }
        }
    }

    openModal() {
        const modal = this.$('#addFriendModal');
        modal.classList.add('active');
        this.$('.search-input').focus();
    }

    closeModal() {
        const modal = this.$('#addFriendModal');
        modal.classList.remove('active');
        this.$('.search-input').value = '';
        this.clearSearchResults();
    }

    clearSearchResults() {
        const resultsContainer = this.$('.search-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = '';
        }
        this.state.searchResults = [];
    }

    async handleSearchInput(event) {
        const query = event.target.value.trim();
        
        if (query.length < this.CONFIG.MIN_SEARCH_LENGTH) {
            this.clearSearchResults();
            return;
        }

        try {
            this.setState({ loading: true });
            const response = await userState.searchUsers(query, {
                exclude_blocked: true,
                limit: this.CONFIG.SEARCH_LIMIT
            });
            
            this.setState({ 
                searchResults: response.results,
                loading: false
            });
            
            this.updateSearchResults();
        } catch (error) {
            this.toast.error(error.message)
        }
    }

    updateSearchResults() {
        const resultsContainer = this.$('.search-results');
        if (!resultsContainer) return;

        if (!this.state.searchResults.length) {
            resultsContainer.innerHTML = `
                <div class="no-results">No players found</div>
            `;
            return;
        }

        resultsContainer.innerHTML = this.state.searchResults
            .map(user => this.renderSearchResult(user))
            .join('');
    }

    renderSearchResult(user) {
        return `
            <div class="search-result-card" data-user-id="${user.id}">
                <div class="user-info">
                    <img src="${user.avatar_url || '/default-avatar.png'}" 
                         alt="${user.username}"
                         onerror="this.src='/default-avatar.png'">
                    <div class="user-details">
                        <span class="username">${user.username}</span>
                        ${user.display_name ? 
                          `<span class="display-name">${user.display_name}</span>` : 
                          ''}
                    </div>
                </div>
                <div class="search-result-actions">
                    ${user.is_friend ? 
                      '<span class="already-friend">Already Friends</span>' :
                      `<button class="valorant-btn send-request-btn" 
                              data-action="sendRequest" 
                              data-user-id="${user.id}">
                           Add Friend
                       </button>`
                    }
                </div>
            </div>
        `;
    }

    handleTabChange(tabId) {
        this.setState({ activeTab: tabId });
        this.updateTabs();
        this.updateContent();
    }

    updateContent() {
        const contents = this.$$('.tab-content');
        
        contents.forEach(content => {
            content.classList.remove('active');
        });

        const activeContent = this.$(`.tab-content[data-tab="${this.state.activeTab}"]`);
        if (activeContent) {
            activeContent.classList.add('active');
        }
        
        this.updateLists();
    }

    updateTabs() {
        const tabs = this.$$('.tab-button');
        
        tabs.forEach(tab => {
            tab.classList.remove('active');
        });

        const activeTab = this.$(`.tab-button[data-tab="${this.state.activeTab}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
    }

    renderContent() {
        return `
            <div class="tabs-content">
                <div class="tab-content ${this.state.activeTab === 'online' ? 'active' : ''}" data-tab="online">
                    <div class="online-list"></div>
                </div>
                <div class="tab-content ${this.state.activeTab === 'offline' ? 'active' : ''}" data-tab="offline">
                    <div class="offline-list"></div>
                </div>
                <div class="tab-content ${this.state.activeTab === 'requests' ? 'active' : ''}" data-tab="requests">
                    <div class="requests-list"></div>
                </div>
                <div class="tab-content ${this.state.activeTab === 'blocked' ? 'active' : ''}" data-tab="blocked">
                    <div class="blocked-list"></div>
                </div>
            </div>
        `;
    }

    updateLists() {
        switch (this.state.activeTab) {
            case 'online':
            case 'offline':
                this.updateFriendsList();
                break;
            case 'requests':
                this.updateRequestsList();
                break;
            case 'blocked':
                this.updateBlockedList();
                break;
        }
    }

    updateFriendsList() {
        const list = this.$(`.${this.state.activeTab}-list`);
        if (!list) return;

        const friends = this.state.friends.filter(f => 
            this.state.activeTab === 'online' ? f.friend.is_online : !f.friend.is_online
        );

        if (!friends.length) {
            list.innerHTML = this.renderEmptyState('friends');
            return;
        }

        list.innerHTML = friends.map(friend => this.renderFriendCard(friend)).join('');
    }
 
    renderFriendCard(friend) {
        return `
            <div class="friend-card" data-friend-id="${friend.friend.id}">
                <div class="friend-info">
                    <div class="avatar-wrapper">
                        <img src="${friend.friend.avatar_url || '/default-avatar.png'}" 
                            alt="${friend.friend.username}"
                            onerror="this.src='/default-avatar.png'">
                    </div>
                    <div class="friend-details">
                        <span class="friend-name">${friend.friend.username}</span>
                        <span class="friend-st"><em>${friend.friend.is_online ? "Online" : "Offline"}</em></span>
                    </div>
                </div>
                <div class="friend-actions">
                    <button class="action-btn message-btn" 
                            data-action="message" 
                            data-friend-id="${friend.friend.id}" 
                            title="Send Message">
                        ${this.getActionIcon('message')}
                    </button>
                    <button class="action-btn block-btn" 
                            data-action="blockUser" 
                            data-friend-id="${friend.friend.id}" 
                            title="Block User">
                        ${this.getActionIcon('block')}
                    </button>
                </div>
            </div>
        `;
        }

    

    renderBlockedCard(user) {
        return `
            <div class="blocked-card" data-user-id="${user.id}">
                <div class="user-info">
                    <div class="avatar-wrapper">
                        <img src="${user.avatar_url || '/default-avatar.png'}" 
                             alt="${user.username}"
                             onerror="this.src='/default-avatar.png'">
                    </div>
                    <div class="user-details">
                        <span class="username">${user.username}</span>
                    </div>
                </div>
                <div class="blocked-actions">
                    <button class="valorant-btn unblock-btn" 
                            data-action="unblockFriend"
                            data-friend-id="${user.id}"
                            data-user-id="${user.id}">
                        UNBLOCK
                    </button>
                </div>
            </div>
        `;
    }

    getActionIcon(type) {
        const icons = {
            message: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
            remove: '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/>',
            block: '<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>'
        };
        return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" 
                     stroke="currentColor" stroke-width="2" 
                     stroke-linecap="round" stroke-linejoin="round">
                    ${icons[type]}
                </svg>`;
    }


    async afterMount() {
        await this.loadFriends();
    }

    async loadFriends() {
        try {
            this.setState({ loading: true });
            
            const [friends, requests, blocked] = await Promise.all([
                userState.getFriends(),
                userState.getFriendRequests(),
                userState.getBlockedUsers()
            ]);

            this.setState({
                friends,
                friendRequests: requests,
                blockedUsers: blocked,
                loading: false
            });

            this.updateLists();
        } catch (error) {
            this.toast.error(error.message)
        }
    }

    setState(newState) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...newState };
        
        if (oldState.loading !== this.state.loading) {
            this.updateLoadingState();
        }
        if (JSON.stringify(oldState.friends) !== JSON.stringify(this.state.friends)) {
            this.updateFriendsList();
        }
        if (JSON.stringify(oldState.friendRequests) !== JSON.stringify(this.state.friendRequests)) {
            this.updateRequestsList();
        }
        if (JSON.stringify(oldState.blockedUsers) !== JSON.stringify(this.state.blockedUsers)) {
            if (typeof this.updateBlockedList === 'function') {
                this.updateBlockedList();
            }
        }
    }

    updateLoadingState() {
        const loadingOverlay = this.$('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.toggle('active', this.state.loading);
        }
    }

    async sendFriendRequest(userId) {
        try {
            const searchResultCard = this.$(`.search-result-card[data-user-id="${userId}"]`);
            if (searchResultCard) {
                const actionContainer = searchResultCard.querySelector('.search-result-actions');
                actionContainer.innerHTML = `
                    <span class="request-status sending">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" 
                             stroke="currentColor" stroke-width="2" 
                             stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        Request Sent
                    </span>
                `;
            }
    
            await userState.sendFriendRequest(userId);
            
            if (searchResultCard) {
                const actionContainer = searchResultCard.querySelector('.search-result-actions');
                actionContainer.innerHTML = `
                    <span class="request-status sent">
                        Request Sent
                    </span>
                `;
            }
            this.toast.success('Friend request sent successfully')
            this.closeModal();
        } catch (error) {
            const searchResultCard = this.$(`.search-result-card[data-user-id="${userId}"]`);
            if (searchResultCard) {
                const actionContainer = searchResultCard.querySelector('.search-result-actions');
                actionContainer.innerHTML = `
                    <button class="valorant-btn send-request-btn" 
                            data-action="sendRequest" 
                            data-user-id="${userId}">
                         Add Friend
                    </button>
                `;
            }
            this.toast.error(error.message)
        }
    }

    updateRequestsList() {
        const requestsList = this.$('.requests-list');
        if (!requestsList) return;

        if (!this.state.friendRequests.length) {
            requestsList.innerHTML = this.renderEmptyState('requests');
            return;
        }

        requestsList.innerHTML = this.state.friendRequests
            .map(request => this.renderRequestCard(request))
            .join('');

        this.setupRequestButtons();
    }

    renderRequestCard(request) {
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
                            <svg class="time-icon" width="12" height="12" viewBox="0 0 24 24" 
                                 fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 6v6l4 2"/>
                            </svg>
                            Sent ${this.formatTime(request.created_at)}
                        </span>
                    </div>
                </div>
                <div class="request-actions">
                    <button class="valorant-btn accept-btn" 
                            data-action="acceptRequest" 
                            data-request-id="${request.id}">
                        <svg class="action-icon" width="16" height="16" viewBox="0 0 24 24" 
                             fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 6L9 17l-5-5"/>
                        </svg>
                        ACCEPT
                    </button>
                    <button class="valorant-btn reject-btn" 
                            data-action="rejectRequest" 
                            data-request-id="${request.id}">
                        <svg class="action-icon" width="16" height="16" viewBox="0 0 24 24" 
                             fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                        REJECT
                    </button>
                </div>
            </div>
        `;
    }

    setupRequestButtons() {
        const requestsList = this.$('.requests-list');
        if (!requestsList) return;

        this.addListener(requestsList, 'click', async (e) => {
            const button = e.target.closest('[data-action]');
            if (!button) return;

            const requestId = button.dataset.requestId;
            const action = button.dataset.action;

            try {
                if (action === 'acceptRequest') {
                    await this.acceptFriendRequest(requestId);
                } else if (action === 'rejectRequest') {
                    await this.rejectFriendRequest(requestId);
                }
            } catch (error) {
                this.toast.error(error.message)
            }
        });
    }

    formatTime(timestamp) {
        if (!timestamp) return 'Unknown date';
        
        try {
            const date = new Date(timestamp);
            return new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }).format(date);
        } catch (error) {
            this.toast.error(error.message)
            return 'Invalid date';
        }
    }

    async acceptFriendRequest(requestId) {
        try {
            const requestCard = this.$(`.friend-request-card[data-request-id="${requestId}"]`);
            if (requestCard) {
                const actionButtons = requestCard.querySelectorAll('.request-actions button');
                actionButtons.forEach(btn => {
                    btn.disabled = true;
                    btn.classList.add('loading');
                });
            }
    
            if (requestId) {
                await userState.acceptFriendRequest(requestId);
            }
            
            if (requestCard) {
                requestCard.classList.add('accepted');
                requestCard.addEventListener('transitionend', () => {
                    requestCard.remove();
                }, { once: true });
            }
            await this.loadFriends();
            
            this.toast.success('Friend request accepted')
        } catch (error) {
            const requestCard = this.$(`.friend-request-card[data-request-id="${requestId}"]`);
            if (requestCard) {
                const actionButtons = requestCard.querySelectorAll('.request-actions button');
                actionButtons.forEach(btn => {
                    btn.disabled = false;
                    btn.classList.remove('loading');
                });
            }
            this.toast.error(error.message)
        }
    }

    async rejectFriendRequest(requestId) {
        try {
            const requestCard = this.$(`.friend-request-card[data-request-id="${requestId}"]`);
            if (requestCard) {
                const actionButtons = requestCard.querySelectorAll('.request-actions button');
                actionButtons.forEach(btn => {
                    btn.disabled = true;
                    btn.classList.add('loading');
                });
            }
    
            if (requestId) {
                await userState.rejectFriendRequest(requestId);
            }
            
            if (requestCard) {
                requestCard.classList.add('rejected');
                requestCard.addEventListener('transitionend', () => {
                    requestCard.remove();
                }, { once: true });
            }
    
            await this.loadFriends();
            
            this.toast.success('Friend request rejected');
        } catch (error) {
            const requestCard = this.$(`.friend-request-card[data-request-id="${requestId}"]`);
            if (requestCard) {
                const actionButtons = requestCard.querySelectorAll('.request-actions button');
                actionButtons.forEach(btn => {
                    btn.disabled = false;
                    btn.classList.remove('loading');
                });
            }
            this.toast.error(error.message)
        }
    }

    async blockFriend(userId) {
        try {
            const friendCard = this.$(`.friend-card[data-friend-id="${userId}"]`);
            if (friendCard) {
                friendCard.classList.add('blocking');
            }
    
            if (userId) {
                await userState.blockUser(userId);
            }
            
            if (friendCard) {
                friendCard.addEventListener('transitionend', () => {
                    friendCard.remove();
                }, { once: true });
            }
            await this.loadFriends();

            this.toast.success('User blocked')
        } catch (error) {
            const friendCard = this.$(`.friend-card[data-friend-id="${userId}"]`);
            if (friendCard) {
                friendCard.classList.remove('blocking');
            }
            this.toast.error(error.message)
        }
    }

    async unblockFriend(userId) {
        try {
            if (userId) {
                await userState.unblockUser(userId);
            }
            await this.loadFriends();
            this.toast.success('User unblocked')
        } catch (error) {
            this.toast.error(error.message);
        }
    }

    async beforeUnmount() {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
    }
}

export default FriendsView;