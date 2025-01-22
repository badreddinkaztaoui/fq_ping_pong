import { Router } from './core/Router.js';
import { ErrorBoundary } from './core/ErrorBoundary.js';
import { AuthGuard } from './utils/AuthGuard.js';

import { HomeView } from './views/Home.js';
import { LoginView } from './views/Login.js';
import { SignupView } from './views/Register.js';
import { HerosView } from './views/Heros.js';
import { DashboardView } from './views/Dashboard.js';

const errorBoundary = new ErrorBoundary();

const routes = [
  { 
    path: '/', 
    view: HomeView
  },
  { 
    path: '/login', 
    view: LoginView,
    handler: AuthGuard.requireGuest
  },
  { 
    path: '/signup', 
    view: SignupView,
    handler: AuthGuard.requireGuest
  },
  { 
    path: '/heros', 
    view: HerosView,
    handler: AuthGuard.requireGuest
  },
  { 
    path: '/dashboard', 
    view: DashboardView,
    handler: AuthGuard.requireAuth
  },
  { 
    path: '/dashboard/*',
    view: DashboardView,
    handler: AuthGuard.requireAuth
  },
  { 
    path: '*', 
    view: HomeView
  }
];

const router = new Router(routes);

window.addEventListener('DOMContentLoaded', () => {
  router.handleRoute();
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  errorBoundary.handleError(event.reason);
});

export default router;