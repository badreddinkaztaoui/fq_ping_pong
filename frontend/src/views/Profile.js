import { View } from "../core/View";
import { State } from "../core/State";
import { userState } from "../utils/UserState";
import "../styles/dashboard/profile.css"

export class ProfileView extends View {
    constructor(params = {}) {
        super();
        this.params = params;
        this.state = new State({
            playerStats: {
                name: "",
                avatar: "/images/users/default-avatar.webp",
                matches: {
                    total: 0,
                    wins: 0,
                    losses: 0,
                },
            },
            profileUser: null,
            loading: true,
            error: null,
        });
    }

    async loadUserData() {
        try {
            const userId = this.params.id || userState.state.user.id;
            
            if (userId === userState.state.user.id) {
                this.state.setState({
                    profileUser: userState.state.user,
                    loading: false
                });
                return;
            }

            const userData = await userState.getUserById(userId);
            
            this.state.setState({
                profileUser: userData,
                loading: false,
                error: null
            });
        } catch (error) {
            console.error('Error loading user data:', error);
            this.state.setState({
                error: error.error?.message || "Failed to load user profile",
                loading: false
            });
        }
    }

    async render() {
        const template = document.createElement("section");
        template.className = "ui-val-wrapper";

        const { profileUser, loading, error } = this.state.state;

        if (loading) {
            template.innerHTML = `
                <div class="ui-val-loading">
                    <div class="ui-val-spinner"></div>
                    <p>Loading profile...</p>
                </div>
            `;
            return template;
        }

        if (error) {
            template.innerHTML = `
                <div class="ui-val-error">
                    <p>${error}</p>
                    <button class="ui-val-retry-btn">Retry</button>
                </div>
            `;
            return template;
        }

        if (!profileUser) {
            template.innerHTML = `
                <div class="ui-val-loading">
                    <p>Loading profile data...</p>
                </div>
            `;
            return template;
        }

        const isOwnProfile = userState.state.user.id === this.params.id;

        template.innerHTML = `
            <div class="ui-val-background"></div>
            <div class="ui-val-container">
                <div class="ui-val-profile-card">
                    <div class="ui-val-profile-banner"></div>
                    <div class="ui-val-profile-content">
                        <div class="ui-val-avatar-container">
                            <div class="ui-val-avatar">
                                <img src="${profileUser.avatar_url || '/images/users/default-avatar.webp'}" 
                                     alt="${profileUser.username}" 
                                     id="playerAvatar" />
                            </div>
                        </div>
                        <div class="ui-val-profile-info">
                            <h1 class="ui-val-player-name">${profileUser.username}</h1>
                            <div class="ui-val-player-tag">${profileUser.display_name}</div>
                            ${!isOwnProfile ? this.renderFriendshipControls(profileUser) : ''}
                        </div>
                    </div>
                </div>
                <div class="ui-val-stats-grid">
                    ${this.renderStatsGrid(profileUser)}
                </div>
            </div>
        `;

        return template;
    }

    setupEventListeners() {
        if (!this.element) return;

        const addFriendBtn = this.$('.ui-val-add-friend-btn');
        const removeFriendBtn = this.$('.ui-val-remove-friend-btn');
        const unblockBtn = this.$('.ui-val-unblock-btn');
        const retryBtn = this.$('.ui-val-retry-btn');

        if (retryBtn) {
            this.addListener(retryBtn, 'click', () => {
                this.state.setState({ loading: true, error: null });
                this.loadUserData();
            });
        }

        if (addFriendBtn) {
            this.addListener(addFriendBtn, 'click', async () => {
                try {
                    await userState.sendFriendRequest(addFriendBtn.dataset.userId);
                    await this.loadUserData();
                } catch (error) {
                    console.error('Failed to send friend request:', error);
                }
            });
        }

        if (removeFriendBtn) {
            this.addListener(removeFriendBtn, 'click', async () => {
                try {
                    await userState.removeFriend(this.state.state.profileUser?.friendship_id);
                    await this.loadUserData();
                } catch (error) {
                    console.error('Failed to remove friend:', error);
                }
            });
        }

        if (unblockBtn) {
            this.addListener(unblockBtn, 'click', async () => {
                try {
                    await userState.unblockUser(unblockBtn.dataset.userId);
                    await this.loadUserData();
                } catch (error) {
                    console.error('Failed to unblock user:', error);
                }
            });
        }
    }

    renderStatsGrid(profileUser) {
        const stats = {
            matches: profileUser.matches?.total || 0,
            wins: profileUser.matches?.wins || 0,
            losses: profileUser.matches?.losses || 0,
            winrate: this.calculateWinRate(profileUser.matches?.wins || 0, profileUser.matches?.total || 0)
        };

        return Object.entries(stats).map(([stat, value]) => `
            <div class="ui-val-stat-card" data-stat="${stat}">
                <div class="ui-val-stat-label">${this.getStatLabel(stat)}</div>
                <div class="ui-val-stat-value">
                    <span class="number">${value}</span>
                    ${stat === 'winrate' ? '<span class="percent">%</span>' : ''}
                </div>
            </div>
        `).join('');
    }

    renderFriendshipControls(profileUser) {
        if (profileUser?.is_blocked) {
            return `
                <button class="ui-val-unblock-btn" data-user-id="${profileUser?.id}">
                    Unblock User
                </button>
            `;
        }

        if (profileUser?.is_friend) {
            return `
                <button class="ui-val-remove-friend-btn" data-user-id="${profileUser?.id}">
                    Remove Friend
                </button>
            `;
        }

        return `
            <button class="ui-val-add-friend-btn" data-user-id="${profileUser?.id}">
                Add Friend
            </button>
        `;
    }

    getStatLabel(stat) {
        const labels = {
            matches: 'Total Matches',
            wins: 'Victories',
            losses: 'Defeats',
            winrate: 'Win Rate'
        };
        return labels[stat] || stat;
    }

    calculateWinRate(wins, total) {
        if (total === 0) return 0;
        return ((wins / total) * 100).toFixed(1);
    }

    async mount(parent) {
        await this.loadUserData();
        this.element = await this.render();
        
        if (parent && this.element) {
            parent.appendChild(this.element);
            this.setupEventListeners();
            this.setupAnimations(this.element);
        }
    }

    async updateView() {
        if (!this.element?.parentElement) return;
        
        const newElement = await this.render();
        this.element.replaceWith(newElement);
        this.element = newElement;
        this.setupEventListeners();
        this.setupAnimations(this.element);
    }

    setupAnimations(template) {
        if (!template) return;

        const cards = template.querySelectorAll(".ui-val-stat-card");
        
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.animation = `fadeInUp 0.6s ease-out forwards`;
            }, 100 * (index + 1));

            const numberElement = card.querySelector(".number");
            if (numberElement) {
                const finalValue = parseFloat(numberElement.textContent);
                this.animateNumber(numberElement, 0, finalValue, 1500);
            }
        });
    }

    animateNumber(element, start, end, duration) {
        const startTimestamp = performance.now();
        const isInteger = Number.isInteger(end);

        const animate = (currentTimestamp) => {
            const progress = Math.min((currentTimestamp - startTimestamp) / duration, 1);
            const currentValue = start + (end - start) * this.easeOutQuart(progress);

            element.textContent = isInteger
                ? Math.floor(currentValue).toString()
                : currentValue.toFixed(1);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    easeOutQuart(x) {
        return 1 - Math.pow(1 - x, 4);
    }
}