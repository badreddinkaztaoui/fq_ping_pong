import { Http } from './Http';
import { userState } from './UserState';

export class FriendsStore {
    constructor() {
        this.http = new Http(userState);
        this.friends = null;
        this.loading = false;
        this.error = null;
        this.lastFetch = null;
        this.subscribers = new Set();
        this.CACHE_DURATION = 5 * 60 * 1000;
    }

    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    notifySubscribers() {
        this.subscribers.forEach(callback => callback(this.friends));
    }

    async loadFriends() {
        if (this.loading) {
            return this.friends;
        }

        const now = Date.now();
        if (this.friends && this.lastFetch && (now - this.lastFetch < this.CACHE_DURATION)) {
            return this.friends;
        }

        try {
            this.loading = true;
            this.error = null;

            const data = await this.http.get('/auth/friends/');
            this.processFriendsData(data);
            this.lastFetch = now;
            this.notifySubscribers();
            
            return this.friends;

        } catch (error) {
            this.error = error.message;
            throw error;
        } finally {
            this.loading = false;
        }
    }

    processFriendsData(data) {
        this.friends = data.map(friend => ({
            ...friend,
            displayName: friend.friend.username || 'Unknown User',
            lastActive: friend.friend.last_active || null,
            status: this.calculateStatus(friend.friend),
            friendshipId: friend.friendship_id,
            unreadCount: friend.unread_count || 0
        }));
    }

    calculateStatus(friend) {
        if (!friend.last_active) {
            return 'offline';
        }
        
        const lastActive = new Date(friend.last_active);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        return lastActive > fiveMinutesAgo ? 'online' : 'offline';
    }

    updateFriendStatus(friendId, status) {
        if (!this.friends) {
            return;
        }

        const friend = this.friends.find(f => f.friend.id === friendId);
        if (friend) {
            friend.friend.status = status;
            friend.friend.last_active = new Date().toISOString();
            this.notifySubscribers();
        }
    }

    getFriend(friendId) {
        return this.friends?.find(f => f.friend.id === friendId) || null;
    }

    async updateUnreadCount(friendshipId, increment = true) {
        const friend = this.friends?.find(f => f.friendshipId === friendshipId);
        if (friend) {
            friend.unreadCount = increment 
                ? (friend.unreadCount || 0) + 1 
                : 0;
            this.notifySubscribers();
        }
    }

    async addFriend(friendId) {
        try {
            const response = await this.http.post('/auth/friends/request/', { friend_id: friendId });
            await this.loadFriends();
            return response;
        } catch (error) {
            this.error = error.message;
            throw error;
        }
    }

    async removeFriend(friendId) {
        try {
            const response = await this.http.post(`/auth/friends/remove/${friendId}`);
            this.friends = this.friends?.filter(f => f.friend.id !== friendId);
            this.notifySubscribers();
            return response;
        } catch (error) {
            this.error = error.message;
            throw error;
        }
    }

    clearCache() {
        this.friends = null;
        this.lastFetch = null;
        this.error = null;
    }

    getError() {
        return this.error;
    }

    isLoading() {
        return this.loading;
    }
}

export const friendsStore = new FriendsStore();