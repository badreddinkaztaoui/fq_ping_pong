import { View } from '../core/View';
import { State } from "../core/State"
import { userState } from '../utils/UserState';
import { Validation } from '../utils/Validation';
import "../styles/login.css";

export class LoginView extends View {
  constructor() {
    super();
    this.userState = userState;
    this.validation = new Validation();
    this.state = new State({
      loading: false,
      error: null,
      validationErrors: {}
    });
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      this.handle42Callback(code);
    }
  }

  async render() {
    const template = document.createElement('template');
    template.innerHTML = `
      <div class="signin-container">
        <div class="signin-image">
          <div class="image-overlay"></div>
        </div>
        
        <div class="signin-form">
          <div class="logo-container">
            <img src="/images/logo.png" alt="Company Logo" class="logo" />
          </div>

          <div class="form-wrapper">
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
                Sign In
              </button>

              <div class="divider">
                <span>OR</span>
              </div>

              <button type="button" class="submit-btn-sign-in oauth-btn" id="login-42">
                Sign in with
                <img src="/images/42_logo.svg" alt="42 Logo" class="oauth-icon" />
              </button>
              
              <div class="signup-link">
                <a data-link>Create an account</a>
              </div>
            </form>
          </div>
        </div>

        <div id="toast" class="toast"></div>
      </div>
    `;

    return template.content.firstElementChild;
  }

  async handle42Callback(code) {
    try {
      await this.userState.handle42Callback(code);
    } catch (error) {
      this.showToast(error.message);
    }
  }

  validateForm(email, password) {
    const errors = {};

    if (!email || !this.validation.email(email) || email.length > 100) {
      errors.email = !email ? 'Email is required' :
        !this.validation.email(email) ? 'Please enter a valid email address' :
          'Email address is too long (maximum 100 characters)';
    }

    if (!password || password.length < 8 || password.length > 50) {
      errors.password = !password ? 'Password is required' :
        password.length < 8 ? 'Password must be at least 8 characters long' :
          'Password is too long (maximum 50 characters)';
    }

    const hasErrors = Object.keys(errors).length > 0;
    this.state.setState({
      validationErrors: errors,
      error: hasErrors ? 'Please correct the form errors before proceeding' : null
    });

    hasErrors ? this.showFieldErrors(errors) : this.clearFieldErrors();
    return !hasErrors;
  }

  showFieldErrors(errors) {
    Object.entries(errors).forEach(([field, message]) => {
      const errorElement = this.$(`#${field}-error`);
      const inputElement = this.$(`#${field}`);

      if (errorElement && inputElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        errorElement.classList.add('fade-in');

        inputElement.classList.add('input-error', 'shake');
        inputElement.setAttribute('aria-invalid', 'true');
        inputElement.setAttribute('aria-describedby', `${field}-error`);

        setTimeout(() => inputElement.classList.remove('shake'), 500);
      }
    });
  }

  clearFieldErrors() {
    ['email', 'password'].forEach(field => {
      const errorElement = this.$(`#${field}-error`);
      const inputElement = this.$(`#${field}`);

      if (errorElement && inputElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
        errorElement.classList.remove('fade-in');

        inputElement.classList.remove('input-error', 'shake');
        inputElement.removeAttribute('aria-invalid');
        inputElement.removeAttribute('aria-describedby');
      }
    });
  }

  showToast(message, type = 'error', duration = 5000) {
    const toast = this.$('#toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast ${type} visible`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => {
        toast.textContent = '';
        toast.className = 'toast';
        toast.removeAttribute('role');
      }, 300);
    }, duration);
  }

  async handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const email = formData.get('email');
    const password = formData.get('password');

    if (!this.validateForm(email, password)) return;

    this.state.setState({ loading: true, error: null });
    const submitBtn = this.$('button[type="submit"]');
    submitBtn.textContent = 'Signing in...';
    submitBtn.disabled = true;

    try {
      await this.userState.login({
        email: email.toLowerCase().trim(),
        password
      });

      this.showToast('Login successful! Redirecting...', 'success', 3000);
      setTimeout(() => this.router.navigate('/dashboard'), 1000);
    } catch (error) {
      this.state.setState({ error, loading: false });
      this.showToast(error);
    } finally {
      submitBtn.textContent = 'Sign In';
      submitBtn.disabled = false;
    }
  }

  async setupEventListeners() {
    const form = this.$('#login-form');
    const signupLink = this.$('.signup-link a');
    const inputs = this.$$('input');
    const login42Btn = this.$('#login-42');

    this.addListener(form, 'submit', this.handleSubmit.bind(this));
    this.addListener(signupLink, 'click', () => this.router.navigate('/signup'));
    this.addListener(login42Btn, 'click', async () => {
      try {
        await this.userState.loginWith42();
      } catch (error) {
        this.showToast(error.message);
      }
    });

    inputs.forEach(input => {
      this.addListener(input, 'input', () => {
        const errorElement = this.$(`#${input.id}-error`);
        if (errorElement) {
          errorElement.textContent = '';
          errorElement.style.display = 'none';
        }
        input.classList.remove('input-error');
        input.removeAttribute('aria-invalid');
      });
    });
  }
}