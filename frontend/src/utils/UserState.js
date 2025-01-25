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
    this.http = new Http();
    this.checkAuth();
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
  
      window.location.href = '/login';
  
      return response;
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
      await this.http.post('/auth/logout/');
      this.setState({
        user: null,
        isAuthenticated: false,
        error: null
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
      this.setState({ user: response, loading: false });
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
      const response = await this.http.post('/auth/enable-2fa/');
      this.setState({ user: { ...this.state.user, is_2fa_enabled: true } });
      return response.secret;
    } catch (error) {
      throw error;
    }
  }

  async verify2FA(otp) {
    try {
      return await this.http.post('/auth/verify-2fa/', { otp });
    } catch (error) {
      throw error;
    }
  }

  async disable2FA() {
    try {
      await this.http.post('/auth/disable-2fa/');
      this.setState({ user: { ...this.state.user, is_2fa_enabled: false } });
    } catch (error) {
      throw error;
    }
  }
}

export const userState = new UserState();