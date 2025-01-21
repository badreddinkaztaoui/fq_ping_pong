import { View } from '../core/View';
import { State } from "../core/State"
import { Validation } from '../utils/Validation';
import { userState } from '../utils/UserState';
// CSS
import "../styles/register.css";

export class SignupView extends View {
    constructor() {
      super();
      this.userState = userState;
      this.validation = new Validation();
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
                    <div class="form-wrapper">
                        <div class="logo">
                            <!-- Logo placeholder -->
                        </div>
                        
                        <h1 class="title">Create Account</h1>
                        
                        <form id="signup-form" novalidate>
                            <div class="input-container">
                                <div class="input-icon">👤</div>
                                <input 
                                    type="text" 
                                    id="username" 
                                    name="username" 
                                    placeholder="USERNAME" 
                                    required 
                                    pattern="[a-zA-Z0-9_]{3,20}"
                                />
                                <div class="input-border"></div>
                                <span class="error-message" id="username-error"></span>
                            </div>

                            <div class="input-container">
                                <div class="input-icon">✉️</div>
                                <input 
                                    type="email" 
                                    id="email" 
                                    name="email" 
                                    placeholder="EMAIL" 
                                    required 
                                />
                                <div class="input-border"></div>
                                <span class="error-message" id="email-error"></span>
                            </div>

                            <div class="input-container">
                                <div class="input-icon">🔒</div>
                                <input 
                                    type="password" 
                                    id="password" 
                                    name="password" 
                                    placeholder="PASSWORD" 
                                    required 
                                    minlength="6"
                                />
                                <div class="input-border"></div>
                                <span class="error-message" id="password-error"></span>
                            </div>

                            <div class="input-container">
                                <div class="input-icon">🔒</div>
                                <input 
                                    type="password" 
                                    id="confirm-password" 
                                    name="confirmPassword" 
                                    placeholder="CONFIRM PASSWORD" 
                                    required 
                                />
                                <div class="input-border"></div>
                                <span class="error-message" id="confirm-password-error"></span>
                            </div>

                            <div class="form-error" role="alert" aria-live="polite"></div>

                            <button type="submit" class="submit-btn-up">
                                CREATE ACCOUNT
                            </button>

                            <div class="signin-link">
                                <a data-link>Already have an account? Sign in</a>
                            </div>
                        </form>
                    </div>
                </div>

                <div id="success-message" class="success-popup">
                    ACCOUNT CREATED SUCCESSFULLY
                </div>

                <div id="toast" class="toast"></div>
            </div>
        `;
  
      return template.content.firstElementChild;
    }
  
    async setupEventListeners() {
      const form = this.$("#signup-form");
      const passwordInput = this.$("#password");
      const confirmPasswordInput = this.$("#confirm-password");
      const loginLink = this.$(".signin-link a");

      this.addListener(loginLink, "click", this.router.navigate.bind(this.router, "/login"));
      this.addListener(form, "submit", this.handleSubmit.bind(this));
    
      //TODO: Add real time validation for the fields
  
      this.state.subscribe((state) => {
        this.updateUIState(state);
      });
    }
  
    showToast(message) {
      const toast = this.$("#toast");
      toast.textContent = message;
      toast.style.display = "block";
      setTimeout(() => {
        toast.style.display = "none";
      }, 3000);
    }
  
    displaySuccessMessage() {
      const successMessage = this.$("#success-message");
      successMessage.style.display = "block";
    }

    validateForm() {
      const form = this.$('#signup-form');
      const formData = new FormData(form);
      const errors = {};
    
      const username = formData.get('username');
      const email = formData.get('email');
      const password = formData.get('password');
      const confirmPassword = formData.get('confirmPassword');
    
      if (!this.validation.username(username)) {
        errors.username = 'Username must be 3-20 characters long and contain only letters, numbers, and underscores';
      }
    
      if (!this.validation.email(email)) {
        errors.email = 'Please enter a valid email address';
      }
    
      if (!this.validation.password(password)) {
        errors.password = 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number';
      }
    
      if (password !== confirmPassword) {
        errors['confirm-password'] = 'Passwords do not match';
      }
    
      if (Object.keys(errors).length > 0) {
        this.state.setState({ validationErrors: errors });
        return false;
      }
    
      return true;
    }
  
    async handleSubmit(event) {
      event.preventDefault();
      
      if (!this.validateForm()) {
        return;
      }
      
      const formData = new FormData(event.target);
      const data = {
        email: formData.get('email').toLowerCase().trim(),
        username: formData.get('username'),
        password: formData.get('password'),
        display_name: formData.get('username')
      };
      
      this.state.setState({ loading: true, error: null });
      
      try {
        await this.userState.register(data);
        
        this.displaySuccessMessage();
        
        setTimeout(() => {
          this.router.navigate('/login');
        }, 2000);
      } catch (error) {
        this.state.setState({
          error: error.message || 'Registration failed. Please try again.',
          loading: false
        });
        this.showToast('Registration failed. Please check your input.');
      }
    } 
  
    updateUIState(state) {
      const submitBtn = this.$('button[type="submit"]');
      const errorDiv = this.$(".form-error");
  
      if (state.loading) {
        submitBtn.disabled = true;
        submitBtn.textContent = "CREATING ACCOUNT...";
      } else {
        submitBtn.disabled = false;
        submitBtn.textContent = "CREATE ACCOUNT";
      }
  
      if (state.error) {
        errorDiv.textContent = state.error;
        errorDiv.classList.add("visible");
      } else {
        errorDiv.textContent = "";
        errorDiv.classList.remove("visible");
      }
  
      const errorMessages = document.querySelectorAll(".error-message");
      errorMessages.forEach((message) => {
        message.style.display = "none";
        message.textContent = "";
      });
  
      Object.entries(state.validationErrors || {}).forEach(([field, error]) => {
        const errorElement = this.$(`#${field}-error`);
        if (errorElement) {
          errorElement.textContent = error;
          errorElement.style.display = "block";
        }
      });
    }
  }