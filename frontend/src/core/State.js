export class State {
    constructor(initialState = {}) {
      this.state = initialState;
      this.subscribers = new Set();
    }
  
    subscribe(callback) {
      this.subscribers.add(callback);
      return () => this.subscribers.delete(callback);
    }
  
    getState() {
      return this.state;
    }
  
    setState(newState) {
      this.state = { ...this.state, ...newState };
      this.notify();
    }
  
    notify() {
      this.subscribers.forEach(callback => callback(this.state));
    }
  }