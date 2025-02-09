import { View } from '../core/View';
import { userState } from '../utils/UserState';
import { MessageHandler } from '../utils/MessageHandler';
import { Http } from '../utils/Http';

import "../styles/dashboard/notifications.css";

export class NotificationsView extends View {
    constructor(params = {}) {
        super();
        this.state = {
            notifications: [],
            loading: false,
            error: null,
            page: 1,
            hasMore: true
        }
        
        this.http = new Http()
        this.messageHandler = new MessageHandler();
        this.pollInterval = null;
        this.POLL_INTERVAL = 20000;
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
    }

    async fetchNotifications(page = 1) {
        try {
            const response = await this.http.get(`/auth/notifications/?page=${page}&per_page=10`);
            
            if (!response || typeof response !== 'object') {
                throw new Error('Invalid response format');
            }

            return {
                notifications: Array.isArray(response.notifications) ? response.notifications : [],
                hasMore: page < (response.pages || 1)
            };
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw new Error(error.message || 'Failed to fetch notifications');
        }
    }

    getNotificationActions(notification) {
        if (!notification) return '';

        switch (notification.notification_type) {
            case 'friend_request':
                return notification.friendship_id ? `
                    <button class="val-btn val-btn--primary" data-action="acceptFriend" data-id="${notification.friendship_id}">
                        <span class="val-btn__text">ACCEPT</span>
                        <div class="val-btn__glow"></div>
                    </button>
                    <button class="val-btn val-btn--secondary" data-action="rejectFriend" data-id="${notification.friendship_id}">
                        <span class="val-btn__text">REJECT</span>
                    </button>
                ` : '';
            case 'friend_accept':
                return notification.related_user?.id ? `
                    <button class="val-btn val-btn--primary" data-action="viewProfile" data-id="${notification.related_user.id}">
                        <span class="val-btn__text">VIEW PROFILE</span>
                        <div class="val-btn__glow"></div>
                    </button>
                ` : '';
            default:
                return '';
        }
    }

    getNotificationIcon(type) {
        const icons = {
            friend_request: '<svg class="val-icon" viewBox="0 0 24 24"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 8c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm-6 4c.22-.72 3.31-2 6-2 2.7 0 5.8 1.29 6 2H9zm-3-3v-3h3v-2H6V7H4v3H1v2h3v3z"/></svg>',
            friend_accept: '<svg class="val-icon" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V18h14v-1.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05.02.01.03.03.04.04 1.14.83 1.93 1.94 1.93 3.41V18h6v-1.5c0-2.33-4.67-3.5-7-3.5z"/></svg>',
            system_update: '<svg class="val-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>'
        };
        return icons[type] || icons.system_update;
    }

