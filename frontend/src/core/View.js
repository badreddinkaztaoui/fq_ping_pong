export class View {
  constructor() {
    this.element = null;
    this.listeners = new Map();
    this.childViews = new Set();
  }

  async mount(parent) {
    try {
      this.element = await this.render();
      
      if (!this.element) {
        throw new Error('Render method must return a valid DOM element');
      }

      if (parent && parent.appendChild) {
        parent.appendChild(this.element);
      } else {
        throw new Error('Invalid parent element provided to mount');
      }

      await this.setupEventListeners();
      
      await this.afterMount();
      
      return true;
    } catch (error) {
      console.error('Error mounting view:', error);
      return false;
    }
  }

  async unmount() {
    try {
      await this.beforeUnmount();
      this.removeEventListeners();
      
      for (const childView of this.childViews) {
        await childView.unmount();
      }
      this.childViews.clear();
      
      if (this.element?.parentElement) {
        this.element.parentElement.removeChild(this.element);
      }
      this.element = null;
      
      return true;
    } catch (error) {
      console.error('Error unmounting view:', error);
      return false;
    }
  }

  async render() {
    throw new Error('Render method must be implemented');
  }

  addListener(element, event, handler, options = {}) {
    if (!element || typeof element.addEventListener !== 'function') {
      console.warn('Invalid element provided to addListener');
      return false;
    }

    try {
      element.addEventListener(event, handler, options);
      
      if (!this.listeners.has(element)) {
        this.listeners.set(element, new Map());
      }
      this.listeners.get(element).set(event, {
        handler,
        options
      });
      
      return true;
    } catch (error) {
      console.error('Error adding event listener:', error);
      return false;
    }
  }

  removeEventListeners() {
    for (const [element, events] of this.listeners) {
      for (const [event, { handler, options }] of events) {
        if (element && typeof element.removeEventListener === 'function') {
          try {
            element.removeEventListener(event, handler, options);
          } catch (error) {
            console.error('Error removing event listener:', error);
          }
        }
      }
    }
    this.listeners.clear();
  }

  async addChildView(view, container) {
    if (!container) {
      console.error('Container element is required to add child view');
      return false;
    }
    
    try {
      const mounted = await view.mount(container);
      if (mounted) {
        this.childViews.add(view);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding child view:', error);
      return false;
    }
  }

  $(selector) {
    return this.element?.querySelector(selector);
  }

  $$(selector) {
    return this.element?.querySelectorAll(selector);
  }

  async setupEventListeners() {}
  async afterMount() {}
  async beforeUnmount() {}
  
}