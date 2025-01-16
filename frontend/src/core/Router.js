export class Router {
  constructor(routes) {
    this.routes = routes;
    this.currentView = null;
    
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

    if (route.handler) {
      try {
        await route.handler(params);
        return;
      } catch (error) {
        console.error('Route handler error:', error);
      }
    }

    if (this.currentView) {
      await this.currentView.unmount();
    }

    this.currentView = new route.view(params);
    this.currentView.router = this;

    await this.currentView.mount(document.getElementById('app'));
  }
}