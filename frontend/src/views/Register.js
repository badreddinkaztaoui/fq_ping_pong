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
                                <a href="/login" data-link>Already have an account? Sign in</a>
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
  
      this.addListener(form, "submit", this.handleSubmit.bind(this));
      this.addListener(passwordInput, "input", () => this.validatePassword());
      this.addListener(confirmPasswordInput, "input", () =>
        this.validatePassword()
      );
  
      // Real-time validation
      this.addListener(form, "input", (event) => {
        if (event.target.matches("input[required]")) {
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
        errors[field.name] = `${field.placeholder} IS REQUIRED`;
      } else if (field.name === "username" && field.value.length < 3) {
        errors[field.name] = "USERNAME MUST BE AT LEAST 3 CHARACTERS";
      } else if (field.name === "email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(field.value)) {
          errors[field.name] = "PLEASE ENTER A VALID EMAIL";
        } else {
          delete errors[field.name];
        }
      } else {
        delete errors[field.name];
      }
  
      this.state.update({ validationErrors: errors });
    }
  
    validatePassword() {
      const password = this.$("#password").value;
      const confirmPassword = this.$("#confirm-password").value;
      const errors = this.state.getState().validationErrors || {};
  
      if (password.length < 6) {
        errors.password = "PASSWORD MUST BE AT LEAST 6 CHARACTERS";
      } else if (password !== confirmPassword && confirmPassword) {
        errors.confirmPassword = "PASSWORDS DO NOT MATCH";
      } else {
        delete errors.password;
        delete errors.confirmPassword;
      }
  
      this.state.update({ validationErrors: errors });
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
      const form = this.$("#signup-form");
  
      // Check all required fields
      form.querySelectorAll("input[required]").forEach((field) => {
        this.validateField(field);
      });
  
      this.validatePassword();
  
      const currentErrors = this.state.getState().validationErrors;
      return Object.keys(currentErrors).length === 0;
    }
  
    async handleSubmit(event) {
      event.preventDefault();
      
      if (!this.validateForm()) {
        return;
      }
      
      const formData = new FormData(event.target);
      const data = {
        email: formData.get('email'),
        username: formData.get('username'),
        password: formData.get('password'),
        password2: formData.get('confirmPassword'),
        display_name: formData.get('username')
      };
      
      this.state.setState({ loading: true, error: null });
      
      try {
        const response = await fetch(`${this.API_URL}/api/auth/signup/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });
        
        const responseData = await response.json();
        
        if (!response.ok) {
          throw new Error(responseData.error || 'Registration failed');
        }
        
        // Store tokens
        localStorage.setItem('accessToken', responseData.tokens.access);
        localStorage.setItem('refreshToken', responseData.tokens.refresh);
        
        // Show success message
        this.displaySuccessMessage();
        
        // Redirect to dashboard after brief delay
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
        
      } catch (error) {
        console.error('Registration error:', error);
        this.state.setState({ 
          error: error.message || 'Failed to create account. Please try again.' 
        });
      } finally {
        this.state.setState({ loading: false });
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
  
      // Update validation error messages
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