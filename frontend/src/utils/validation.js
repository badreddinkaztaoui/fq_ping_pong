export class Validation {
    static email(value) {
      const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return pattern.test(value);
    }
  
    static required(value) {
      return value !== null && value !== undefined && value !== '';
    }
  
    static minLength(value, min) {
      return value.length >= min;
    }
  }