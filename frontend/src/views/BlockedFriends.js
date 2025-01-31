import { View } from '../core/View';
import { userState } from '../utils/UserState';
import "../styles/dashboard/friends.css"

export class BlockedFriendsView extends View {
    constructor() {
        super();
        this.blockedUsers = [];
        this.searchQuery = '';
        this.error = null;
        this.loading = true;
    }

    async render() {
        const container = document.createElement('div');
        container.className = 'blocked-friends-page valorant-theme';
        container.innerHTML = `
            <div class="blocked-friends-container">
                <!-- Header Section -->
                <div class="friends-header">
                    <div class="header-title">
                        <span class="blocked-count">0 Blocked</span>
                    </div>
                    <div class="header-actions">
                        <div class="search-bar">
                            <input type="text" class="valorant-input" placeholder="Search blocked users...">
                            <i class="fas fa-search search-icon"></i>
                        </div>
                    </div>
                </div>

                <!-- Blocked Users Section -->
                <div class="blocked-users-section">
                    <div class="blocked-users-list"></div>
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
        await this.loadBlockedUsers();
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = this.$('.search-bar input');
        this.addListener(searchInput, 'input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.filterBlockedUsers();
        });
    }

    async loadBlockedUsers() {
        try {
            this.loading = true;
            const blockedUsers = await userState.getBlockedUsers();

            this.blockedUsers = blockedUsers;
            this.renderBlockedUsers();
        } catch (err) {
            console.error('Failed to load blocked users:', err);
            this.showError('Failed to load blocked users');
        } finally {
            this.loading = false;
            this.$('.loading-overlay').classList.remove('active');
        }
    }

    renderBlockedUsers() {
        const blockedUsersList = this.$('.blocked-users-list');
        
        // Update blocked count
        this.$('.blocked-count').textContent = `${this.blockedUsers.length} Blocked`;

        if (!this.blockedUsers.length) {
            blockedUsersList.innerHTML = '<div class="no-blocked-users">No blocked users</div>';
            return;
        }

        // Filter and render blocked users based on search query
        const filteredUsers = this.blockedUsers.filter(user => 
            user.username.toLowerCase().includes(this.searchQuery)
        );

        if (!filteredUsers.length) {
            blockedUsersList.innerHTML = '<div class="no-blocked-users">No matching blocked users found</div>';
            return;
        }

        blockedUsersList.innerHTML = filteredUsers.map(user => `
            <div class="blocked-user-card" data-user-id="${user.id}">
                <div class="user-info">
                    <img src="${user.avatar_url || '/default-avatar.png'}" alt="${user.username}">
                    <div class="user-details">
                        <span class="username">${user.username}</span>
                        <span class="blocked-date">Blocked ${this.formatBlockedDate(user.blocked_at)}</span>
                    </div>
                </div>
                <div class="blocked-user-actions">
                    <button class="valorant-btn unblock-btn" data-user-id="${user.id}">
                        UNBLOCK
                    </button>
                </div>
            </div>
        `).join('');

        // Setup unblock button listeners
        this.setupUnblockButtons();
    }

    setupUnblockButtons() {
        const unblockBtns = this.$$('.unblock-btn');

        unblockBtns.forEach(btn => {
            this.addListener(btn, 'click', async (e) => {
                const userId = btn.dataset.userId;
                await this.unblockUser(userId);
            });
        });
    }

    async unblockUser(userId) {
        try {
            await userState.unblockUser(userId);
            await this.loadBlockedUsers();
            this.showSuccess('User unblocked successfully');
        } catch (err) {
            console.error('Failed to unblock user:', err);
            this.showError('Failed to unblock user');
        }
    }

    filterBlockedUsers() {
        this.renderBlockedUsers();
    }

    formatBlockedDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString();
    }

    showError(message) {
        // Implement error toast/notification
        console.error(message);
    }

    showSuccess(message) {
        // Implement success toast/notification
        console.log(message);
    }
}