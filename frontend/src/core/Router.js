import { userState } from '../utils/UserState.js';
import { Layout } from "./Layout.js"

export class Router {
  constructor(routes) {
    this.routes = routes;
    this.currentView = null;
    this.currentLayout = null;
    this.userState = userState;

    window.addEventListener('popstate', this.handleRoute.bind(this));
    document.addEventListener('DOMContentLoaded', this.handleRoute.bind(this));
  }

  navigate(path) {
    window.history.pushState({}, '', path);
    this.handleRoute();
  }

  parseParams(routePath, currentPath) {
    const routeParts = routePath.split('/');
    const currentParts = currentPath.split('/');
    const params = {};

    if (routeParts.length !== currentParts.length) return null;

    for (let i = 0; i < routeParts.length; i++) {
        if (routeParts[i].startsWith(':')) {
            params[routeParts[i].slice(1)] = currentParts[i];
        } else if (routeParts[i] !== currentParts[i]) {
            return null;
        }
    }

    return params;
}

  findRoute(path) {
    for (const route of this.routes) {
      const params = this.parseParams(route.path, path);
      if (params !== null) {
        return { route, params };
      }
    }
    return {
      route: this.routes.find(route => route.path === '*'),
      params: {}
    };
  }

  async handleRoute() {
    const path = window.location.pathname;
    const { route, params } = this.findRoute(path);

    try {
      while (this.userState.getState().loading) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      if (route.handler) {
        const canProceed = await route.handler(params, this);
        if (!canProceed) {
          return;
        }
      }

      if (this.currentView) {
        await this.currentView.unmount();
        this.currentView = null;
      }

      if (this.currentLayout) {
        await this.currentLayout.unmount();
        this.currentLayout = null;
      }

      this.currentView = new route.view(params);
      this.currentView.router = this;

      const authPages = ['/login', '/signup', '/reset-password'];
      const isAuthPage = authPages.some(authPath => path === authPath);
      const layoutType = path.startsWith('/dashboard') ? 'dashboard' : 'landing';
      
      const appContainer = document.getElementById('app');
      
      while (appContainer.firstChild) {
        appContainer.removeChild(appContainer.firstChild);
      }

      if (isAuthPage) {
        await this.currentView.mount(appContainer);
      } else {
        this.currentLayout = new Layout(this.currentView, layoutType, this);
        await this.currentLayout.mount(appContainer);
      }
    } catch (error) {
      console.error('Route handling error:', error);
    }
  }
}