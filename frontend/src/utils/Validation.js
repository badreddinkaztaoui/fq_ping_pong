export class Validation {
    username(value) {
      const pattern = /^[a-zA-Z0-9_]{3,20}$/;
      return pattern.test(value);
    }
    
    email(value) {
      const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return pattern.test(value);
    }

    password(value) {
      const pattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;
      return pattern.test(value);
    }
  
    required(value) {
      return value !== null && value !== undefined && value !== '';
    }
  
    minLength(value, min) {
      return value.length >= min;
    }
  }