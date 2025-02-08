import { View } from '../core/View';
import { State } from "../core/State"
import { Validation } from '../utils/Validation';
import { userState } from '../utils/UserState';
import { MessageHandler } from '../utils/MessageHandler';
import "../styles/register.css";

export class SignupView extends View {
  constructor() {
    super();
    this.userState = userState;
    this.validation = new Validation();
    this.toast = new MessageHandler()
    this.state = new State({
      loading: false,
      error: null,
      validationErrors: {}
    });
  }

  async render() {
    const template = document.createElement('template');
    template.innerHTML = `
            <div class="signup-container">
                <div class="signup-image">
                    <div class="image-overlay"></div>
                </div>

                <div class="signup-form">
                  <div class="logo-container">
                    <img src="/images/logo.png" alt="Company Logo" class="logo" />
                  </div>
                    <div class="form-wrapper">
                        <h1 class="title">Create Account</h1>
                        
                        <form id="signup-form" novalidate>
                            <div class="input-container">
                                <input 
                                    type="text" 
                                    id="username" 
                                    name="username" 
                                    placeholder="USERNAME" 
                                    autocomplete="off"
                                    required 
                                    pattern="[a-zA-Z0-9_]{3,20}"
                                />
                                <span class="error-message" id="username-error"></span>
                            </div>

                            <div class="input-container">
                                <input 
                                    type="email" 
                                    id="email" 
                                    name="email" 
                                    placeholder="EMAIL" 
                                    autocomplete="off"
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
                                    autocomplete="off"
                                    required 
                                    minlength="8"
                                />
                                <span class="error-message" id="password-error"></span>
                            </div>

                            <div class="input-container">
                                <input 
                                    type="password" 
                                    id="confirm-password" 
                                    name="confirmPassword" 
                                    placeholder="CONFIRM PASSWORD" 
                                    autocomplete="off"
                                    required 
                                />
                                <span class="error-message" id="confirm-password-error"></span>
                            </div>

                            <button type="submit" class="submit-btn-up">
                                CREATE ACCOUNT
                            </button>

                            <div class="signup-link">
                                <a data-link>Already have an account? Sign in</a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

    return template.content.firstElementChild;
  }

  validateForm(formData) {
    const errors = {};
    const username = formData.get('username');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    if (!username || !this.validation.username(username)) {
      errors.username = !username ? 'Username is required' :
        'Username must be 3-20 characters long and contain only letters, numbers, and underscores';
    }

    if (!email || !this.validation.email(email)) {
      errors.email = !email ? 'Email is required' :
        'Please enter a valid email address';
    }

    if (!password || !this.validation.password(password)) {
      errors.password = !password ? 'Password is required' :
        'Password must be at least 8 characters with uppercase, lowercase, and numbers';
    }

    if (!confirmPassword || password !== confirmPassword) {
      errors['confirm-password'] = !confirmPassword ? 'Please confirm your password' :
        'Passwords do not match';
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
    ['username', 'email', 'password', 'confirm-password'].forEach(field => {
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

  showToast(message, type = 'error') {
    switch(type) {
      case 'success':
        this.toast.success(message);
        break;
      case 'error':
        this.toast.error(message);
        break;
      case 'info':
        this.toast.warning(message);
        break;
    }
  }

  async handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    if (!this.validateForm(formData)) return;

    const data = {
      email: formData.get('email').toLowerCase().trim(),
      username: formData.get('username'),
      password: formData.get('password'),
      display_name: formData.get('username')
    };

    this.state.setState({ loading: true, error: null });
    const submitBtn = this.$('button[type="submit"]');
    submitBtn.textContent = 'Creating Account...';
    submitBtn.disabled = true;

    try {
      await this.userState.register(data);
      this.showToast('Account created successfully! Redirecting...', 'success');
      setTimeout(() => this.router.navigate('/dashboard'), 1000);
    } catch (error) {
      this.state.setState({ loading: false });
      this.showToast(error.message);
    } finally {
      submitBtn.textContent = 'CREATE ACCOUNT';
      submitBtn.disabled = false;
    }
  }

  async setupEventListeners() {
    const form = this.$('#signup-form');
    const signInLink = this.$('.signup-link a');
    const inputs = this.$$('input');

    this.addListener(form, 'submit', this.handleSubmit.bind(this));
    this.addListener(signInLink, 'click', () => this.router.navigate('/login'));

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