    formatTimeAgo(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400, 
            hour: 3600,
            minute: 60
        };
        
        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
            }
        }
        
        return 'Just now';
    }

    renderNotificationItem(notification) {
        if (!notification || !notification.id) {
            return '';
        }

        const actions = this.getNotificationActions(notification);
        const typeIcon = this.getNotificationIcon(notification.notification_type);
    
        return `
            <div class="val-card ${notification.is_read ? '' : 'unread'}" data-notification-id="${notification.id}">
                <div class="val-card__glow"></div>
                <div class="val-card__content">
                    <div class="val-avatar">
                        <div class="val-avatar__img">
                            ${typeIcon}
                        </div>
                    </div>
                    <div class="val-info">
                        <div class="val-info__header">
                            <h3 class="val-info__name">${notification.title || 'No Title'}</h3>
                            <div class="val-info__actions">
                                ${!notification.is_read ? `
                                    <button class="val-btn val-btn--icon" data-action="markRead" data-id="${notification.id}" title="Mark as read">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </button>
                                ` : ''}
                                <button class="val-btn val-btn--icon" data-action="clearNotification" data-id="${notification.id}" title="Clear notification">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                            <span class="val-info__time">${this.formatTimeAgo(notification.created_at || new Date())}</span>
                        </div>
                        <p class="val-info__msg">${(notification.message || 'No message').toUpperCase()}</p>
                        ${actions ? `
                            <div class="val-actions">
                                ${actions}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    async handleNotificationAction(action, id) {
        try {
            switch (action) {
                case 'acceptFriend':
                    await userState.acceptFriendRequest(id);
                    this.messageHandler.success('Friend request accepted');
                    break;
                case 'rejectFriend':
                    await userState.rejectFriendRequest(id);
                    this.messageHandler.success('Friend request rejected');
                    break;
                case 'viewProfile':
                    this.router.navigate(`/dashboard/profile/${id}`)
                    break;
            }
            await this.loadNotifications();
        } catch (error) {
            this.messageHandler.error(error);
        }
    }

    async markAsRead(notificationId) {
        try {
            await this.http.post(`/auth/notifications/${notificationId}/read/`);
            const card = this.$(`[data-notification-id="${notificationId}"]`);
            if (card) {
                card.classList.remove('unread');
            }
            await this.loadNotifications();
        } catch (error) {
            this.messageHandler.error(error);
        }
    }

    async loadNotifications() {
        try {
            this.setState({ loading: true });
            
            const { notifications, hasMore } = await this.fetchNotifications(this.state.page);
            
            if (!Array.isArray(notifications)) {
                throw new Error('Invalid notifications data received');
            }
            
            this.setState({
                notifications: this.state.page === 1 ? notifications : [...this.state.notifications, ...notifications],
                hasMore,
                loading: false,
                error: null
            });
    
            await this.updateNotificationsList(this.state);
            this.updateNotificationBadge(this.state);
        } catch (error) {
            console.error('Notification loading error:', error);
            this.setState({
                error: 'Failed to load notifications',
                loading: false
            });
            this.messageHandler.error(error.message || 'Failed to load notifications');
        }
    }

    async updateNotificationsList(state) {
        const notificationsGrid = this.$('.val-notif-grid');
        if (!notificationsGrid) return;
    
        let notificationsHtml = '';
        
        if (state.loading && state.page === 1) {
            notificationsHtml = '<div class="loading-spinner"></div>';
        } else if (state.notifications.length > 0) {
            notificationsHtml = state.notifications
                .map(notification => this.renderNotificationItem(notification))
                .join('');
            
            if (state.hasMore) {
                notificationsHtml += '<div class="scroll-sentinel"></div>';
            }
        } else {
            notificationsHtml = '<div class="no-notifications">No notifications yet</div>';
        }
    
        notificationsGrid.innerHTML = notificationsHtml;
    }
    
    updateNotificationBadge(state) {
        const badge = this.$('.val-badge');
        if (!badge) return;
    
        const unreadCount = state.notifications.filter(n => !n.is_read).length;
        
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none'; 
        }
    }

    async markAllAsRead() {
        try {
            await userState.markAllNotificationsRead();
            await this.loadNotifications();
            this.messageHandler.success('All notifications marked as read');
        } catch (error) {
            this.messageHandler.error('Failed to mark all notifications as read');
        }
    }
    
    async clearNotification(id) {
        try {
            await this.http.post(`/auth/notifications/${id}/clear/`);
            const notification = this.$(`[data-notification-id="${id}"]`);
            if (notification) {
                notification.classList.add('removing');
                setTimeout(() => {
                    this.loadNotifications();
                }, 300);
            }
            this.messageHandler.success('Notification cleared');
        } catch (error) {
            this.messageHandler.error('Failed to clear notification');
        }
    }
    
    async clearAllNotifications() {
        try {
            await this.http.post('/auth/notifications/clear-all/');
            await this.loadNotifications();
            this.messageHandler.success('All notifications cleared');
        } catch (error) {
            this.messageHandler.error('Failed to clear notifications');
        }
    }

    setupInfiniteScroll() {
        const container = this.$('.val-notif-grid');
        if (!container) return;

        const observer = new IntersectionObserver(
            debounce((entries) => {
                if (entries[0].isIntersecting && this.state.hasMore && !this.state.loading) {
                    this.setState({ page: this.state.page + 1 });
                    this.loadNotifications();
                }
            }, 200),
            { threshold: 0.1 }
        );

        const sentinel = document.createElement('div');
        sentinel.className = 'scroll-sentinel';
        container.appendChild(sentinel);
        observer.observe(sentinel);
    }

    setupEventListeners() {

        if (this.listenerSet) return;

        this.addListener(this.element, 'click', async (e) => {
            const actionButton = e.target.closest('[data-action]');
            if (!actionButton) return;
    
            const action = actionButton.dataset.action;
            const id = actionButton.dataset.id;
    
            try {
                switch (action) {
                    case 'markRead':
                        await this.markAsRead(id);
                        break;
                    case 'markAllRead':
                        if (this.state.notifications.length)
                            await this.markAllAsRead();
                        break;
                    case 'clearNotification':
                        await this.clearNotification(id);
                        break;
                    case 'clearAll':
                        if (this.state.notifications.length)
                            await this.clearAllNotifications();
                        break;
                    default:
                        await this.handleNotificationAction(action, id);
                }
            } catch (error) {
                this.messageHandler.error(error);
            }
        });

        this.listenerSet = true;
    }

    startPolling() {
        this.loadNotifications();
    
        this.pollInterval = setInterval(async () => {
            if (document.visibilityState === 'visible') {
                if (!this.state.loading) {
                    try {
                        await this.loadNotifications(); 
                    } catch (error) {
                        this.messageHandler.error('Failed to update notifications');
                    }
                }
            }
        }, this.POLL_INTERVAL);
    }

    async render() {
        const container = document.createElement('div');
        container.className = 'val-notif-container';
    
        container.innerHTML = `
            <div class="val-notif-wrapper">
                <div class="val-header">
                    <div class="val-header__content">
                        <div class="val-header__left">
                            <h1 class="val-header__title">NOTIFICATIONS</h1>
                            ${this.state.notifications.length > 0 ? `
                                <div class="val-badge">${this.state.notifications.length}</div>
                            ` : ''}
                        </div>
                        <div class="val-header__actions">
                            <button class="val-btn val-btn--secondary" data-action="markAllRead">
                                <span class="val-btn__text">MARK ALL READ</span>
                            </button>
                            <button class="val-btn val-btn--secondary" data-action="clearAll">
                                <span class="val-btn__text">CLEAR ALL</span>
                            </button>
                        </div>
                    </div>
                    <div class="val-divider"></div>
                </div>
                <div class="val-notif-grid">
                    ${this.state.loading && this.state.page === 1 ? `
                        <div class="loading-spinner"></div>
                    ` : this.state.notifications.length > 0 ? 
                        this.state.notifications.map(notification => 
                            this.renderNotificationItem(notification)
                        ).join('') : 
                        '<div class="no-notifications">No notifications yet</div>'
                    }
                </div>
            </div>
        `;
    
        return container;
    }

    async afterMount() {
        await this.loadNotifications()
        this.setupInfiniteScroll();
        this.startPolling();
        this.setupEventListeners();
    }

    async beforeUnmount() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
    }
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
      const later = () => {
        timeout = null;
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

export default NotificationsView;