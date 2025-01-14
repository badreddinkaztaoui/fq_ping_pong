// main.js
import { Router } from './core/Router.js';
import { ErrorBoundary } from './core/ErrorBoundary.js';

// Import views
import { HomeView } from './views/Home.js';
import { LoginView } from './views/Login.js';
import { SignupView } from './views/Register.js';
import { DashboardView } from './views/Dashboard.js';

const errorBoundary = new ErrorBoundary();

// Authentication guard
function authGuard(View) {}

const routes = [
  { path: '/', view: HomeView },
  { path: '/login', view: LoginView },
  { path: '/signup', view: SignupView },
  { path: '/dashboard', view: DashboardView },
  { path: '*', view: HomeView }
];

const router = new Router(routes);

document.addEventListener('DOMContentLoaded', () => {
  // Add auth token to all API requests
  setupAPIInterceptors();
  
  router.handleRoute();
});

// Setup API interceptors for authentication
function setupAPIInterceptors() {}

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  errorBoundary.handleError(event.reason);
});

export default router;