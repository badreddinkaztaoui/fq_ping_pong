import { View } from '../core/View';
import { State } from "../core/State"
import "../styles/login.css";

export class LoginView extends View {
    constructor() {
      super();
      this.state = new State({
        loading: false,
        error: null
      });
      this.API_URL = 'http://localhost:8000';
    }
  
    async render() {
      const template = document.createElement('template');
      template.innerHTML = `
      <div class="signin-container">
        <div class="signin-image">
          <div class="image-overlay"></div>
        </div>
        
        <div class="signin-form">
          <div class="form-wrapper">
            <div class="logo"></div>
            
            <h1 class="title">Sign in</h1>
            
            <form id="login-form" novalidate>
              <div class="input-container">
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  placeholder="EMAIL" 
                  required 
                />
                <span class="error-message" id="email-error"></span>
              </div>
            
              <div class="input-container">
                <input 
                  type="password" 
                  id="password" 
                  name="password" 
                  placeholder="PASSWORD" 
                  required 
                />
                <span class="error-message" id="password-error"></span>
              </div>
              
              <div class="forgot-password">
                <a href="#">Forgot password?</a>
              </div>
              
              <button type="submit" class="submit-btn-sign-in">
                PROCEED TO PLAY
              </button>
              
              <div class="form-error"></div>
            
              <div class="divider">
                <span>OR</span>
              </div>
              
              <div class="social-signin">
                <button type="button" class="social-btn btn-42">
                  <span class="social-icon">42</span>
                </button>
              </div>
              
              <div class="signup-link">
                <a href="/signup" data-link>Can't login? | Create an account</a>
              </div>
            </form>
          </div>
        </div>

        <div id="toast" class="toast"></div>
      </div>
    `;
  
      return template.content.firstElementChild;
    }

    async handleSubmit(event) {
      event.preventDefault();
      
      const formData = new FormData(event.target);
      const username = formData.get('username');
      const password = formData.get('password');
  
      this.state.setState({ loading: true, error: null });
  
      try {
        const response = await fetch(`${this.API_URL}/api/auth/login/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: username,
            password: password
          }),
          credentials: 'include'
        });
  
        const data = await response.json();
  
        if (!response.ok) {
          throw new Error(data.error || 'Login failed');
        }
  
        console.log('Login successful!', data);
        console.log('User info:', data.user);
        console.log('Access token:', data.tokens.access);
        
        localStorage.setItem('accessToken', data.tokens.access);
        localStorage.setItem('refreshToken', data.tokens.refresh);
  
        // Redirect to dashboard or home page
        // window.location.href = '/dashboard';
        
      } catch (error) {
        console.error('Login error:', error);
        this.state.setState({ 
          error: error.message || 'Failed to log in. Please try again.' 
        });
      } finally {
        this.state.setState({ loading: false });
      }
    }
  
    async handle42Login() {
      try {
        window.location.href = `${this.API_URL}/api/auth/42/login/`;
      } catch (error) {
        console.error('42 OAuth error:', error);
        this.state.setState({ 
          error: 'Failed to initialize 42 login. Please try again.' 
        });
      }
    }

    static async handleOAuthCallback() {
      try {
        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get('access');
        const refreshToken = params.get('refresh');
        
        if (!accessToken || !refreshToken) {
          throw new Error('Missing authentication tokens');
        }

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        window.history.replaceState({}, document.title, '/dashboard');
        
        window.location.reload();
      } catch (error) {
        console.error('OAuth callback error:', error);
        window.location.href = '/login?error=' + encodeURIComponent(error.message);
      }
    }

    async setupEventListeners() {
      const form = this.$('#login-form');
      const oauth42Btn = this.$('.btn-42');
  
      this.addListener(form, 'submit', this.handleSubmit.bind(this));
      this.addListener(oauth42Btn, 'click', this.handle42Login.bind(this));

  
      this.state.subscribe((state) => {
        this.updateUIState(state);
      });
    }

  
    updateUIState(state) {
      const submitBtn = this.$('button[type="submit"]');
      const errorDiv = this.$('.form-error');
  
      if (state.loading) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';
      } else {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Log In';
      }
  
      if (state.error) {
        errorDiv.textContent = state.error;
        errorDiv.classList.add('visible');
      } else {
        errorDiv.textContent = '';
        errorDiv.classList.remove('visible');
      }
    }
  }