import { View } from '../core/View';
import { State } from "../core/State"
import "../styles/register.css";

export class SignupView extends View {
    constructor() {
      super();
      this.state = new State({
        loading: false,
        error: null,
        validationErrors: {}
      });
    }
  
    async render() {
      const template = document.createElement('template');
      template.innerHTML = `
        <main class="signup-view" role="main">
          <section class="auth-container" aria-labelledby="signup-title">
            <h1 id="signup-title">Create Your Account</h1>
            
            <form id="signup-form" class="auth-form" novalidate>
              <div class="form-group">
                <label for="username">Username</label>
                <input 
                  type="text" 
                  id="username" 
                  name="username" 
                  required 
                  autocomplete="username"
                  aria-required="true"
                  pattern="[a-zA-Z0-9_]{3,20}"
                >
                <span class="form-hint">3-20 characters, letters, numbers and underscore only</span>
              </div>
  
              <div class="form-group">
                <label for="email">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  required
                  autocomplete="email"
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
                  autocomplete="new-password"
                  aria-required="true"
                  minlength="8"
                >
                <span class="form-hint">Minimum 8 characters</span>
              </div>
  
              <div class="form-group">
                <label for="confirm-password">Confirm Password</label>
                <input 
                  type="password" 
                  id="confirm-password" 
                  name="confirmPassword" 
                  required
                  autocomplete="new-password"
                  aria-required="true"
                >
              </div>
  
              <div class="form-group">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    name="terms" 
                    id="terms" 
                    required
                    aria-required="true"
                  >
                  I agree to the Terms and Conditions
                </label>
              </div>
  
              <div class="form-error" role="alert" aria-live="polite"></div>
  
              <button 
                type="submit" 
                class="btn btn-primary"
                aria-label="Create your account"
              >
                Create Account
              </button>
            </form>
  
            <div class="auth-alternatives">
              <p>Already have an account? <a href="/login">Log In</a></p>
            </div>
          </section>
        </main>
      `;
  
      return template.content.firstElementChild;
    }
  
    async setupEventListeners() {
      const form = this.$('#signup-form');
      const passwordInput = this.$('#password');
      const confirmPasswordInput = this.$('#confirm-password');
  
      this.addListener(form, 'submit', this.handleSubmit.bind(this));
      this.addListener(passwordInput, 'input', () => this.validatePassword());
      this.addListener(confirmPasswordInput, 'input', () => this.validatePassword());
  
      // Real-time validation
      this.addListener(form, 'input', (event) => {
        if (event.target.matches('input[required]')) {
          this.validateField(event.target);
        }
      });
  
      this.state.subscribe((state) => {
        this.updateUIState(state);
      });
    }
  
    validateField(field) {
      const errors = this.state.getState().validationErrors || {};
      
      if (field.validity.valueMissing) {
        errors[field.name] = 'This field is required';
      } else if (field.validity.patternMismatch && field.name === 'username') {
        errors[field.name] = 'Username can only contain letters, numbers and underscore';
      } else if (field.validity.typeMismatch && field.name === 'email') {
        errors[field.name] = 'Please enter a valid email address';
      } else {
        delete errors[field.name];
      }
  
      this.state.setState({ validationErrors: errors });
    }
  
    validatePassword() {
      const password = this.$('#password').value;
      const confirmPassword = this.$('#confirm-password').value;
      const errors = this.state.getState().validationErrors || {};
  
      if (password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      } else if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      } else {
        delete errors.password;
        delete errors.confirmPassword;
      }
  
      this.state.setState({ validationErrors: errors });
    }
  
    async handleSubmit(event) {
      event.preventDefault();
      
    //   if (!this.validateForm()) {
    //     return;
    //   }
  
    //   this.state.setState({ loading: true, error: null });
  
    //   const formData = new FormData(event.target);
      
    //   try {
    //     const response = await fetch('/api/signup', {
    //       method: 'POST',
    //       headers: {
    //         'Content-Type': 'application/json'
    //       },
    //       body: JSON.stringify({
    //         username: formData.get('username'),
    //         email: formData.get('email'),
    //         password: formData.get('password')
    //       })
    //     });
  
    //     if (!response.ok) {
    //       throw new Error('Registration failed');
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
  
    validateForm() {
      const form = this.$('#signup-form');
      const errors = {};
      
      // Check all required fields
      form.querySelectorAll('input[required]').forEach(field => {
        this.validateField(field);
      });
  
      // Validate password match
      this.validatePassword();
  
      const currentErrors = this.state.getState().validationErrors;
      return Object.keys(currentErrors).length === 0;
    }
  
    updateUIState(state) {
      const submitBtn = this.$('button[type="submit"]');
      const errorDiv = this.$('.form-error');
  
      if (state.loading) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating Account...';
      } else {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
      }
  
      if (state.error) {
        errorDiv.textContent = state.error;
        errorDiv.classList.add('visible');
      } else {
        errorDiv.textContent = '';
        errorDiv.classList.remove('visible');
      }
  
      // Update validation error messages
      Object.entries(state.validationErrors || {}).forEach(([field, error]) => {
        const input = this.$(`#${field}`);
        const errorSpan = input.nextElementSibling;
        
        if (errorSpan && errorSpan.classList.contains('form-hint')) {
          errorSpan.textContent = error;
          errorSpan.classList.add('error');
        }
      });
    }
  }