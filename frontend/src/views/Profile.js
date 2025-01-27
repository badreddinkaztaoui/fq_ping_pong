import { View } from '../core/View';
import { State } from "../core/State"
import { userState } from "../utils/UserState";

import "../styles/dashboard/profile.css"

export class ProfileView extends View {
    constructor() {
        super();
        this.user = userState.state.user;
        this.state = new State({
            loading: false,
            error: null,
            passwordMatch: true,
            imageProcessing: false,
            formChanges: {
                username: false,
                password: false,
                avatar: false
            }
        });

        this.imageConfig = {
            maxSize: 1024 * 1024,
            maxDimension: 1000,
            quality: 0.8,
            allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
        };
    }

    async render() {
        const template = document.createElement('section');
        template.className = 'profile-view';
        
        const is42User = this.user.auth_provider === '42';
        
        template.innerHTML = `
            <form class="profile-container" id="profileForm">
                <!-- Profile Header Section -->
                <div class="profile-header">
                    <div class="profile-banner">
                        <div class="profile-banner-overlay"></div>
                        <div class="profile-image-wrapper">
                            <div class="profile-image-container">
                                <img src="${this.user.avatar_url || "/images/users/default-avatar.webp"}" 
                                    alt="Profile" 
                                    class="profile-image" />
                                <input type="file" 
                                    id="photoInput" 
                                    accept="image/*" 
                                    class="photo-input" />
                                <button type="button" class="edit-avatar-btn" id="editAvatarBtn">
                                    <svg viewBox="0 0 24 24" class="edit-icon">
                                        <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                            </div>
                            <h1 class="profile-name">${this.user.username}</h1>
                        </div>
                    </div>
                </div>
    
                <!-- Profile Content Section -->
                <div class="profile-content">
                    <!-- Info Box -->
                    <div class="info-box">
                        <div class="info-item">
                            <span class="info-label">VALO-PONG ID</span>
                            <span class="info-value">${this.user.username}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">EMAIL</span>
                            <span class="info-value">${this.user.email}</span>
                        </div>
                    </div>
    
                    <!-- Account Settings Section -->
                    <div class="profile-section">
                        <div class="section-header">
                            <h2>ACCOUNT SETTINGS</h2>
                            <div class="accent-line"></div>
                        </div>
    
                        <!-- Input Groups -->
                        <div class="input-group">
                            <label>DISPLAY NAME</label>
                            <div class="input-wrapper">
                                <input type="text" 
                                    id="username" 
                                    name="username" 
                                    value="${this.user.username}" />
                                <span class="input-focus"></span>
                            </div>
                        </div>
                        
                        <!-- Password Fields Section -->
                        ${!is42User ? `
                            <div class="input-group">
                                <label>CURRENT PASSWORD</label>
                                <div class="input-wrapper">
                                    <input type="password" 
                                        id="currentPassword" 
                                        name="currentPassword" />
                                    <span class="input-focus"></span>
                                </div>
                            </div>
                            <div class="input-group">
                                <label>NEW PASSWORD</label>
                                <div class="input-wrapper">
                                    <input type="password" 
                                        id="newPassword"
                                        name="newPassword" />
                                    <span class="input-focus"></span>
                                </div>
                            </div>
                            <div class="input-group">
                                <label>CONFIRM NEW PASSWORD</label>
                                <div class="input-wrapper">
                                    <input type="password" 
                                        id="confirmPassword"
                                        name="confirmPassword" />
                                    <span class="input-focus"></span>
                                    <span class="password-error" id="passwordError">
                                        Passwords do not match
                                    </span>
                                </div>
                            </div>
                        ` : `
                            <div class="input-group disabled">
                                <div class="password-management-notice">
                                    <p>Password management is handled through your 42 account settings.</p>
                                </div>
                            </div>
                        `}
    
                        <!-- Security Box -->
                        <div class="security-box">
                            <div class="security-header">
                                <div class="security-status ${!is42User && this.user.is_2fa_enabled ? 'enabled' : ''}">
                                    <span class="status-dot"></span>
                                    <span>TWO-FACTOR AUTHENTICATION</span>
                                </div>
                                ${!is42User ? `
                                    <button type="button" class="setup-2fa-btn" id="setup2FA">
                                        <span class="btn-content">
                                            ${this.user.is_2fa_enabled ? 'DISABLE 2FA' : 'ENABLE 2FA'}
                                        </span>
                                    </button>
                                ` : ''}
                            </div>
                            <p class="security-desc">
                                ${is42User 
                                    ? 'Two-factor authentication is managed through your 42 account settings for users who sign in with 42.'
                                    : 'Protect your account with an additional layer of security'}
                            </p>
                        </div>
    
                        <!-- Form Actions -->
                        <div class="form-actions">
                            <button type="submit" class="save-btn">
                                <span class="btn-content">SAVE CHANGES</span>
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
        this.setupFormValidation();
        this.setupImageUpload();
        this.setup2FA();
    }


    setupFormValidation() {
        const form = this.$('#profileForm');
        const passwordError = this.$('#passwordError');
        const newPassword = this.$('#newPassword');
        const confirmPassword = this.$('#confirmPassword');
        const username = this.$('#username');
        const currentPassword = this.$('#currentPassword');
    
        this.addListener(username, 'input', () => {
            this.state.state.formChanges.username = username.value !== this.user.username;
            this.updateSaveButtonState();
        });
    
        this.addListener(newPassword, 'input', () => {
            this.state.state.formChanges.password = newPassword.value.length > 0;
            this.validatePasswords();
            this.updateSaveButtonState();
        });
    
        this.addListener(confirmPassword, 'input', () => {
            this.validatePasswords();
            this.updateSaveButtonState();
        });
    
        this.addListener(form, 'submit', async (e) => {
            e.preventDefault();
            if (this.state.state.loading) return;
            
            console.log(this.state.state.formChanges)

            try {
                this.state.state.loading = true;
                
                const updateData = {};
                
                if (this.state.state.formChanges.username) {
                    updateData.username = username.value;
                }
                
                if (this.state.state.formChanges.password) {
                    if (!currentPassword.value) {
                        throw new Error('Current password is required to change password');
                    }
                    if (!this.state.state.passwordMatch) {
                        throw new Error('New passwords do not match');
                    }
                    updateData.current_password = currentPassword.value;
                    updateData.new_password = newPassword.value;
                }
                
                if (this.state.state.formChanges.avatar) {
                    updateData.avatar_url = this.state.state.newAvatarUrl;
                }

                console.log({updateData})
    
                if (Object.keys(updateData).length > 0) {
                    await userState.updateProfile(updateData);
                    this.showSuccess('Profile updated successfully');
                    
                    this.resetFormState();
                    
                    if (updateData.new_password) {
                        currentPassword.value = '';
                        newPassword.value = '';
                        confirmPassword.value = '';
                    }
                }
            } catch (error) {
                this.showError(error.message);
            } finally {
                this.state.state.loading = false;
            }
        });
    }
    
    setupImageUpload() {
        const photoInput = this.$('#photoInput');
        const profileImage = this.$('.profile-image');
        const editAvatarBtn = this.$('#editAvatarBtn');
    
        this.addListener(editAvatarBtn, 'click', () => {
            photoInput.click();
        });
    
        this.addListener(photoInput, 'change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
    
            try {
                if (!this.imageConfig.allowedTypes.includes(file.type)) {
                    throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
                }
                if (file.size > this.imageConfig.maxSize) {
                    throw new Error('File size exceeds 1MB limit.');
                }
    
                this.state.state.imageProcessing = true;
    
                const response = await userState.updateProfileAvatar(file);
    
                profileImage.src = response.avatar_url;
                this.state.state.formChanges.avatar = true;
                this.updateSaveButtonState();
    
            } catch (error) {
                this.showError(error.message);
            } finally {
                this.state.state.imageProcessing = false;
            }
        });
    }
    
    validatePasswords() {
        const newPassword = this.$('#newPassword');
        const confirmPassword = this.$('#confirmPassword');
        const passwordError = this.$('#passwordError');
    
        if (newPassword.value || confirmPassword.value) {
            const passwordsMatch = newPassword.value === confirmPassword.value;
            this.state.state.passwordMatch = passwordsMatch;
            passwordError.style.opacity = passwordsMatch ? '0' : '1';
        } else {
            passwordError.style.opacity = '0';
            this.state.state.passwordMatch = true;
        }
    }
    
    updateSaveButtonState() {
        const saveBtn = this.$('.save-btn');
        const hasChanges = Object.values(this.state.state.formChanges).some(value => value);
        const isValid = this.state.state.passwordMatch;
        
        saveBtn.disabled = !hasChanges || !isValid;
        saveBtn.style.opacity = hasChanges && isValid ? '1' : '0.5';
    }
    
    resetFormState() {
        this.state.state.formChanges = {
            username: false,
            password: false,
            avatar: false
        };
        this.state.state.newAvatarUrl = null;
        this.updateSaveButtonState();
    }


    setup2FA() {
        const setup2FAButton = this.$('#setup2FA');
        if (!setup2FAButton) return;
        
        this.addListener(setup2FAButton, 'click', async () => {
            if (this.user.username.startsWith('42_')) {
                this.showError('Two-factor authentication is managed through your 42 account settings.');
                return;
            }
    
            try {
                this.state.state.loading = true;
                if (this.user.is_2fa_enabled) {
                    await userState.disable2FA();
                    this.user.is_2fa_enabled = false;
                    this.showSuccess('2FA disabled successfully');
                } else {
                    const response = await userState.enable2FA();
                    this.showOTPInput(response);
                }
            } catch (error) {
                this.showError(error.message);
            } finally {
                this.state.state.loading = false;
                this.updateSecurityBox();
            }
        });
    }
    
    showOTPInput(response) {
        const otpContainer = document.createElement('div');
        otpContainer.innerHTML = `
            <div class="otp-input-container">
                <p>${response.message}</p>
                <p>You have 5 minutes to enter the verification code.</p>
                <input type="text" id="otpInput" placeholder="Enter OTP">
                <button id="verifyOTP">Verify OTP</button>
            </div>
        `;
        
        this.$('.security-box').appendChild(otpContainer);
        
        this.addListener(this.$('#verifyOTP'), 'click', async () => {
            const otp = this.$('#otpInput').value;
            try {
                await userState.verify2FA(otp);
                this.user.is_2fa_enabled = true;
                this.showSuccess('2FA enabled successfully');
                otpContainer.remove();
            } catch (error) {
                this.showError(error.message);
            } finally {
                this.updateSecurityBox();
            }
        });
    }
    
    updateSecurityBox() {
        const securityStatus = this.$('.security-status');
        const setup2FAButton = this.$('#setup2FA');
        
        securityStatus.classList.toggle('enabled', this.user.is_2fa_enabled);
        setup2FAButton.querySelector('.btn-content').textContent = 
            this.user.is_2fa_enabled ? 'DISABLE 2FA' : 'ENABLE 2FA';
    }

    showSuccess(message) {
        const successDisplay = document.createElement('div');
        successDisplay.className = 'success-message';
        successDisplay.textContent = message;
        this.$('.profile-container').appendChild(successDisplay);
        setTimeout(() => successDisplay.remove(), 3000);
    }
    
    showError(message) {
        const errorDisplay = this.$('.upload-error');
        errorDisplay.textContent = message;
        errorDisplay.style.opacity = '1';
        setTimeout(() => errorDisplay.style.opacity = '0', 3000);
    }
}