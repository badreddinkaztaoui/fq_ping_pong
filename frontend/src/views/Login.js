import { View } from '../core/View';
import { State } from "../core/State"
import { userState } from '../utils/UserState';
import { Validation } from '../utils/Validation';
// CSS
import "../styles/login.css";

export class LoginView extends View {
    constructor() {
      super();
      this.userState = userState;
      this.validation = new Validation();
      this.state = new State({
        loading: false,
        error: null
      });
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
                <a data-link>Can't login? | Create an account</a>
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
      const email = formData.get('email');
      const password = formData.get('password');
    
      if (!this.validateForm(email, password)) {
        return;
      }
    
      this.state.setState({ loading: true, error: null });
    
      try {
        await this.userState.login({
          email: email.toLowerCase().trim(),
          password: password
        });
    
        // this.showToast('Login successful! Redirecting...');
    
        setTimeout(() => {
          this.router.navigate('/dashboard');
        }, 1000);
      } catch (error) {
        this.state.setState({
          error: error.message || 'Login failed. Please check your credentials.',
          loading: false
        });
        // this.showToast('Login failed. Please try again.');
        console.error(error);
      }
    }

    validateForm(email, password) {
      const errors = {};
    
      if (!this.validation.email(email)) {
        errors.email = 'Please enter a valid email address';
      }
    
      if (!this.validation.required(password)) {
        errors.password = 'Password is required';
      }
    
      if (Object.keys(errors).length > 0) {
        this.state.setState({ validationErrors: errors });
        return false;
      }
    
      return true;
    }
  
    async handle42Login() {}

    static async handleOAuthCallback() {}

    async setupEventListeners() {
      const form = this.$('#login-form');
      const oauth42Btn = this.$('.btn-42');
      const signupLink = this.$('.signup-link a');

      this.addListener(signupLink, 'click', this.router.navigate.bind(this.router, '/signup'));
  
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