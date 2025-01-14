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
    }
  
    async render() {
      const template = document.createElement('template');
      template.innerHTML = `
        <main class="login-view" role="main">
          <section class="auth-container" aria-labelledby="login-title">
            <h1 id="login-title">Login</h1>
            
            <form id="login-form" class="auth-form" novalidate>
              <div class="form-group">
                <label for="username">Username</label>
                <input 
                  type="text" 
                  id="username" 
                  name="username" 
                  required 
                  autocomplete="username"
                  aria-required="true"
                >
              </div>
  
              <div class="form-group">
                <label for="password">Password</label>
                <input 
                  type="password" 
                  id="password" 
                  name="password" 
                  required
                  autocomplete="current-password"
                  aria-required="true"
                >
              </div>
  
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" name="remember" id="remember">
                  Remember me
                </label>
              </div>
  
              <div class="form-error" role="alert" aria-live="polite"></div>
  
              <button 
                type="submit" 
                class="btn btn-primary"
                aria-label="Log in to your account"
              >
                Log In
              </button>
            </form>
  
            <div class="auth-alternatives">
              <a href="/signup" class="btn btn-link">First time ? Create Account</a>
            </div>
  
            <div class="oauth-section">
              <p>Or log in with:</p>
              <button 
                type="button" 
                class="btn btn-oauth btn-42"
                aria-label="Log in with 42 School account"
              >
                42 School
              </button>
            </div>
          </section>
        </main>
      `;
  
      return template.content.firstElementChild;
    }
  
    async setupEventListeners() {
      const form = this.$('#login-form');
      const oauth42Btn = this.$('.btn-42');
  
      this.addListener(form, 'submit', this.handleSubmit.bind(this));
      this.addListener(oauth42Btn, 'click', this.handle42Login.bind(this));
  
      // State subscription for loading and error states
      this.state.subscribe((state) => {
        this.updateUIState(state);
      });
    }
  
    async handleSubmit(event) {
      event.preventDefault();
      
    //   this.state.setState({ loading: true, error: null });
  
    //   const formData = new FormData(event.target);
      
    //   try {
    //     const response = await fetch('/api/login', {
    //       method: 'POST',
    //       headers: {
    //         'Content-Type': 'application/json'
    //       },
    //       body: JSON.stringify({
    //         username: formData.get('username'),
    //         password: formData.get('password'),
    //         remember: formData.get('remember') === 'on'
    //       })
    //     });
  
    //     if (!response.ok) {
    //       throw new Error('Invalid credentials');
    //     }
  
    //     const data = await response.json();
        
    //     // Store the token
    //     localStorage.setItem('auth_token', data.token);
        
    //     // Navigate to dashboard
    //     this.router.navigate('/dashboard');
    //   } catch (error) {
    //     this.state.setState({ 
    //       error: error.message,
    //       loading: false 
    //     });
    //   }
    }
  
    async handle42Login() {
    //   window.location.href = '/api/auth/42';
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