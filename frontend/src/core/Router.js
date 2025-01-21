import { userState } from '../utils/UserState.js';


export class Router {
  constructor(routes) {
    this.routes = routes;
    this.currentView = null;
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

    if (routePath.endsWith('*')) {
      const baseRouteParts = routePath.slice(0, -2).split('/');
      if (currentPath.startsWith(baseRouteParts.join('/'))) {
        return params;
      }
      return null;
    }

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
      }
  
      this.currentView = new route.view(params);
      this.currentView.router = this;
  
      await this.currentView.mount(document.getElementById('app'));
    } catch (error) {
      console.error('Route handling error:', error);
    }
  }
}