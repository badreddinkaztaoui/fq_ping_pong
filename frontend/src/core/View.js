export class View {
  constructor() {
    this.element = null;
    this.listeners = new Map();
    this.childViews = new Set();
  }

  async mount(parent) {
    this.element = await this.render();
    parent.appendChild(this.element);
    await this.setupEventListeners();
    await this.afterMount();
  }

  async unmount() {
    await this.beforeUnmount();
    this.removeEventListeners();
   
    for (const childView of this.childViews) {
      await childView.unmount();
    }
    this.childViews.clear();
    
    if (this.element && this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
    this.element = null;
  }

  async render() {
    throw new Error('Render method must be implemented');
  }

  addListener(element, event, handler, options = {}) {
    if (!element || typeof element.addEventListener !== 'function') {
      console.warn('Invalid element provided to addListener');
      return;
    }

    element.addEventListener(event, handler, options);
    
    if (!this.listeners.has(element)) {
      this.listeners.set(element, new Map());
    }
    this.listeners.get(element).set(event, {
      handler,
      options
    });
  }

  removeEventListeners() {
    for (const [element, events] of this.listeners) {
      for (const [event, { handler, options }] of events) {
        if (element && typeof element.removeEventListener === 'function') {
          element.removeEventListener(event, handler, options);
        }
      }
    }
    this.listeners.clear();
  }

  async addChildView(view, container) {
    await view.mount(container);
    this.childViews.add(view);
  }

  async setupEventListeners() {}
  
  async afterMount() {}
  
  async beforeUnmount() {}
  
  $(selector) {
    return this.element?.querySelector(selector);
  }

  $$(selector) {
    return this.element?.querySelectorAll(selector);
  }
}