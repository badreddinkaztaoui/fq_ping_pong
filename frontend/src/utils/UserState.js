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
}

export const userState = new UserState();