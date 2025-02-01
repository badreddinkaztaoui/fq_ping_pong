import { View } from '../core/View';
import { userState } from '../utils/UserState';
import "../styles/dashboard/notifications.css"

export class NotificationsView extends View {
    constructor(params = {}) {
        super();
        this.notifications = [

            {
                id: 2,
                type: 'friend_request',
                sender: 'baztaoui',
                status: 'pending',
                timestamp: '5h ago',
                avatar: '/images/users/player-3.jpeg',
                message: 'sent you a friend request'
            },
            {
                id: 3,
                type: 'game_invite',
                sender: 'chani9a',
                status: 'pending',
                timestamp: '1h ago',
                avatar: '/images/users/player-1.jpeg',
                message: 'invited you to join competitive match',
                gameMode: 'Competitive'
            },
            {
                id: 2,
                type: 'friend_request',
                sender: 'baztaoui',
                status: 'pending',
                timestamp: '5h ago',
                avatar: '/images/users/player-3.jpeg',
                message: 'sent you a friend request'
            },
            {
                id: 3,
                type: 'game_invite',
                sender: 'chani9a',
                status: 'pending',
                timestamp: '1h ago',
                avatar: '/images/users/player-1.jpeg',
                message: 'invited you to join competitive match',
                gameMode: 'Competitive'
            },
            {
                id: 2,
                type: 'friend_request',
                sender: 'baztaoui',
                status: 'pending',
                timestamp: '5h ago',
                avatar: '/images/users/player-3.jpeg',
                message: 'sent you a friend request'
            },
            {
                id: 3,
                type: 'game_invite',
                sender: 'ShadowHunter',
                status: 'pending',
                timestamp: '1h ago',
                avatar: '/images/users/player-1.jpeg',
                message: 'invited you to join competitive match',
                gameMode: 'Competitive'
            },
            {
                id: 2,
                type: 'friend_request',
                sender: 'baztaoui',
                status: 'pending',
                timestamp: '5h ago',
                avatar: '/images/users/player-3.jpeg',
                message: 'sent you a friend request'
            },
            {
                id: 3,
                type: 'game_invite',
                sender: 'chani9a',
                status: 'pending',
                timestamp: '1h ago',
                avatar: '/images/users/player-1.jpeg',
                message: 'invited you to join competitive match',
                gameMode: 'Competitive'
            }
        ];
    }

    getNotificationActions(type) {
        switch (type) {
            case 'friend_request':
                return `
                    <button class="val-btn val-btn--primary">
                        <span class="val-btn__text">ACCEPT</span>
                        <div class="val-btn__glow"></div>
                    </button>
                    <button class="val-btn val-btn--secondary">
                        <span class="val-btn__text">REJECT</span>
                    </button>
                `;
            case 'game_invite':
                return `
                    <button class="val-btn val-btn--primary">
                        <span class="val-btn__text">JOIN MATCH</span>
                        <div class="val-btn__glow"></div>
                    </button>
                    <button class="val-btn val-btn--secondary">
                        <span class="val-btn__text">SKIP</span>
                    </button>
                `;
            default:
                return '';
        }
    }

    renderNotificationItem(notification) {
        const actions = this.getNotificationActions(notification.type);
        const typeIcon = this.getNotificationIcon(notification.type);

        return `
            <div class="val-card">
                <div class="val-card__glow"></div>
                <div class="val-card__content">
                    <div class="val-avatar">
                        <img class="val-avatar__img" src="${notification.avatar}" alt="${notification.sender}">
                        <div class="val-type-icon">${typeIcon}</div>
                    </div>
                    <div class="val-info">
                        <div class="val-info__header">
                            <h3 class="val-info__name">${notification.sender}</h3>
                            <span class="val-info__time">${notification.timestamp}</span>
                        </div>
                        <p class="val-info__msg">${notification.message.toUpperCase()}</p>
                        <div class="val-actions">
                            ${actions}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getNotificationIcon(type) {
        const icons = {
            friend_request: '<svg class="val-icon" viewBox="0 0 24 24"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 8c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm-6 4c.22-.72 3.31-2 6-2 2.7 0 5.8 1.29 6 2H9zm-3-3v-3h3v-2H6V7H4v3H1v2h3v3z"/></svg>',
            game_invite: '<svg class="val-icon" viewBox="0 0 24 24"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H3V8h18v8zM6 15h2v-2h2v-2H8V9H6v2H4v2h2z"/></svg>'
        };
        return icons[type] || '';
    }

    async render() {
        const container = document.createElement('div');
        container.className = 'val-notif-container';

        const notificationsHtml = this.notifications
            .map(notification => this.renderNotificationItem(notification))
            .join('');

        container.innerHTML = `
            <div class="val-notif-wrapper">
                <div class="val-header">
                    <div class="val-header__content">
                        <h1 class="val-header__title">NOTIFICATIONS</h1>
                        <div class="val-badge">${this.notifications.length}</div>
                    </div>
                    <div class="val-divider"></div>
                </div>
                <div class="val-notif-grid">
                    ${notificationsHtml}
                </div>
            </div>
        `;

        return container;
    }
}