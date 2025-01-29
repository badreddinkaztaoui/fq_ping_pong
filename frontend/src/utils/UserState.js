import { State } from '../core/State';
import { Http } from './Http';

export class UserState extends State {
  constructor() {
    super({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      wsToken: null
    });
    this.http = new Http();
    this.checkAuth();
  }

  async getWebSocketToken() {
    try {
      if (this.state.wsToken && !this.isTokenExpired()) {
        return this.state.wsToken;
      }
      
      const response = await this.http.get('/auth/ws-token/');
      
      this.setState({
        wsToken: response.token,
        wsTokenExpiry: Date.now() + (response.expires_in * 1000)
      });
      
      return response.token;
    } catch (error) {
      console.error('WebSocket token retrieval failed', error);
      throw error;
    }
  }
  
  isTokenExpired() {
    return !this.state.wsTokenExpiry || 
           Date.now() >= this.state.wsTokenExpiry - (5 * 60 * 1000);
  }

  async checkAuth() {
    this.setState({ loading: true });
  
    try {
      const response = await this.http.get('/auth/me/');
      
      this.setState({
        user: response,
        isAuthenticated: true,
        loading: false,
        error: null
      });
    } catch (error) {
      this.setState({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: error.isExpectedError ? null : error.message
      });
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
        error: error.message,
        loading: false
      });
      throw error;
    }
  }

  async verify2FALogin(userId, code) {
    try {
      const response = await this.http.post('/auth/verify-2fa-login/', { user_id: userId, otp: code });
      
      this.setState({
        user: response.user,
        isAuthenticated: true,
        loading: false,
        error: null
      });
      
      return response;
    } catch (error) {
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
        error: error.message,
        loading: false
      });
      throw error;
    }
  }

  async handle42Callback(code) {
    this.setState({ loading: true, error: null });
    
    try {
      const response = await this.http.get(`/auth/42/callback/?code=${code}`);
      
      this.setState({
        user: response.user,
        isAuthenticated: true,
        loading: false,
        error: null
      });
      
      const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || '/dashboard';
      sessionStorage.removeItem('redirectAfterLogin');
      
      window.location.href = redirectUrl;
      
      return response;
    } catch (error) {
      this.setState({
        error: error.message,
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
        loading: false,
        error: null
      });
  
      return await this.login({email: userData.email, password: userData.password})
    } catch (error) {
      this.setState({
        error: error.message,
        loading: false
      });
      throw error;
    }
  }

  async logout() {
    try {
      await this.http.post('/api/auth/logout/');
      this.setState({
        user: null,
        isAuthenticated: false,
        error: null,
        wsToken: null
      });
    } catch (error) {
      console.error('Logout error:', error);
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
        this.setState({ error: error.message, loading: false });
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
        this.setState({ error: error.message, loading: false });
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
      return await this.http.post(`/auth/reset-password/${uidb64}/${token}/`, { new_password: newPassword });
    } catch (error) {
      throw error;
    }
  }

  async enable2FA() {
    try {
        const response = await this.http.post('/auth/enable-2fa/', {});
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
}

export const userState = new UserState();