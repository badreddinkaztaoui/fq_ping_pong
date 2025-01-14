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
function authGuard(View) {
  return class extends View {
    constructor(params) {
      super(params);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        window.location.href = '/login';
        return;
      }
    }
  };
}

const routes = [
  { path: '/', view: HomeView },
  { path: '/login', view: LoginView },
  { path: '/signup', view: SignupView },
  { path: '/dashboard', view: authGuard(DashboardView) },
  { path: '*', view: HomeView } // Fallback route
];

const router = new Router(routes);

document.addEventListener('DOMContentLoaded', () => {
  // Add auth token to all API requests
  setupAPIInterceptors();
  
  router.handleRoute();
});

// Setup API interceptors for authentication
function setupAPIInterceptors() {
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const [resource, config] = args;

    // Only add auth header to API requests
    if (resource.toString().startsWith('/api')) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${token}`
        };
      }
    }

    try {
      const response = await originalFetch(resource, config);
      
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
        return;
      }
      
      return response;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };
}

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  errorBoundary.handleError(event.reason);
});

export default router;