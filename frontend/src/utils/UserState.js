import { State } from '../core/State';
import { Http } from './Http';

export class UserState extends State {
  constructor() {
    super({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null
    });

    this.http = new Http(this);
    
    this.checkAuth();
  }

  async checkAuth() {
    this.setState({ loading: true });
  
    try {
      const response = await this.http.get('/auth/me/');
      
      this.setState({
        user: response.user,
        isAuthenticated: response.is_authenticated,
        loading: false,
        error: null
      });
    } catch (error) {
      this.setState({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: error.error?.message || error.message
      });
    }
  }

  async getWebSocketToken() {
    try {
        if (this.accessToken) {
            return this.accessToken;
        }

        const response = await this.http.get('/auth/token/');
        this.accessToken = response.access_token;
        return this.accessToken;
    } catch (error) {
        throw error;
    }
  }

  async getUserById(userId) {
    try {
      return await this.http.get(`/auth/users/${userId}/`);
    } catch (error) {
      throw error;
    }
  }

  async login(credentials) {
    this.setState({ loading: true, error: null });
    
    try {
      const response = await this.http.post('/auth/login/', credentials);
      
      this.setState({
        user: response.user,
        isAuthenticated: true,
        loading: false,
        error: null
      });
      
      return response;
    } catch (error) {
      this.setState({
        error: error.error?.message || error.message,
        loading: false
      });
      throw error;
    }
  }

  async register(userData) {
    this.setState({ loading: true, error: null });
    
    try {
      const response = await this.http.post('/auth/register/', userData);
      
      this.setState({
        user: response.user,
        isAuthenticated: true,
        loading: false,
        error: null
      });
      
      return response;
    } catch (error) {
      this.setState({
        error: error.error?.message || error.message,
        loading: false
      });
      throw error;
    }
  }

  async logout() {
    try {
      await this.http.post('/auth/logout/');
      
      this.setState({
        user: null,
        isAuthenticated: false,
        error: null
      });
    } catch (error) {
      throw error;
    }
  }

  async verify2FALogin(userId, code) {
    this.setState({ loading: true, error: null });
    
    try {
      const response = await this.http.post('/auth/verify-2fa-login/', { 
        user_id: userId, 
        otp: code 
      });
      
      this.setState({
        user: response.user,
        isAuthenticated: true,
        loading: false,
        error: null
      });
      
      return response;
    } catch (error) {
      this.setState({
        error: error.error?.message || error.message,
        loading: false
      });
      throw error;
    }
  }

  async loginWith42() {
    try {
      const response = await this.http.get('/auth/42/login/');
      
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      
      window.location.href = response.authorization_url;
    } catch (error) {
      this.setState({
        error: error.error?.message || error.message,
        loading: false
      });
      throw error;
    }
  }

  async handle42Callback(code) {
    this.setState({ loading: true, error: null });
    
    try {
      await this.http.get(`/auth/42/callback/?code=${code}`);
      
      await this.checkAuth();
      
      const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || '/dashboard';
      sessionStorage.removeItem('redirectAfterLogin');
      
      window.location.href = redirectUrl;
    } catch (error) {
      this.setState({
        error: error.error?.message || error.message,
        loading: false
      });
      throw error;
    }
  }

  async updateProfile(userData) {
    this.setState({ loading: true, error: null });
    
    try {
      const response = await this.http.put('/auth/update/', userData);
      
      this.setState({ 
        user: { ...this.state.user, ...response },
        loading: false 
      });
      
      return response;
    } catch (error) {
      this.setState({ 
        error: error.error?.message || error.message, 
        loading: false 
      });
      throw error;
    }
  }

