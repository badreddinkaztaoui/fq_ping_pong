// main.js
import { Router } from './core/Router.js';
import { ErrorBoundary } from './core/ErrorBoundary.js';

// Import views
import { HomeView } from './views/Home.js';
import { LoginView } from './views/Login.js';
import { SignupView } from './views/Register.js';
import { DashboardView } from './views/Dashboard.js';

const errorBoundary = new ErrorBoundary();

function authGuard(View) {}

function setupAPIInterceptors() {}

const routes = [
  { path: '/', view: HomeView },
  { path: '/login', view: LoginView },
  { path: '/signup', view: SignupView },
  { path: '/dashboard', view: DashboardView },
  { 
    path: '/oauth/callback', 
    handler: (params) => LoginView.handleOAuthCallback(),
    view: LoginView 
  },
  { path: '*', view: HomeView }
];

const router = new Router(routes);

document.addEventListener('DOMContentLoaded', () => {
  router.handleRoute();
});


window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  errorBoundary.handleError(event.reason);
});

export default router;