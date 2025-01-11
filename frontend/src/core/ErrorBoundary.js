export class ErrorBoundary {
    constructor() {
      this.errorHandler = this.handleError.bind(this);
      window.addEventListener('error', this.errorHandler);
      window.addEventListener('unhandledrejection', this.errorHandler);
    }
  
    handleError(error) {
      console.error('Application Error:', error);
      // You can implement custom error handling logic here
      // such as showing an error modal or redirecting to an error page
    }
  
    destroy() {
      window.removeEventListener('error', this.errorHandler);
      window.removeEventListener('unhandledrejection', this.errorHandler);
    }
  }