  async updateProfileAvatar(file) {
    this.setState({ loading: true, error: null });
    
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await this.http.post('/auth/update-avatar/', formData);
      
      this.setState({ 
        user: { ...this.state.user, avatar_url: response.avatar_url },
        loading: false 
      });
      
      return response;
    } catch (error) {
      this.setState({ 
        error: error.error?.message || error.message, 
        loading: false 
      });
      throw error;
    }
  }

  async searchUsers(query, options = {}) {
    try {
      const params = new URLSearchParams({
        query,
        exclude_friends: options.exclude_friends?.toString() || 'false',
        exclude_blocked: options.exclude_blocked?.toString() || 'true',
        limit: options.limit?.toString() || '10'
      });

      return await this.http.get(`/auth/search/?${params.toString()}`);
    } catch (error) {
      throw error;
    }
  }

  async getFriends() {
    try {
      return await this.http.get('/auth/friends/');
    } catch (error) {
      throw error;
    }
  }
  
  async getFriendRequests() {
    try {
      return await this.http.get('/auth/friends/requests/');
    } catch (error) {
      throw error;
    }
  }
  
  async sendFriendRequest(friendId) {
    try {
      return await this.http.post('/auth/friends/request/', {
        friend_id: friendId
      });
    } catch (error) {
      throw error;
    }
  }
  
  async acceptFriendRequest(friendshipId) {
    try {
      return await this.http.post(`/auth/friends/accept/${friendshipId}/`);
    } catch (error) {
      throw error;
    }
  }
  
  async rejectFriendRequest(friendshipId) {
    try {
      await this.http.post(`/auth/friends/reject/${friendshipId}/`);
    } catch (error) {
      throw error;
    }
  }
  
  async removeFriend(friendshipId) {
    try {
      await this.http.post(`/auth/friends/remove/${friendshipId}/`);
    } catch (error) {
      throw error;
    }
  }

  async blockUser(userId) {
    try {
      await this.http.post('/auth/blocks/block/', { user_id: userId });
    } catch (error) {
      throw error;
    }
  }
  
  async unblockUser(userId) {
    try {
      await this.http.post(`/auth/blocks/unblock/${userId}/`);
    } catch (error) {
      throw error;
    }
  }
  
  async getBlockedUsers() {
    try {
      return await this.http.get('/auth/blocks/');
    } catch (error) {
      throw error;
    }
  }

  async resetPasswordRequest(email) {
    try {
      return await this.http.post('/auth/reset-password/', { email });
    } catch (error) {
      throw error;
    }
  }

  async resetPasswordConfirm(uidb64, token, newPassword) {
    try {
      return await this.http.post(
        `/auth/reset-password/${uidb64}/${token}/`, 
        { new_password: newPassword }
      );
    } catch (error) {
      throw error;
    }
  }

  async enable2FA() {
    try {
      const response = await this.http.post('/auth/enable-2fa/');
      return response;
    } catch (error) {
      throw error;
    }
  }

  async verify2FA(otp) {
    try {
      const response = await this.http.post('/auth/verify-2fa/', { otp });
      this.setState({ 
        user: { 
          ...this.state.user, 
          is_2fa_enabled: true 
        } 
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async disable2FA() {
    try {
      await this.http.post('/auth/disable-2fa/');
      this.setState({ 
        user: { 
          ...this.state.user, 
          is_2fa_enabled: false 
        } 
      });
    } catch (error) {
      throw error;
    }
  }

  async getNotifications(page = 1, perPage = 10) {
    try {
        return await this.http.get(`/auth/notifications/?page=${page}&per_page=${perPage}`);
    } catch (error) {
        throw error;
    }
  }

  async getUnreadNotificationCount() {
      try {
          const response = await this.http.get('/auth/notifications/unread-count/');
          return response.unread_count;
      } catch (error) {
          throw error;
      }
  }

  async markNotificationRead(notificationId) {
      try {
          await this.http.post(`/auth/notifications/${notificationId}/read/`);
      } catch (error) {
          throw error;
      }
  }

  async markAllNotificationsRead() {
      try {
          await this.http.post('/auth/notifications/mark-all-read/');
      } catch (error) {
          throw error;
      }
  }
}

export const userState = new UserState();