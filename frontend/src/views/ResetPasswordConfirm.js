import { View } from "../core/View";
import { State } from "../core/State";
import { userState } from "../utils/UserState";

export class ResetPasswordConfirmView extends View {
  constructor(params) {
    super();
    this.params = params;
    if (!params.uidb64 || !params.token) {
      console.error("Invalid reset password URL");
      window.location.href = "/login";
    }
    this.state = new State({
      loading: false,
      error: null,
      success: false,
      passwordMatch: true,
    });
  }

  async render() {
    const template = document.createElement("section");
    template.className = "reset-view";

    template.innerHTML = `
            <form class="profile-container" id="resetPasswordConfirmForm">
                <div class="reset-content">
                    <div class="profile-section">
                        <div class="section-header">
                            <h2>SET NEW PASSWORD</h2>
                            <div class="accent-line"></div>
                        </div>
                        
                        <div class="input-group">
                            <label>NEW PASSWORD</label>
                            <div class="input-wrapper">
                                <input type="password" 
                                    id="newPassword" 
                                    name="newPassword" 
                                    required />
                                <span class="input-focus"></span>
                            </div>
                        </div>
                        
                        <div class="input-group">
                            <label>CONFIRM NEW PASSWORD</label>
                            <div class="input-wrapper">
                                <input type="password" 
                                    id="confirmPassword" 
                                    name="confirmPassword" 
                                    required />
                                <span class="input-focus"></span>
                                <span class="password-error" id="passwordError">
                                    Passwords do not match
                                </span>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="save-btn">
                                <span class="btn-content">RESET PASSWORD</span>
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
    const form = this.$("#resetPasswordConfirmForm");
    const newPassword = this.$("#newPassword");
    const confirmPassword = this.$("#confirmPassword");

    this.addListener(newPassword, "input", () => this.validatePasswords());
    this.addListener(confirmPassword, "input", () => this.validatePasswords());

    this.addListener(form, "submit", async (e) => {
      e.preventDefault();
      if (this.state.state.loading) return;

      if (!this.state.state.passwordMatch) {
        this.showError("Passwords do not match");
        return;
      }

      const newPassword = this.$("#newPassword").value;
      const { uidb64, token } = this.params;

      try {
        this.state.state.loading = true;
        await userState.resetPasswordConfirm(uidb64, token, newPassword);
        this.state.state.success = true;
        this.showSuccess(
          "Password reset successfully. You can now log in with your new password."
        );
        setTimeout(() => {
          window.location.href = "/login";
        }, 3000);
      } catch (error) {
        this.showError(error.message);
      } finally {
        this.state.state.loading = false;
      }
    });
  }

  validatePasswords() {
    const newPassword = this.$("#newPassword");
    const confirmPassword = this.$("#confirmPassword");
    const passwordError = this.$("#passwordError");

    const passwordsMatch = newPassword.value === confirmPassword.value;
    this.state.state.passwordMatch = passwordsMatch;
    passwordError.style.opacity = passwordsMatch ? "0" : "1";
  }

  showSuccess(message) {
    const successDisplay = document.createElement("div");
    successDisplay.className = "success-message";
    successDisplay.textContent = message;
    this.$(".profile-container").appendChild(successDisplay);
    setTimeout(() => successDisplay.remove(), 5000);
  }

  showError(message) {
    const errorDisplay = this.$(".upload-error");
    errorDisplay.textContent = message;
    errorDisplay.style.opacity = "1";
    setTimeout(() => (errorDisplay.style.opacity = "0"), 5000);
  }
}
