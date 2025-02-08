export class MessageHandler {
    constructor(options = {}) {
      this.defaultDuration = options.duration || 5000;
      this.container = this.createContainer();
      
      this.success = this.success.bind(this);
      this.error = this.error.bind(this);
      this.warning = this.warning.bind(this);
      this.show = this.show.bind(this);
      this.remove = this.remove.bind(this);
    }
  
    createContainer() {
      const container = document.createElement('div');
      container.className = 'message-toast-container';
      document.body.appendChild(container);
      return container;
    }
  
    createMessageElement(message, type) {
      const element = document.createElement('div');
      element.className = `message-toast message-toast-${type}`;
      
      const icon = document.createElement('span');
      icon.className = 'message-toast-icon';
      icon.innerHTML = this.getTypeIcon(type);
      element.appendChild(icon);
      
      const text = document.createElement('span');
      text.className = 'message-toast-text';
      text.textContent = message;
      element.appendChild(text);
      
      return element;
    }
  
    getTypeIcon(type) {
      const icons = {
        success: '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"></path></svg>',
        error: '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"></path></svg>',
        warning: '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"></path></svg>'
      };
      return icons[type] || icons.success;
    }
  
    show(message, type, duration = this.defaultDuration) {
      const element = this.createMessageElement(message, type);
      element.style.opacity = '0';
      this.container.appendChild(element);
      
      setTimeout(() => {
        element.style.opacity = '1';
      }, 50);
      
      setTimeout(() => this.remove(element), duration);
      return element;
    }
  
    remove(element) {
      element.style.opacity = '0';
      element.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (element.parentNode === this.container) {
          this.container.removeChild(element);
        }
      }, 300);
    }
  
    success(message, duration) {
      return this.show(message, 'success', duration);
    }
  
    error(message, duration) {
      return this.show(message, 'error', duration);
    }
  
    warning(message, duration) {
      return this.show(message, 'warning', duration);
    }
  }