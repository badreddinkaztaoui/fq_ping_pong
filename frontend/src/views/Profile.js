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
            imageProcessing: false
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
        template.innerHTML = this.getProfileTemplate();

        return template;
    }

    getProfileTemplate() {
        return `
            <form class="profile-container" id="profileForm">
                ${this.getProfileHeader()}
                <div class="profile-content">
                    ${this.getInfoBox()}
                    ${this.getAccountSettings()}
                </div>
                <div class="upload-error" role="alert"></div>
            </form>
        `;
    }

    getProfileHeader() {
        return `
            <div class="profile-header">
                <div class="profile-banner">
                    <div class="profile-banner-overlay"></div>
                    <div class="profile-image-wrapper">
                        ${this.getProfileImage()}
                        <h1 class="profile-name">${this.user.username.split("_")[1]}</h1>
                    </div>
                </div>
            </div>
        `;
    }

    getProfileImage() {
        return `
            <div class="profile-image-container">
                <img src="${this.user.avatar_url}" alt="Profile" class="profile-image" />
                <input type="file" id="photoInput" accept="image/*" class="photo-input" />
                <button type="button" class="edit-avatar-btn" id="editAvatarBtn">
                    <svg viewBox="0 0 24 24" class="edit-icon">
                        <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                </button>
            </div>
        `;
    }

    getInfoBox() {
        return `
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
        `;
    }

    getAccountSettings() {
        return `
            <div class="profile-section">
                ${this.getSectionHeader()}
                ${this.getInputGroups()}
                ${this.getSecurityBox()}
                <div class="form-actions">
                    <button type="submit" class="save-btn">
                        <span class="btn-content">SAVE CHANGES</span>
                        <span class="btn-bg"></span>
                    </button>
                </div>
            </div>
        `;
    }

    getSectionHeader() {
        return `
            <div class="section-header">
                <h2>ACCOUNT SETTINGS</h2>
                <div class="accent-line"></div>
            </div>
        `;
    }

    getInputGroups() {
        return `
            <div class="input-group">
                <label>DISPLAY NAME</label>
                <div class="input-wrapper">
                    <input type="text" id="username" name="username" 
                           value="${this.user.username.split("_")[1]}" required />
                    <span class="input-focus"></span>
                </div>
            </div>
            <div class="input-group">
                <label>CURRENT PASSWORD</label>
                <div class="input-wrapper">
                    <input type="password" id="currentPassword" name="currentPassword" required />
                    <span class="input-focus"></span>
                </div>
            </div>
            <div class="input-group">
                <label>NEW PASSWORD</label>
                <div class="input-wrapper">
                    <input type="password" id="newPassword" name="newPassword" required />
                    <span class="input-focus"></span>
                </div>
            </div>
            <div class="input-group">
                <label>CONFIRM NEW PASSWORD</label>
                <div class="input-wrapper">
                    <input type="password" id="confirmPassword" name="confirmPassword" required />
                    <span class="input-focus"></span>
                    <span class="password-error" id="passwordError">Passwords do not match</span>
                </div>
            </div>
        `;
    }

    getSecurityBox() {
        return `
            <div class="security-box">
                <div class="security-header">
                    <div class="security-status ${this.user.twoFactorEnabled ? 'enabled' : ''}">
                        <span class="status-dot"></span>
                        <span>TWO-FACTOR AUTHENTICATION</span>
                    </div>
                    <button type="button" class="setup-2fa-btn" id="setup2FA">
                        <span class="btn-content">
                            ${this.user.twoFactorEnabled ? 'DISABLE 2FA' : 'ENABLE 2FA'}
                        </span>
                    </button>
                </div>
                <p class="security-desc">Protect your account with an additional layer of security</p>
            </div>
        `;
    }

    setupEventListeners() {
        this.setupFormValidation();
        this.setupImageUpload();
        this.setup2FA();
    }

    setupFormValidation() {
        const form = this.$('#profileForm');
        const newPassword = this.$('#newPassword');
        const confirmPassword = this.$('#confirmPassword');
        const passwordError = this.$('#passwordError');

        this.addListener(form, 'submit', e => {
            e.preventDefault();
            if (!this.state.passwordMatch || this.state.imageProcessing) return;
            const formData = new FormData(form);
            // Handle form submission
        });

        this.addListener(confirmPassword, 'input', () => {
            const matches = newPassword.value === confirmPassword.value;
            passwordError.style.opacity = matches ? '0' : '1';
            this.state.passwordMatch = matches;
        });
    }

    validateImage(file) {
        if (!file) return { valid: false, error: 'No file selected' };
        if (!this.imageConfig.allowedTypes.includes(file.type)) {
            return {
                valid: false,
                error: `Invalid file type. Allowed: ${this.imageConfig.allowedTypes.join(', ')}`
            };
        }
        if (file.size > this.imageConfig.maxSize) {
            return {
                valid: false,
                error: `File must be under ${this.imageConfig.maxSize / 1024 / 1024}MB`
            };
        }
        return { valid: true };
    }

    validateDimensions(width, height) {
        const maxDim = this.imageConfig.maxDimension;
        if (width > maxDim || height > maxDim) {
            return {
                valid: false,
                error: `Image dimensions must be ${maxDim}x${maxDim}px or less`
            };
        }
        return { valid: true };
    }

    calculateDimensions(width, height) {
        const maxDim = this.imageConfig.maxDimension;
        const aspectRatio = width / height;

        if (width > height && width > maxDim) {
            return {
                width: maxDim,
                height: Math.round(maxDim / aspectRatio)
            };
        } else if (height > maxDim) {
            return {
                width: Math.round(maxDim * aspectRatio),
                height: maxDim
            };
        }
        return { width, height };
    }

    processImage(file, img) {
        const validation = this.validateImage(file);
        if (!validation.valid) {
            this.showError(validation.error);
            return null;
        }

        const dimensionCheck = this.validateDimensions(img.width, img.height);
        if (!dimensionCheck.valid) {
            this.showError(dimensionCheck.error);
            return null;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const dimensions = this.calculateDimensions(img.width, img.height);

        canvas.width = dimensions.width;
        canvas.height = dimensions.height;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);

        const processedFile = canvas.toDataURL('image/jpeg', this.imageConfig.quality);
        return processedFile;
    }

    setupImageUpload() {
        const photoInput = this.$('#photoInput');
        const avatarImg = this.$('.profile-image');

        this.addListener(this.$('#editAvatarBtn'), 'click', e => {
            e.preventDefault();
            if (!this.state.imageProcessing) photoInput.click();
        });

        this.addListener(photoInput, 'change', e => {
            const file = e.target.files[0];
            if (!file) return;

            this.state.imageProcessing = true;
            const reader = new FileReader();

            reader.onload = e => {
                const img = new Image();
                img.onload = () => {
                    const processedImage = this.processImage(file, img);
                    if (processedImage) {
                        avatarImg.src = processedImage;
                    }
                    this.state.imageProcessing = false;
                    photoInput.value = '';
                };
                img.src = e.target.result;
            };

            reader.readAsDataURL(file);
        });
    }

    setup2FA() {
        this.addListener(this.$('#setup2FA'), 'click', () => {
            // Handle 2FA setup/disable
        });
    }

    showError(message) {
        const errorDisplay = this.$('.upload-error');
        errorDisplay.textContent = message;
        errorDisplay.style.opacity = '1';
        setTimeout(() => errorDisplay.style.opacity = '0', 3000);
    }
}