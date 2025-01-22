import { View } from '../core/View';
import { userState } from '../utils/UserState';

export class OAuthCallbackView extends View {
    constructor() {
        super();
        this.handleCallback();
    }

    async render() {
        const template = document.createElement('template');
        template.innerHTML = `
            <div class="callback-container">
                <div class="loading-spinner"></div>
                <p>Processing your login, please wait...</p>
            </div>
        `;
        return template.content.firstElementChild;
    }

    async handleCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const authSuccess = urlParams.get('auth_success');
        const error = urlParams.get('error');

        if (error) {
            this.router.navigate(`/login?error=${encodeURIComponent(error)}`);
            return;
        }

        try {
            await userState.checkAuth();
            
            const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || '/dashboard';
            sessionStorage.removeItem('redirectAfterLogin');
            
            this.router.navigate(redirectUrl);
        } catch (error) {
            this.router.navigate('/login?error=auth_failed');
        }
    }
}