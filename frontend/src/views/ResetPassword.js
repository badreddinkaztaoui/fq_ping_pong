import { View } from '../core/View';
import { State } from "../core/State";
import { userState } from "../utils/UserState";

import "../styles/dashboard/profile.css";

export class ResetPasswordView extends View {
    constructor() {
        super();
        this.state = new State({
            loading: false,
            error: null,
            success: false
        });
    }

    async render() {
        const template = document.createElement('section');
        template.className = 'profile-view';
        
        template.innerHTML = `
            <form class="profile-container" id="resetPasswordForm">
                <div class="profile-content">
                    <div class="profile-section">
                        <div class="section-header">
                            <h2>RESET PASSWORD</h2>
                            <div class="accent-line"></div>
                        </div>
                        
                        <div class="input-group">
                            <label>EMAIL</label>
                            <div class="input-wrapper">
                                <input type="email" 
                                    id="email" 
                                    name="email" 
                                    required />
                                <span class="input-focus"></span>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="save-btn">
                                <span class="btn-content">SEND RESET LINK</span>
                                <span class="btn-bg"></span>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="upload-error" role="alert"></div>
            </form>
        `;
        
        return template;
    }

    setupEventListeners() {
        const form = this.$('#resetPasswordForm');
        
        this.addListener(form, 'submit', async (e) => {
            e.preventDefault();
            if (this.state.state.loading) return;
            
            const email = this.$('#email').value;
            
            try {
                this.state.state.loading = true;
                await userState.resetPasswordRequest(email);
                this.state.state.success = true;
                this.showSuccess('Password reset link sent. Please check your email.');
            } catch (error) {
                this.showError(error.message);
            } finally {
                this.state.state.loading = false;
            }
        });
    }

    showSuccess(message) {
        const successDisplay = document.createElement('div');
        successDisplay.className = 'success-message';
        successDisplay.textContent = message;
        this.$('.profile-container').appendChild(successDisplay);
        setTimeout(() => successDisplay.remove(), 5000);
    }
    
    showError(message) {
        const errorDisplay = this.$('.upload-error');
        errorDisplay.textContent = message;
        errorDisplay.style.opacity = '1';
        setTimeout(() => errorDisplay.style.opacity = '0', 5000);
    }
}